import Track from './Track.js';

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

  async retrieveData(sort, onDataUpdate) {
    let trackNum = 0;
    for (let track of this.data) {
        await sort.retrieveData(track);
      onDataUpdate(trackNum, sort.getDisplayText(track));
      trackNum += 1;
    }
  }

  async sort(sort, separate_artists = false) {
    this.data = await sort.sorted(this.data, separate_artists);
  }

  getDisplayText(sort, trackNum) {
    return sort.getDisplayText(this.data[trackNum]);
  }
}
