import Track from './Track.js';

export default class TrackList {
  constructor(data) {
    // Build list of tracks from the raw Spotify API data, getting only the necessary info
    let retVal = [];
    data.items.forEach((item) => {
      let track = new Track(item.track);
      retVal.push(track);
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

  sort(sort, separate_artists = false) {
    this.data = sort.sorted(this.data, separate_artists);
  }

  async fill(sort, energyThreshold, valenceThreshold, separate_artists) {
    this.data = await sort.filled(
      this.data,
      energyThreshold,
      valenceThreshold,
      separate_artists
    );
  }

  getDisplayText(sort, trackNum) {
    return sort.getDisplayText(this.data[trackNum]);
  }
}
