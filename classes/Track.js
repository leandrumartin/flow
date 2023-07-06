import { SpotifyWebApi } from '../spotify-web-api.js';
import { lastFmApiKey } from '../globals.js';

// Create Spotify API object
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage.getItem('access-token'));

export default class Track {
  constructor(
    id,
    name,
    artistNames,
    album,
    albumArt,
    artistIds,
    url,
    isrc,
    genres = null,
    audioFeatures = null
  ) {
    this.id = id;
    this.name = name;
    this.artistNames = artistNames;
    this.album = album;
    this.albumArt = albumArt;
    this.artistIds = artistIds;
    this.url = url;
    this.isrc = isrc;
    this.genres = genres;
    this.audioFeatures = audioFeatures;
  }

  retrieveGenres = async () => {
    let retVal = [];
    retVal = retVal.concat(await this.getSpotifyGenres());
    retVal = retVal.concat(await this.getLastFmGenres());
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

  getLastFmGenres = async () => {
    // Get track tags from Last.FM
    let myPromise = new Promise((resolve) => {
      setTimeout(() => {
        let XMLRequest = new XMLHttpRequest();

        XMLRequest.open(
          'GET',
          'https://ws.audioscrobbler.com/2.0/?method=track.gettoptags' +
            '&artist=' +
            this.artistNames[0] +
            '&track=' +
            this.name +
            '&api_key=' +
            lastFmApiKey +
            '&format=json'
        );
        XMLRequest.setRequestHeader(
          'User-Agent',
          'FlowForSpotify/1.0 ( leandrumartin@gmail.com )'
        );
        XMLRequest.send();

        XMLRequest.onload = () => {
          if (XMLRequest.status === 200) {
            console.log(JSON.parse(XMLRequest.response));

            let track = JSON.parse(XMLRequest.response);

            try {
              let genres = this.getLastFmTags(track);
              resolve(genres);
            } catch (error) {
              resolve([]);
            }
          } else {
            resolve('error');
          }
        };
      }, 0);
    });

    return myPromise;
  };

  getLastFmTags = (track) => {
    // let genres = [];

    // for (let recording of track.recordings) {
    //   if (recording.tags !== undefined) {
    //     let tags = recording.tags.map((tag) => tag.name);

    //     genres = genres.concat(tags);
    //   }
    // }

    // return genres;

    return track.toptags.tag.map((tag) => tag.name);
  };
}
