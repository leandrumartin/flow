import Track from './Track.js';

/**
 * A class representing a list of tracks.
 */
export default class TrackList {
  constructor(data) {
    // Build list of tracks from the raw Spotify API data, getting only the necessary info
    let retVal = [];
    data.items.forEach((item) => {
      if (!item.is_local) {
        let track = new Track(
          item.track.id,
          item.track.name,
          item.track.artists.map((artist) => {
            return artist.name;
          }),
          item.track.album.name,
          item.track.album.images[0],
          item.track.artists.map((artist) => {
            return artist.id;
          }),
          item.track.external_urls.spotify,
          item.track.external_ids.isrc
        );
        retVal.push(track);
      }
    });

    this.data = retVal;
  }

  /**
   * Retrieve necessary data for a sort.
   * @param sort {MoodSort|GenreSort|AISort} Sort type to use.
   * @param onDataUpdate
   * @returns {Promise<void>}
   */
  async retrieveData(sort, onDataUpdate) {
    let trackNum = 0;
    for (let track of this.data) {
        await sort.retrieveData(track);
      onDataUpdate(trackNum, sort.getDisplayText(track));
      trackNum += 1;
    }
  }

  /**
   * Sort the tracks in the list.
   * @param sort {MoodSort|GenreSort|AISort} Sort type to use.
   * @param separate_artists {boolean} Whether to attempt to separate artists in the sort.
   * @returns {Promise<void>}
   */
  async sort(sort, separate_artists = false) {
    this.data = await sort.sorted(this.data, separate_artists);
  }

  /**
   * Get the display text for a track.
   * @param sort The sort object to use.
   * @param trackNum The index of the track to get the display text for.
   * @returns {string} The display text for the track.
   */
  getDisplayText(sort, trackNum) {
    return sort.getDisplayText(this.data[trackNum]);
  }
}
