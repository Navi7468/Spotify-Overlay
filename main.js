const { app, BrowserWindow, ipcMain } = require("electron");
const SpotifyWebApi = require("spotify-web-api-node");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Spotify API with credentials
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
});

// Global variables to manage application state
let mainWindow, authWindow;
let currentSong, progressMs, durationMs, imageUrl;
let currentArtists = [];

// Turn off hardware acceleration for window transparency
app.disableHardwareAcceleration();


// Create Authentication Window
function createAuthWindow() {
    authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: false
        },
        frame: false,
        transparent: true,
    });

    const scopes = ["user-read-private", "user-read-email", "user-modify-playback-state", "user-read-currently-playing", "user-read-playback-state"];
    const authUrl = spotifyApi.createAuthorizeURL(scopes);
    authWindow.loadURL(authUrl);
    authWindow.show();
    authWindow.webContents.on("did-redirect-navigation", handleAuthRedirect);
}

async function handleAuthRedirect(event, url) {
    if (!url.startsWith(process.env.REDIRECT_URI)) return;
    const newUrl = new URL(url);
    const code = newUrl.searchParams.get("code");
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    authWindow.close();
    createMainWindow();
}

// Create Main Application Window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
        alwaysOnTop: true,
        transparent: true,
    });

    mainWindow.loadFile("app/index.html");
    setInterval(updateSong, 1000);
}



// Setup Event Handlers
function setupEventHandlers() {
    app.on("ready", createAuthWindow);
    app.on("window-all-closed", onAllWindowsClosed);
    app.on("activate", onAppActivate);
    ipcMain.on('get-current-song', getCurrentSong);
    ipcMain.on('prev-song', () => spotifyApi.skipToPrevious());
    ipcMain.on('play-pause', togglePlayPause);
    ipcMain.on('next-song', () => spotifyApi.skipToNext());
}

function onAllWindowsClosed() {
    if (process.platform !== "darwin") app.quit();
}

function onAppActivate() {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
}

async function getCurrentSong() {
    try {
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        if (data.body && data.body.item) return mainWindow.webContents.send('update-song', data.body.item.name);  
        mainWindow.webContents.send('update-song', 'Nothing is playing');
    } catch (error) {
        console.error('Error fetching current song:', error);
    }
}

async function togglePlayPause() {
    try {
        const data = await spotifyApi.getMyCurrentPlaybackState();
        if (data.body && data.body.is_playing) return spotifyApi.pause(); 
        spotifyApi.play();
    } catch (error) {
        console.error('Error toggling play/pause:', error);
    }
}

async function updateSong() {
    try {
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        if (!data.body || !data.body.item) return mainWindow.webContents.send('update-song', 'Nothing is playing');

        const newSong = data.body.item;
        currentSong = newSong.name;
        currentArtists = newSong.artists.map(artist => artist.name);
        progressMs = data.body.progress_ms;
        durationMs = newSong.duration_ms;
        imageUrl = newSong.album.images[0].url;
        
        mainWindow.webContents.send('update-song', { name: currentSong, currentArtists, progressMs, durationMs, imageUrl });
    } catch (error) {
        console.error('Failed to update song:', error);
    }
}

// Call setupEventHandlers at the end of the script
setupEventHandlers();