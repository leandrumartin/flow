import EmbeddingExtractor from "./EmbeddingExtractor.js";
import APISingleton from "./APISingleton.js";

// Create Spotify API object
const spotifyApi = new APISingleton();

/**
 * Class representing a track.
 */
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

  /**
   * Retrieve genres for the track from Spotify and MusicBrainz.
   * @returns {Promise<void>}
   */
  retrieveGenres = async () => {
    let retVal = [];
    retVal = retVal.concat(await this._getSpotifyGenres());
    retVal = retVal.concat(await this._getMusicBrainzGenres());
    retVal = this.deduplicate(retVal);
    this.genres = retVal;

    /*
    Split each genre into multiple genres for each word (but don't display to user).
    This ensures that if Track A has genre "jazz" and Track B has genre "jazz fusion", then
    they will be considered to share the genre "jazz," even if Track B didn't originally have
    the genre "jazz" in its genres array.
    */
    this.genresHidden = [];
    retVal.forEach((item) => {
      this.genresHidden.push(item);
      this.genresHidden.push(item.split(' '));
    });
    this.genresHidden = this.deduplicate(this.genresHidden.flat());
  };

  /**
   * Retrieve audio features for the track.
   * @returns {Promise<void>}
   */
  retrieveAudioFeatures = async () => {
    this.audioFeatures = await spotifyApi.getAudioFeaturesForTrack(this.id);
  };

  /**
   * Retrieve vector embedding for the track.
   * @returns {Promise<void>}
   */
  retrieveEmbedding = async () => {
    const extractor = await EmbeddingExtractor.getInstance();
    let extraction = await extractor(JSON.stringify({
      "name": this.name,
      "artistNames": this.artistNames,
      "album": this.album,
      "genres": this.genres,
      "audioFeatures": this.audioFeatures,
    }))
    this.embedding = extraction.data
  }

  /**
   * Remove duplicates from a list.
   * @param list
   * @returns {*[]}
   */
  deduplicate = (list) => {
    let retVal = [];
    list.forEach((item) => {
      if (!retVal.includes(item)) {
        retVal.push(item);
      }
    });
    return retVal;
  };

  /**
   * Retrieve genres for the track from Spotify.
   * @returns {Promise<FlatArray<*, 1>[]>}
   * @private
   */
  _getSpotifyGenres = async () => {
    let artists = await spotifyApi.getArtists(this.artistIds);
    let genres = artists.artists.map((artist) => {
      return artist.genres;
    });
    genres = genres.flat();

    return genres;
  };

  /**
   * Retrieve genres from MusicBrainz.
   * @returns {Promise<unknown>}
   * @private
   */
  _getMusicBrainzGenres = async () => {
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
            let genres = this._getMusicBrainzTags(track);
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

  /**
   * Extract genres from MusicBrainz track data.
   * @param track
   * @returns {*[]}
   * @private
   */
  _getMusicBrainzTags = (track) => {
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
