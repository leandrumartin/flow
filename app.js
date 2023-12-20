import { SpotifyWebApi } from "./spotify-web-api.js";

import PlaylistDisplay from "./classes/PlaylistDisplay.js";
import TrackList from "./classes/TrackList.js";
import SortFactory from "./classes/SortFactory.js";

let finalTrackIds;

// Create Spotify API object
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage.getItem("access-token"));

// Helper functions
const updateDataDisplay = (trackNum, displayText) => {
  let element = document.querySelector("#track" + trackNum);
  element.textContent = displayText;
};

const getPlaylistIdFromUri = (inputID) => {
  let uri = document.querySelector(inputID).value.trim();
  if (!uri.startsWith("spotify:playlist:")) {
    throw new Error("Invalid URI");
  }
  return uri.slice(17);
};

const displayOldTracks = (data, sort) => {
  let display = new PlaylistDisplay(data);
  document.querySelector("#old_track_order").append(display.getDisplay(sort));
};

const displayNewTracks = (data, sort) => {
  let display = new PlaylistDisplay(data);
  document.querySelector("#new_track_order").append(display.getDisplay(sort));
};

const reset = () => {
  document.querySelector("#old_track_order").innerHTML = "";
  document.querySelector("#new_track_order").innerHTML = "";
  document.querySelector("#new_playlist_form").style.display = "none";
};

// Main
document.querySelector("#submit").onclick = () => {
  try {
    let playlistId = getPlaylistIdFromUri("#playlist");
    spotifyApi
      .getPlaylistTracks(playlistId, {
        fields:
          "items(track(id, name, album(name, images), artists(name, id), external_urls(spotify), external_ids(isrc)), is_local), next, offset",
      })
      .then(async (data) => {
        // Clear track displays and disable button
        reset();
        document.querySelector("#submit").disabled = true;

        let sortString = document.querySelector(
          'input[name="sort_method"]:checked'
        ).value;
        let sort = SortFactory(sortString);

        // Get more tracks, if any, past 100 track limit
        let allData = data;
        while (data.next) {
          data = await spotifyApi.getPlaylistTracks(playlistId, {
            fields:
              "items(track(id, name, album(name, images), artists(name, id), external_urls(spotify), external_ids(isrc)), is_local), next, offset",
            offset: data.offset + 100,
          });
          console.log(data);
          console.log(allData.items);
          allData.items = allData.items.concat(data.items);
        }

        // Display current order of tracks
        let trackList = new TrackList(allData);
        displayOldTracks(trackList, sort);

        // Get necessary track data depending on what kind of sort is being done
        await trackList.retrieveData(sort, updateDataDisplay);

        // Sort and display new order of tracks
        let separate_artists =
          document.querySelector("#separate_artists").value;
        trackList.sort(sort, separate_artists);
        // trackList.sortByGenre(separate_artists);
        displayNewTracks(trackList, sort);

        // Get list of final track IDs
        finalTrackIds = trackList.data.map((track) => {
          return "spotify:track:" + track.id;
        });

        // Show options for saving new playlist
        document.querySelector("#new_playlist_form").style.display = "flex";
        document.querySelector("#submit").disabled = false;
      })
      .catch((err) => {
        if (err.status === 401) {
          alert("You need to log in with Spotify again.");
          window.open("authorize.html", "_self");
        } else {
          alert(err);
          console.error(err);
        }
      });
  } catch (err) {
    alert(err.message);
  }
};

// Saving playlist
document.querySelector("#save_button").onclick = async () => {
  let newPlaylistName = document.querySelector("#new_playlist_name").value;
  spotifyApi
    .getMe()
    .then((user) => {
      return spotifyApi.createPlaylist(user.id, { name: newPlaylistName });
    })
    .then((newPlaylist) => {
      return spotifyApi.addTracksToPlaylist(newPlaylist.id, finalTrackIds);
    })
    .then(() => {
      alert("Playlist saved!");
    })
    .catch((err) => {
      alert("There was a problem saving your playlist.");
      console.error(err);
    });
};
