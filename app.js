import { SpotifyWebApi } from './spotify-web-api.js';

import PlaylistDisplay from './classes/PlaylistDisplay.js';
import TrackList from './classes/TrackList.js';

let finalTrackIds;

// Create Spotify API object
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage.getItem('access-token'));

// Helper functions
const updateGenreDisplay = (trackNum, genres) => {
  let element = document.querySelector('#track' + trackNum);
  if (genres.length > 0) {
    element.textContent = 'Genres: ' + genres.join(', ');
  } else {
    element.textContent = 'No genres found.';
  }
};

const getPlaylistFromUri = (inputID) => {
  let uri = document.querySelector(inputID).value.trim();
  if (!uri.startsWith('spotify:playlist:')) {
    throw new Error('Invalid URI');
  }
  return uri.slice(17);
};

const displayOldTracks = (data) => {
  let display = new PlaylistDisplay(data);
  document.querySelector('#old_track_order').append(display.getDisplay());
};

const displayNewTracks = (data) => {
  let display = new PlaylistDisplay(data);
  document.querySelector('#new_track_order').append(display.getDisplay());
};

const reset = () => {
  document.querySelector('#old_track_order').innerHTML = '';
  document.querySelector('#new_track_order').innerHTML = '';
  document.querySelector('#new_playlist_form').style.display = 'none';
};

// Main
document.querySelector('#submit').onclick = () => {
  spotifyApi
    .getPlaylistTracks(getPlaylistFromUri('#playlist'), {
      fields:
        'items(track(id, name, album(name, images), artists(name, id), external_urls(spotify), external_ids(isrc)))',
    })
    .then(async (data) => {
      // Clear track displays and disable button
      reset();
      document.querySelector('#submit').disabled = true;

      // Display current order of tracks
      let trackList = new TrackList(data);
      displayOldTracks(trackList.data);

      // Get the genres for the tracks
      await trackList.retrieveGenres(updateGenreDisplay);

      // Sort and display new order of tracks
      let separate_artists = document.querySelector('#separate_artists').value;
      trackList.sortByGenre(separate_artists);
      displayNewTracks(trackList.data);

      // Get list of final track IDs
      finalTrackIds = trackList.data.map((track) => {
        return 'spotify:track:' + track.id;
      });

      // Show options for saving new playlist
      document.querySelector('#new_playlist_form').style.display = 'flex';
      document.querySelector('#submit').disabled = false;
    })
    .catch((err) => {
      if (err.status === 401) {
        alert('You need to log in with Spotify again.');
      } else {
        alert(err);
        console.error(err);
      }
    });
};

// Saving playlist
document.querySelector('#save_button').onclick = async () => {
  let newPlaylistName = document.querySelector('#new_playlist_name').value;
  spotifyApi
    .getMe()
    .then((user) => {
      return spotifyApi.createPlaylist(user.id, { name: newPlaylistName });
    })
    .then((newPlaylist) => {
      return spotifyApi.addTracksToPlaylist(newPlaylist.id, finalTrackIds);
    })
    .then(() => {
      alert('Playlist saved!');
    })
    .catch((err) => {
      alert('There was a problem saving your playlist..');
      console.error(err);
    });
};
