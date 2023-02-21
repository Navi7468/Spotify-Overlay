const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
require('dotenv').config();
const port = process.env.PORT || 1111;





// Create WebSocket Server
const socket = require("ws");

var clients = [];
var lastMessages = [];
const webSocket = new socket.Server({ port: port });

webSocket.on("listening", () => {
    console.log("Listening on port " + port);
});

webSocket.on("connection", wsClient => {
    console.log("connection!");
    clients.push(wsClient);

    wsClient.on("message", msg => {
        // console.log("Message Received: " + msg);
        clients.forEach(client => {
            if (client.readyState === socket.OPEN) {
                client.send(msg.toString());
            }
        });
    });

    wsClient.on("close", () => {
        console.log("Client Disconnected");
    });
})







app.on('ready', () => {
    const win = new BrowserWindow({
        width: 520,
        height: 170,
        icon: 'MainPage/lib/trex.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        // resizable: false,
        transparent: true,
        frame: false,
        alwaysOnTop: true
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, './index.html'),
        protocol: 'file:',
        slashes: true
    }));
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
