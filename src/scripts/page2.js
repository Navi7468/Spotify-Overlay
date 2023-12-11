const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
dotenv.config();

var spotifyApi = new SpotifyWebApi();
spotifyApi.setClientId(process.env.CLIENT_ID);
spotifyApi.setClientSecret(process.env.CLIENT_SECRET);
spotifyApi.setRedirectURI(process.env.REDIRECT_URI);
