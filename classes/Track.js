import { SpotifyWebApi } from '../spotify-web-api.js';

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
    genres = null
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
  }

  retrieveGenres = async () => {
    let retVal = [];
    retVal = retVal.concat(await this.getSpotifyGenres());
    retVal = retVal.concat(await this.getMusicBrainzGenres());

    // TODO: deduplicate

    this.genres = retVal;
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
          } else {
            resolve('error');
          }
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
