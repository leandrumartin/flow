/**
 * Class that sorts an array of Track objects based on valence and energy.
 */
export default class MoodSort {
  /**
   * Sort the input data based on the valence and energy of the tracks.
   * @param data {Track[]} Tracks to be sorted
   * @param separate_artists {boolean} Whether to attempt to separate tracks by the same artist
   * @returns {Promise<Track[]>} Sorted tracks
   */
  async sorted(data, separate_artists = false) {
    // Sort tracks by valence
    data.sort((a, b) => {
      return a.audioFeatures.valence - b.audioFeatures.valence;
    });

    // Number the tracks off into (Math.round(tracklength // 30)) groups (i.e. groups are about 30 tracks long)
    let dataSortedTemp = data.toSorted((a, b) => {
      let numGroups = Math.round(data.length / 30);
      return (data.indexOf(a) % numGroups) - (data.indexOf(b) % numGroups);
    });
    data = dataSortedTemp;

    // Create groups of maximum 30 tracks each
    let groups = [[]];
    data.forEach((track) => {
      let lastGroup = groups[groups.length - 1];
      if (lastGroup.length < 30) {
        lastGroup.push(track);
      } else {
        groups.push([track]);
      }
    });
    data = groups;

    // Sort each group by valence
    data.forEach((group, groupIndex) => {
      group.sort((a, b) => {
        if (groupIndex % 2 === 0) {
          return a.audioFeatures.valence - b.audioFeatures.valence;
        } else {
          return b.audioFeatures.valence - a.audioFeatures.valence;
        }
      });
    });
    data = data.flat();

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

  /**
   * Retrieve the necessary data for the input track.
   * @param track {Track} Track to retrieve data for
   */
  async retrieveData(track) {
    await track.retrieveAudioFeatures();
  }

  /**
   * Get the text to display for the input track.
   * @param track {Track} Track to get display text for
   * @returns {string} Display text for the input track. Shows energy and valence.
   */
  getDisplayText(track) {
    if (track.audioFeatures === null) {
      return "Retrieving audio features...";
    } else {
      return (
        "Energy: " +
        track.audioFeatures.energy +
        ", Valence: " +
        track.audioFeatures.valence
      );
    }
  }
}
