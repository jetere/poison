'use strict';
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const { readFile, writeFile, stat } = require('node:fs/promises');
const path = require('node:path');

const MAX_PROJECT_BYTES = 25 * 1024 * 1024;
const projectPaths = new Map();
const product = 'Poison';
let mainWindow;

function titleFor(filePath) {
  return filePath ? `${path.basename(filePath)} — ${product}` : product;
}
function activeWindow(event) {
  return BrowserWindow.fromWebContents(event.sender);
}
function notifyMenu(action) {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  if (win && !win.isDestroyed()) win.webContents.send('poison:menu-action', action);
}
function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [
      { label: 'Open Scene…', accelerator: 'CmdOrCtrl+O', click: () => notifyMenu('open') },
      { label: 'Save Scene to File', accelerator: 'CmdOrCtrl+S', click: () => notifyMenu('save') },
      { label: 'Save Scene As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => notifyMenu('saveAs') },
      { type: 'separator' },
      { role: 'quit', label: 'Exit' },
    ] },
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
    ] },
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'togglefullscreen' },
      ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }]),
    ] },
    { label: 'Help', submenu: [
      { label: 'About Poison', click: () => dialog.showMessageBox(mainWindow, {
        type: 'info', title: product, message: product,
        detail: 'Desktop edition powered by Electron. Scenes are compatible with Poison JSON exports.',
      }) },
    ] },
  ]));
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 620,
    title: product, backgroundColor: '#080b16',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  const thisWindow = mainWindow;
  thisWindow.on('closed', () => { projectPaths.delete(thisWindow.id); pendingOpenPaths.delete(thisWindow.id); if (mainWindow === thisWindow) mainWindow = null; });
  const devUrl = process.env.POISON_DEV_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

ipcMain.handle('poison:confirm-open-project', (event, filePath) => {
  const win = activeWindow(event);
  if (!win || typeof filePath !== 'string') return false;
  // Only a path previously selected in the native Open dialog may become active.
  if (pendingOpenPaths.get(win.id) !== filePath) return false;
  projectPaths.set(win.id, filePath);
  pendingOpenPaths.delete(win.id);
  win.setTitle(titleFor(filePath));
  return true;
});
const pendingOpenPaths = new Map();
// Save a selected open path only after successful validation in the editor.
ipcMain.handle('poison:open-project', async event => {
  const win = activeWindow(event);
  if (!win) throw new Error('No active window');
  const picked = await dialog.showOpenDialog(win, {
    title: 'Open Poison Scene', properties: ['openFile'],
    filters: [{ name: 'Poison scene JSON', extensions: ['json'] }],
  });
  if (picked.canceled || !picked.filePaths[0]) return { canceled: true };
  const filePath = picked.filePaths[0];
  if ((await stat(filePath)).size > MAX_PROJECT_BYTES) throw new Error('Scene exceeds 25 MB');
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  if (!data || data.game !== 'poison' || !Array.isArray(data.objs))
    throw new Error('This is not a valid Poison scene JSON file');
  pendingOpenPaths.set(win.id, filePath);
  return { canceled: false, path: filePath, data };
});

ipcMain.handle('poison:save-project', async (event, payload) => {
  const win = activeWindow(event);
  if (!win) throw new Error('No active window');
  const data = payload?.data;
  if (!data || data.game !== 'poison' || !Array.isArray(data.objs))
    throw new Error('Invalid Poison scene');
  const json = JSON.stringify(data, null, 2);
  if (Buffer.byteLength(json, 'utf8') > MAX_PROJECT_BYTES)
    throw new Error('Scene exceeds 25 MB');
  let filePath = !payload?.saveAs ? projectPaths.get(win.id) : null;
  if (!filePath) {
    const safeName = String(data.name || 'Poison_Level').replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) || 'Poison_Level';
    const picked = await dialog.showSaveDialog(win, {
      title: 'Save Poison Scene', defaultPath: `${safeName}.json`,
      filters: [{ name: 'Poison scene JSON', extensions: ['json'] }],
    });
    if (picked.canceled || !picked.filePath) return { canceled: true };
    filePath = picked.filePath;
  }
  await writeFile(filePath, json, 'utf8');
  projectPaths.set(win.id, filePath);
  win.setTitle(titleFor(filePath));
  return { canceled: false, path: filePath };
});

app.whenReady().then(() => {
  createMenu(); createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
