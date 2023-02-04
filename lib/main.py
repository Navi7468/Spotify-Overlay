import time
import websockets
import asyncio
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import json
import urllib.request
from PIL import Image, ImageStat
from dotenv import load_dotenv
import os

load_dotenv()

print("Starting up...")

sp_oauth = SpotifyOAuth(
    client_id='30009c44b2d743ad9cdb4ef8a4228812', client_secret='0548d71bd88549af836c29f7022c12f3', redirect_uri='http://localhost:8080/appSpotifyOverlay', scope='user-read-currently-playing, user-modify-playback-state, user-read-playback-state, user-read-recently-played, app-remote-control')

sp = spotipy.Spotify(auth_manager=sp_oauth)

print("Spotify API connected")


async def getSong():

    playing = sp.current_user_playing_track()

    song_name = playing['item']['name']

    artist_name = ""
    for item in playing['item']['artists']:
        if artist_name == "":
            artist_name += item['name']
        else:
            artist_name += ", " + item['name']

    song_duration_ms = playing['item']['duration_ms']
    duration_minutes, duration_seconds = divmod(song_duration_ms / 1000, 60)
    song_duration = "%d:%02d" % (duration_minutes, duration_seconds)

    timeStamp_ms = playing['progress_ms']
    timeStamp_minutes, timeStamp_seconds = divmod(timeStamp_ms / 1000, 60)
    timeStamp = "%d:%02d" % (timeStamp_minutes, timeStamp_seconds)

    song_image_url = playing['item']['album']['images'][0]['url']
    text_color = "white"
    # save image to a file
    urllib.request.urlretrieve(song_image_url, "song_image.jpg")

    def brightness(im_file):
        im = Image.open(im_file).convert('L')
        stat = ImageStat.Stat(im)
        return stat.mean[0]

    if brightness("song_image.jpg") > 100:
        text_color = "black"

    # turns the data into json
    data = json.dumps({
        "song_name": song_name,
        "artist_name": artist_name,
        "song_duration": song_duration,
        "timeStamp": timeStamp,
        "song_image_url": song_image_url,
        "text_color": text_color
    })
    return data


async def handler(message, websocket):
    print("In handler")
    if message == "skip":
        sp.next_track()
    elif message == "pause":
        sp.pause_playback()
    elif message == "play":
        sp.start_playback()
    elif message == "rewind":
        sp.previous_track()
    if message == "getSong":
        info = await getSong()
        await websocket.send("spotify:" + info)


async def hold_connection():
    async with websockets.connect("ws://localhost:1111") as websocket:
        while True:
            message = await websocket.recv()
            print(f"Received message in py: {message}")
            await handler(message, websocket)

asyncio.get_event_loop().run_until_complete(hold_connection())
