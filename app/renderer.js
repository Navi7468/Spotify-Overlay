const { ipcRenderer } = require('electron');

// DOM Elements
const songElement = document.getElementById('song');
const artistElement = document.getElementById('artist');
const currentTimeElement = document.getElementById('current-time');
const durationElement = document.getElementById('duration');
const progressBarElement = document.getElementById('progress');
const prevButton = document.getElementById('prev');
const playButton = document.getElementById('play');
const nextButton = document.getElementById('next');

// Album Covers
let previousAlbumCovers = document.querySelectorAll('.previous-album-cover');
let currentAlbumCovers = document.querySelectorAll('.current-album-cover');

// Event Listeners
prevButton.addEventListener('click', () => ipcRenderer.send('prev-song'));
playButton.addEventListener('click', () => ipcRenderer.send('play-pause'));
nextButton.addEventListener('click', () => ipcRenderer.send('next-song'));

// Update song information
ipcRenderer.on('update-song', (event, song) => {
    songElement.textContent = song.name;
    artistElement.textContent = song.artist;
    currentTimeElement.textContent = msToTime(song.progressMs);
    durationElement.textContent = msToTime(song.durationMs);
    progressBarElement.style.width = `${(song.progressMs / song.durationMs) * 100}%`;

    updateAlbumCovers(song.imageUrl);
});

// Swap the 'src' and classes of the images after the animation ends
currentAlbumCovers.forEach(cover => {
    cover.addEventListener('animationend', () => {
        cover.classList.remove('revealed');
        swapCoverSources(cover);
    });
});

// Helper Functions
function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let seconds = Math.floor((duration / 1000) % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function updateAlbumCovers(imageUrl) {
    currentAlbumCovers.forEach(cover => {
        if (cover.src !== imageUrl) {
            cover.src = imageUrl;
            cover.style.display = cover.src ? 'block' : 'none';
            cover.classList.add('revealed');
        }
    });
}

function swapCoverSources(cover) {
    previousAlbumCovers.forEach(prevCover => {
        let tempSrc = cover.src;
        prevCover.src = cover.src;
        cover.src = tempSrc;
    });
}

prevButton.addEventListener('click', () => {
    ipcRenderer.send('prev-song');
});

playButton.addEventListener('click', () => {
    ipcRenderer.send('play-pause');
});

nextButton.addEventListener('click', () => {
    ipcRenderer.send('next-song');
});