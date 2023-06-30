export default class MoodSort {
  sorted(data, separate_artists = false) {
    return data;
  }

  async retrieveData(track) {
    await track.retrieveAudioFeatures();
  }

  getDisplayText(track) {
    if (track.audioFeatures === null) {
      return 'Retrieving audio features...';
    } else {
      return (
        'Energy: ' +
        track.audioFeatures.energy +
        ', Valence: ' +
        track.audioFeatures.valence
      );
    }
  }
}
