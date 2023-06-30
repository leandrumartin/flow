export default class MoodSort {
  sorted(data, separate_artists = false) {
    // Sort by valence
    data.sort((a, b) => a.audioFeatures.valence - b.audioFeatures.valence);

    // Create groups based on their valence. The data array is divided into smaller arrays,
    // each containing tracks within 0.1 valence of each other.
    let valenceGroups = [];
    let baseValence;
    data.forEach((track) => {
      // Don't let track in latest group if a track already in there shares its primary artist
      let isTrackAllowed = true;
      if (separate_artists && valenceGroups.length > 0) {
        let groupArtists = valenceGroups[valenceGroups.length - 1].map(
          (track) => track.artistIds[0]
        );
        if (groupArtists.includes(track.artistIds[0])) {
          isTrackAllowed = false;
        }
      }

      // If track valence differs from lowest valence in the group by more than 0.1, create a
      // new group. Otherwise, add it to the group.
      if (
        baseValence === undefined ||
        track.audioFeatures.valence - baseValence > 0.1 ||
        !isTrackAllowed
      ) {
        baseValence = track.audioFeatures.valence;
        valenceGroups.push([track]);
      } else {
        valenceGroups[valenceGroups.length - 1].push(track);
      }
    });

    // Each sub-array is ordered by energy, ascending if an even-indexed group, descending
    // otherwise.
    valenceGroups.forEach((group, groupIndex) => {
      group.sort((a, b) => {
        if (groupIndex % 2 === 0) {
          return a.audioFeatures.energy - b.audioFeatures.energy;
        } else {
          return b.audioFeatures.energy - a.audioFeatures.energy;
        }
      });
    });

    data = valenceGroups.flat();
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
