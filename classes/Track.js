import { SpotifyWebApi } from '../spotify-web-api.js';

// Create Spotify API object
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage.getItem('access-token'));

export default class Track {
  constructor(track) {
    this.album = track.album.name;
    this.albumArt = track.album.images[0];
    this.artistIds = track.artists.map((artist) => {
      return artist.id;
    });
    this.artistNames = track.artists.map((artist) => {
      return artist.name;
    });
    this.audioFeatures = null;
    this.genres = null;
    this.id = track.id;
    this.isrc = track.external_ids.isrc;
    this.name = track.name;
    this.url = track.external_urls.spotify;
  }

  retrieveGenres = async () => {
    let retVal = [];
    retVal = retVal.concat(await this.getSpotifyGenres());
    retVal = retVal.concat(await this.getMusicBrainzGenres());
    retVal = this.deduplicate(retVal);
    this.genres = retVal;
  };

  retrieveAudioFeatures = async () => {
    this.audioFeatures = await spotifyApi.getAudioFeaturesForTrack(this.id);
  };

  deduplicate = (list) => {
    let retVal = [];
    list.forEach((item) => {
      if (!retVal.includes(item)) {
        retVal.push(item);
      }
    });
    return retVal;
  };

  getSpotifyGenres = async () => {
    let artists = await spotifyApi.getArtists(this.artistIds);
    let genres = artists.artists.map((artist) => {
      return artist.genres;
    });
    genres = genres.flat();

    return genres;
  };

  getMusicBrainzGenres = async () => {
    // Get track tags from MusicBrainz
    let myPromise = new Promise((resolve) => {
      setTimeout(() => {
        let XMLRequest = new XMLHttpRequest();

        XMLRequest.open(
          'GET',
          'https://musicbrainz.org/ws/2/recording/?fmt=json&query=isrc:' +
            this.isrc
        );
        XMLRequest.setRequestHeader(
          'User-Agent',
          'FlowForSpotify/1.0 ( leandrumartin@gmail.com )'
        );
        XMLRequest.send();

        XMLRequest.onload = () => {
          if (XMLRequest.status === 200) {
            let track = JSON.parse(XMLRequest.response);
            let genres = this.getMusicBrainzTags(track);
            resolve(genres);
          }
        };

        XMLRequest.onerror = () => {
          alert(
            'Sorry, there was a problem fetching the track data. Refresh and try again.'
          );
        };
      }, 1100);
    });

    return myPromise;
  };

  getMusicBrainzTags = (track) => {
    let genres = [];

    for (let recording of track.recordings) {
      if (recording.tags !== undefined) {
        let tags = recording.tags.map((tag) => tag.name);

        genres = genres.concat(tags);
      }
    }

    return genres;
  };
}
