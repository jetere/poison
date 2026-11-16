/** Desktop-only scene file commands. Browser builds continue to work without Electron. */
type PoisonScene = { game: 'poison'; name?: string; objs: unknown[]; [key: string]: unknown };
type OpenResult = { canceled: boolean; path?: string; data?: PoisonScene };
type SaveResult = { canceled: boolean; path?: string };
type MenuAction = 'open' | 'save' | 'saveAs';
interface DesktopBridge {
  openProject(): Promise<OpenResult>;
  confirmOpenProject(path: string): Promise<boolean>;
  saveProject(data: PoisonScene, saveAs?: boolean): Promise<SaveResult>;
  onMenuAction(callback: (action: MenuAction) => void): () => void;
}
interface StudioBridge {
  open(): void;
  serialize(): PoisonScene;
  deserialize(scene: PoisonScene): void;
}
declare global {
  interface Window {
    poisonDesktop?: DesktopBridge;
    poisonStudio?: StudioBridge;
  }
}

const desktop = window.poisonDesktop;
if (desktop) {
  const bridge: DesktopBridge = desktop;
  let busy = false;
  const toast = document.createElement('div');
  toast.id = 'poison-desktop-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  let toastTimeout: number | undefined;
  function notify(message: string, error = false) {
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('visible'), 3800);
  }
  async function handle(action: MenuAction) {
    if (busy) return;
    const studio = window.poisonStudio;
    if (!studio) return notify('Studio is still starting.', true);
    busy = true;
    try {
      if (action === 'open') {
        const opened = await bridge.openProject();
        if (opened.canceled || !opened.data || !opened.path) return;
        // Poison's own validator rejects invalid scene objects and disables imported scripts.
        studio.deserialize(opened.data);
        studio.open();
        await bridge.confirmOpenProject(opened.path);
        notify(`Opened ${opened.path.split(/[\\/]/).pop()}`);
      } else {
        const saved = await bridge.saveProject(studio.serialize(), action === 'saveAs');
        if (!saved.canceled) notify(`Saved ${saved.path?.split(/[\\/]/).pop() || 'scene'}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      notify(`${action === 'open' ? 'Open' : 'Save'} failed: ${message}`, true);
      console.error('[Poison desktop]', err);
    } finally {
      busy = false;
    }
  }
  bridge.onMenuAction(action => { void handle(action); });
}
export {};
