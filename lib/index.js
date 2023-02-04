const socket = require('ws');
const output = document.getElementById('output');
require('dotenv').config();
const port = process.env.PORT || 1111;
const ws = new socket(`ws://localhost:${port}`);
const path = require('path');

const { execFile } = require('child_process');

// get the path to the python file formated: ./main.py (relative to this file)

const pythonPath = path.join(__dirname, 'lib/main.py');

console.log(pythonPath);

execFile('python', [pythonPath], (error, stdout, stderr) => {
    if (error) {
        throw error;
    }
    console.log(stdout);
});

let oldimg, currentSong;

ws.onopen = function () {
    console.log('connected');
    setTimeout(() => {
        ws.send('getSong');
    }, 1000);
};

let expanded = false;

ws.onmessage = function (msg) {
    if (msg.data.startsWith('spotify:')) {
        let string = msg.data;
        string = string.split('spotify:')[1];
        const spotifyJSON = JSON.parse(string);

        const artist = spotifyJSON.artist_name;
        const song = spotifyJSON.song_name;
        const duration = spotifyJSON.song_duration;
        const newimg = spotifyJSON.song_image_url;
        const timestamp = spotifyJSON.timeStamp;
        // console.log(currentSong, song)
        if (oldimg == null) {
            oldimg = newimg;
        }

        // console.log(newimg)

        output.innerHTML = `
        <div class="song" id="song">
            <img src="${newimg}" width="150" id="img">
            <div class="background" id="background-container">
            <img src="${newimg}" id="hi" class="abs1 background-blured" data-reveal="left">
            <img src="${oldimg}" id="background" class="abs2 background-blured">
            </div>
            <div id="hover"></div>
            <div class="song-info" id="song-info">
                <div class="text" id="text">
                    <h4>${song}</h4>
                    <p>${artist}</p>
                </div>
                <div class="time">
                    <p>${timestamp} - ${duration}</p>
                </div>
            </div>
        </div>

        `;



        // <img src="${oldimg}" id="background" class="abs2">
        const background = document.getElementById('background');
        const songId = document.getElementById('song');
        const imgId = document.getElementById('img');
        const buttons = document.querySelectorAll('button');
        const backgroundContainer = document.getElementById('hover');
        let buttonColor = "";

        {
            songId.style.color = spotifyJSON.text_color;
            if (spotifyJSON.text_color == 'white') {
                songId.style.textShadow = 'rgba(0, 0, 0, 0.6) 0 0 10px';
                imgId.style.boxShadow = 'rgba(255, 255, 255, 0.6) 0 0 10px';
                buttonColor = 'white';
            } else if (spotifyJSON.text_color == 'black') {
                songId.style.textShadow = 'rgba(255, 255, 255, 0.6) 0 0 10px';
                imgId.style.boxShadow = 'rgba(0, 0, 0, 0.6) 0 0 10px';
                buttonColor = 'black';
            }



            imgId.addEventListener('mouseover', () => {
                buttons.forEach(button => {
                    if (!button.id.includes('expand')) {

                        button.style.color = buttonColor;
                        button.style.opacity = 0.8;
                        if (buttonColor == 'white') {
                            button.style.textShadow = 'rgba(0, 0, 0, 0.8) 0 0 10px';
                        } else if (buttonColor == 'black') {
                            button.style.textShadow = 'rgba(255, 255, 255, 0.8) 0 0 10px';
                        }
                    }
                });
            });

            imgId.addEventListener('mouseout', () => {
                buttons.forEach(button => {
                    if (!button.id.includes('expand')) {
                        button.style.color = "rgba(0, 0, 0, 0)";
                        button.style.textShadow = 'none';
                        button.style.opacity = 0.6;
                    }
                });
            });

            buttons.forEach(button => {
                if (!button.id.includes('expand')) {
                    button.addEventListener('mouseover', () => {
                        buttons.forEach(button => {
                            button.style.color = buttonColor;
                            button.style.opacity = 0.5;
                        });
                        button.style.opacity = 1;
                    });

                    button.addEventListener('mouseout', () => {
                        button.style.color = "rgba(0, 0, 0, 0)";
                    });
                } else {
                    // button.addEventListener('mouseover', () => {
                    //     buttons.forEach(button => {
                    //         if (button.id.includes('expand')) {
                    //             button.style.color = buttonColor;
                    //             button.style.opacity = 0.8;
                    //         }
                    //     });
                    // });

                    // button.addEventListener('mouseout', () => {
                    //     buttons.forEach(button => {
                    //         if (button.id.includes('expand')) {
                    //             button.style.color = "rgba(0, 0, 0, 0)";
                    //         }
                    //     });
                    // });
                }
            });

            // if (background.style.backgroundImage != `url(${newimg})`) {
            // background.style.backgroundImage = `url(${newimg})`;
            // }
        }

        const Background_Container = document.getElementById('background-container');
        if (currentSong != song && currentSong != undefined) {
            changeBackground(oldimg, newimg);
            console.log('changed')
            oldimg = newimg;
            currentSong = song;
        } else {
            oldimg = newimg;
            currentSong = song;
        }
    }
};



function changeBackground(oldimg, newimg) {
    // console.log(oldimg);
    // console.log(newimg);
    const Background_Container = document.getElementById('background-container');
    Background_Container.innerHTML += `
        <img src="${newimg}" id="hi" class="abs1 background-blured" data-reveal="left">
        <img src="${oldimg}" id="background" class="abs2 background-blured">
    `;


    const revealElements = document.getElementById('hi');
    const mainRevealElements = document.getElementById('background');
    revealElements.classList.add("revealed")
    console.log(revealElements);
    console.log(mainRevealElements);

    // mainRevealElements.style.display = 'none';
    mainRevealElements.classList.remove("revealed")
    console.log("revealed");
    setTimeout(() => {
        console.log("removed");
        revealElements.classList.remove("revealed")
        mainRevealElements.classList.remove("revealed")
        console.log(revealElements);
        console.log(mainRevealElements);
    }, 5000);

}



function loop() {
    setTimeout(function () {
        ws.send('getSong');
        loop();
        // console.log('loop');
    }, 1000);
}

loop();


function send() {
    ws.send("getSong");
}

function skip() {
    ws.send("skip");
}

function rewind() {
    ws.send("rewind");
}

function pause() {
    ws.send("pause");
    document.getElementById('pause').style.display = 'none';
    document.getElementById('play').style.display = 'block';
}

function play() {
    ws.send("play");
    document.getElementById('pause').style.display = 'block';
    document.getElementById('play').style.display = 'none';
}
document.getElementById('play').style.display = 'none';
// document.getElementById('expand_l').style.display = 'none';








function expand() {
    if (!expanded) {
        expanded = true;
        expandPage();
    } else {
        expanded = false;
        shrinkPage();
    }
}



function expandPage() {
    // ws.send("queuelist");
}