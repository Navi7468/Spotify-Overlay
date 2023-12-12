const { app, BrowserWindow, ipcMain } = require('electron');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
dotenv.config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

let mainWindow;
let currentSong, currentProgressMs, currentDurationMs, currentImageUrl;

function createAuthWindow() {
    const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: false,
        }
    });

    const scopes = ['user-read-private', 'user-read-email', 'user-modify-playback-state', 'user-read-currently-playing', 'user-read-playback-state'];
    const authUrl = spotifyApi.createAuthorizeURL(scopes);

    authWindow.loadURL(authUrl);
    authWindow.show();

    authWindow.webContents.on('did-redirect-navigation', async (event, url) => {
        if (url.startsWith(process.env.REDIRECT_URI)) {
            const newUrl = new URL(url);
            const code = newUrl.searchParams.get('code');
            const data = await spotifyApi.authorizationCodeGrant(code);

            const { access_token, refresh_token } = data.body;
            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            authWindow.close();
            createMainWindow();
        }
    });
}

async function updateSong() {
    try {
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        if (data.body.item) {
            const newSong = data.body.item;
            if (newSong.name !== currentSong) {
                currentSong = newSong.name;
                progressMs = data.body.progress_ms;
                durationMs = newSong.duration_ms;
                imageUrl = newSong.album.images[0].url;
                mainWindow.webContents.send('update-song', { name: currentSong, progressMs, durationMs, imageUrl });
            } else {
                progressMs = data.body.progress_ms;
                mainWindow.webContents.send('update-song', { name: currentSong, progressMs, durationMs, imageUrl });
            }
        }
    } catch (error) {
        console.error('Failed to update song:', error);
    }
}


function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        alwaysOnTop: true,
    });

    mainWindow.loadFile('app/index.html');

    setInterval(updateSong, 1000);

    ipcMain.on('get-current-song', async () => {
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        mainWindow.webContents.send('update-song', data.body.item.name);
    });

    ipcMain.on('prev-song', () => {
        spotifyApi.skipToPrevious();
    });

    ipcMain.on('play-pause', async () => {
        const data = await spotifyApi.getMyCurrentPlaybackState();
        if (data.body.is_playing) {
            spotifyApi.pause();
        } else {
            spotifyApi.play();
        }
    });

    ipcMain.on('next-song', () => {
        spotifyApi.skipToNext();
    });
}

app.on('ready', createAuthWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});