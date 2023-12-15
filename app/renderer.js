const { ipcRenderer } = require('electron');
const getImageColors = require('get-image-colors');

// DOM Elements
const songElement = document.getElementById('song');
const artistElement = document.getElementById('artist');
const currentTimeElement = document.getElementById('current-time');
const durationElement = document.getElementById('duration');
const progressBarElement = document.getElementById('progress');
const scrubberElement = document.getElementById('scrubber');
const controlButtons = {
    prev: document.getElementById('prev'),
    play: document.getElementById('play'),
    next: document.getElementById('next')
};
const materialIcons = document.querySelectorAll('.material-icons');

// Album Covers
const previousAlbumCovers = document.querySelectorAll('.previous-album-cover');
const currentAlbumCovers = document.querySelectorAll('.current-album-cover');

// Global song time tracking
let lastUpdateTimestamp = Date.now();
let animationFrameId;
let songTime = { progressMs: 0, durationMs: 0 };

// Event Listeners
setupEventListeners();
ipcRenderer.on('update-song', handleSongUpdate);


// Setup Event Listeners
function setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
        controlButtons.prev.addEventListener('click', () => ipcRenderer.send('prev-song'));
        controlButtons.play.addEventListener('click', () => ipcRenderer.send('play-pause'));
        controlButtons.next.addEventListener('click', () => ipcRenderer.send('next-song'));
    });

    currentAlbumCovers.forEach(cover => {
        cover.addEventListener('animationend', () => {
            cover.classList.remove('revealed');
            swapCoverSources(cover);
        });
    });
}

// Handle IPC Song Update Event
function handleSongUpdate(event, song) {
    songTime = song;
    updateDOMWithSongData(song);
    startSmoothProgressAnimation();
    updateAlbumCovers(song.imageUrl);
}

// Update DOM with Song Data
function updateDOMWithSongData(song) {
    songElement.textContent = song.name;
    artistElement.textContent = song.currentArtists.join(', ');
    currentTimeElement.textContent = msToTime(song.progressMs);
    durationElement.textContent = msToTime(song.durationMs);
}

// Start Smooth Progress Animation
function startSmoothProgressAnimation() {
    lastUpdateTimestamp = Date.now();
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(smoothProgress);
    }
}

// Smooth Progress Animation Logic
function smoothProgress() {
    const now = Date.now();
    const elapsedTime = now - lastUpdateTimestamp;
    lastUpdateTimestamp = now;

    // Update the song's progress
    songTime.progressMs += elapsedTime;

    // Calculate the progress percentage
    const progressPercentage = (songTime.progressMs / songTime.durationMs) * 100;

    // Set the new width and position
    progressBarElement.style.width = `${progressPercentage}%`;
    const scrubberElement = document.getElementById("scrubber");
    scrubberElement.style.left = `${progressPercentage}%`;

    // Stop the animation if the song is over or not playing
    if (songTime.progressMs >= songTime.durationMs) {
        cancelAnimationFrame(animationFrameId);
        return;
    }

    // Request the next animation frame
    animationFrameId = requestAnimationFrame(smoothProgress);
}

// Stop Animation
function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Set Element Styles (Text Color and Shadow)
function setElementStyles(elements, textColor, textShadow) {
    elements.forEach(element => {
        element.style.color = textColor;
        element.style.textShadow = textShadow;
    });
}

// Update Album Covers
function updateAlbumCovers(imageUrl) {
    currentAlbumCovers.forEach((cover) => {
        if (cover.src !== imageUrl) {
            cover.src = imageUrl;
            cover.style.display = cover.src ? "block" : "none";
            cover.classList.add("revealed");

            if (cover.complete) {
                extractColors(cover);
            } else {
                cover.addEventListener("load", function () {
                    extractColors(this);
                });
            }

            getImageBrightness(cover.src, (brightness) => {
                var textColor = brightness > 130 ? "black" : "white";
                var textShadow = brightness > 130 ? "0 0 5px rgba(255, 255, 255, 0.5)" : "0 0 5px rgba(0, 0, 0, 0.5)";
                
                const elementsToStyle = [
                    songElement,
                    artistElement,
                    currentTimeElement,
                    durationElement,
                    ...Array.from(materialIcons) // Convert NodeList to Array
                ];
                setElementStyles(elementsToStyle, textColor, textShadow);
            });
        }
    });
}

// Extract Colors from Image
function extractColors(imageElement) {
    getImageColors(imageElement.src)
        .then((colors) => {
            // colors is an array of color objects from the 'chroma-js' library
            console.log(colors);
            const dominantColor = colors[1].hex();
            progressBarElement.style.backgroundColor = dominantColor;
            // Optional: Set the color of other elements, like text or icons, based on the brightness of the dominant color
        })
        .catch((error) => {
            console.error("Error extracting colors", error);
        });
}

// Swap Cover Sources
function swapCoverSources(cover) {
    previousAlbumCovers.forEach((prevCover) => {
        let tempSrc = cover.src;
        prevCover.src = cover.src;
        cover.src = tempSrc;
    });
}

// Get Image Brightness
function getImageBrightness(imageSrc, callback) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
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

// Convert Milliseconds to Time Format
function msToTime(duration) {
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let seconds = Math.floor((duration / 1000) % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}