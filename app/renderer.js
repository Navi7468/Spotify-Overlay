const { ipcRenderer } = require('electron');

const songElement = document.getElementById('song');
const prevButton = document.getElementById('prev');
const playButton = document.getElementById('play');
const nextButton = document.getElementById('next');

let backgroundAlbumCover = document.getElementById('background-album-cover');
let currentAlbumCover = document.getElementById('current-album-cover');
let nextAlbumCover = document.getElementById('next-album-cover');

ipcRenderer.on('update-song', (event, song) => {
    songElement.textContent = `${song.name} (${msToTime(song.progressMs)}/${msToTime(song.durationMs)})`;
    // Update the album cover image
    if (currentAlbumCover.src !== song.imageUrl) {
        nextAlbumCover.src = song.imageUrl;
        nextAlbumCover.style.opacity = '1';
        currentAlbumCover.style.opacity = '0';
        // Wait for the transition to finish before swapping the album covers
        setTimeout(() => {
            [currentAlbumCover, nextAlbumCover] = [nextAlbumCover, currentAlbumCover];
            // Reset the opacity of the new nextAlbumCover so it's ready for the next transition
            nextAlbumCover.style.opacity = '0';
            // Update the background album cover
            backgroundAlbumCover.src = currentAlbumCover.src;
        }, 1000); // The duration of the transition in milliseconds
    }
});

function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let seconds = Math.floor((duration / 1000) % 60);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
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

ipcRenderer.send('get-current-song');