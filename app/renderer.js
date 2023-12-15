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
const materialIcons = document.querySelectorAll('.material-icons');

// Album Covers
let previousAlbumCovers = document.querySelectorAll('.previous-album-cover');
let currentAlbumCovers = document.querySelectorAll('.current-album-cover');

document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    prevButton.addEventListener('click', () => { ipcRenderer.send('prev-song'); console.log("prev") });
    playButton.addEventListener('click', () => { ipcRenderer.send('play-pause'); console.log("pause") });
    nextButton.addEventListener('click', () => { ipcRenderer.send('next-song'); console.log("next") });
});

// Update song information
ipcRenderer.on('update-song', (event, song) => {
    songElement.textContent = song.name;
    artistElement.textContent = song.currentArtists.join(', ');
    currentTimeElement.textContent = msToTime(song.progressMs);
    durationElement.textContent = msToTime(song.durationMs);
    progressBarElement.style.width = `${(song.progressMs / song.durationMs) * 100}%`;

    updateAlbumCovers(song.imageUrl);
});

// Helper function to set text color and shadow for elements
function setElementStyles(elements, textColor, textShadow) {
    elements.forEach(element => {
        element.style.color = textColor;
        element.style.textShadow = textShadow;
    });
}

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


const getImageColors = require('get-image-colors');

function updateAlbumCovers(imageUrl) {
    currentAlbumCovers.forEach(cover => {
        if (cover.src !== imageUrl) {
            cover.src = imageUrl;
            cover.style.display = cover.src ? 'block' : 'none';
            cover.classList.add('revealed');

            if (cover.complete) {
                extractColors(cover);
            } else {
                cover.addEventListener('load', function () {
                    extractColors(this);
                });
            }
        }
    });
}

function extractColors(imageElement) {
    getImageColors(imageElement.src).then(colors => {
        // colors is an array of color objects from the 'chroma-js' library
        const dominantColor = colors[0].hex();
        progressBarElement.style.backgroundColor = dominantColor;
        // Optional: Set the color of other elements, like text or icons, based on the brightness of the dominant color
    }).catch(error => {
        console.error('Error extracting colors', error);
    });
}


function swapCoverSources(cover) {
    previousAlbumCovers.forEach(prevCover => {
        let tempSrc = cover.src;
        prevCover.src = cover.src;
        cover.src = tempSrc;
    });
}

function getImageBrightness(imageSrc, callback) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r, g, b, avg;
        let colorSum = 0;

        for (let x = 0, len = data.length; x < len; x += 4) {
            r = data[x];
            g = data[x + 1];
            b = data[x + 2];

            avg = Math.floor((r + g + b) / 3);
            colorSum += avg;
        }

        const brightness = Math.floor(colorSum / (img.width * img.height));
        callback(brightness);
    };
}
