const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const LIVE = 'https://shantells-closet.surge.sh/';
function create() {
  const win = new BrowserWindow({ width: 1100, height: 800, backgroundColor: '#3b1450', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false } });
  let fellBack = false;
  win.webContents.on('did-fail-load', (_e, code, _d, url, isMain) => {
    if (isMain && !fellBack) { fellBack = true; win.loadURL(LIVE); }
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // Bundled copy works offline; fall back to the live site if it fails to load.
  win.loadFile(path.join(__dirname, 'site', 'index.html')).catch(() => { if (!fellBack) { fellBack = true; win.loadURL(LIVE); } });
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
