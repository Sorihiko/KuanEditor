// 宽 Kuan 桌面版：用 Electron 把网页版（app/index.html）装进一个窗口
const { app, BrowserWindow, shell, session, Menu } = require('electron');
const path = require('path');

// 只开一个窗口：再次双击 exe 时把已有窗口拉到前面
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 900, minHeight: 600,
    backgroundColor: '#0e0f11',
    title: '宽 Kuan',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  // 外部链接用系统浏览器打开，不在编辑器窗口里跳走
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // 不许页面跳走（比如文件拖到没接住的地方时 Chromium 会去打开那个文件）；网页链接交给系统浏览器
  win.webContents.on('will-navigate', (e, url) => { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); });
  // F12 / Ctrl+Shift+I 打开开发者工具（出问题时方便看报错），F5 / Ctrl+R 刷新
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const k = input.key.toLowerCase();
    if (input.key === 'F12' || (input.control && input.shift && k === 'i')) { win.webContents.toggleDevTools(); e.preventDefault(); }
    else if (input.key === 'F5' || (input.control && !input.shift && k === 'r')) { win.webContents.reload(); e.preventDefault(); }
  });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // 打开谱面文件夹（File System Access）、全屏等权限：本地应用直接允许
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(true));
  session.defaultSession.setPermissionCheckHandler(() => true);
  createWindow();
});
app.on('window-all-closed', () => app.quit());
