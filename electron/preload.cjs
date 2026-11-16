'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('poisonDesktop', Object.freeze({
  openProject: () => ipcRenderer.invoke('poison:open-project'),
  confirmOpenProject: path => ipcRenderer.invoke('poison:confirm-open-project', path),
  saveProject: (data, saveAs = false) => ipcRenderer.invoke('poison:save-project', { data, saveAs }),
  onMenuAction: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, action) => {
      if (action === 'open' || action === 'save' || action === 'saveAs') callback(action);
    };
    ipcRenderer.on('poison:menu-action', listener);
    return () => ipcRenderer.removeListener('poison:menu-action', listener);
  },
}));
