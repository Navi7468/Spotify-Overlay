const { app, BrowserWindow, Menu, protocol } = require('electron');


app.on('ready', () => {
    console.log('App is ready!');
    const win = new BrowserWindow({
        x: 600,
        y: 300,
        width: 750,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        // resizable: false,
        // transparent: true,
        // frame: false,
        alwaysOnTop: true
    });

    win.loadURL('http://localhost:2000/callback');
    win.loadFile('src/views/index.html');
    win.on('closed', () => { app.quit() });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);

});


const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() { app.quit() }
            },
            {
                label: 'Toggle DevTools',
                accelerator: process.platform === 'darwin' ? 'Command+Shift+I' : 'Ctrl+Shift+I',
                click(item, focusedWindow) { focusedWindow.toggleDevTools() }
            },
            { role: 'reload' }
        ]
    }
];
