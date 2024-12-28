/**
 * Class that sorts an array of Track objects based on genres shared between tracks..
 */
export default class GenreSort {
  /**
   * Sort the input data based on the genres shared between tracks.
   * @param data {Track[]} Tracks to be sorted
   * @param separate_artists {boolean} Whether to attempt to separate tracks by the same artist
   * @returns {Promise<Track[]>} Sorted tracks
   */
  async sorted(data, separate_artists = false) {
    let newTrackOrder;

    // Add to newTrackOrder the tracks that share the fewest genres with each other,
    // and remove from data
    newTrackOrder = this._getLeastSimilarTracks(data);
    newTrackOrder.forEach((track) => {
      let dataIndex = data.findIndex((dataTrack) => dataTrack === track);
      data.splice(dataIndex, 1);
    });

    // Until data is empty, get the pairs of consecutive tracks in newTrackOrder
    // that share the fewest genres, and insert between them whichever track matches
    // them both best.
    while (data.length > 0) {
      let track1Index = this._findLeastSimilarConsecutive(newTrackOrder);
      let track1 = newTrackOrder[track1Index];
      let track2Index = track1Index + 1;
      let track2 = newTrackOrder[track2Index];

      let trackToInsertIndex = this._findMedianSimilarTrack(
        track1,
        track2,
        data,
        separate_artists
      );
      let trackToInsert = data[trackToInsertIndex];

      newTrackOrder.splice(track2Index, 0, trackToInsert);
      data.splice(trackToInsertIndex, 1);
    }

    return newTrackOrder;
  }

  /**
   * Retrieve the necessary data for the input track.
   * @param track {Track} Track to retrieve data for
   */
  async retrieveData(track) {
    await track.retrieveGenres();
  }

  /**
   * Get the text to display for the input track.
   * @param track {Track} Track to get display text for
   * @returns {string} Display text for the input track. Shows genres.
   */
  getDisplayText(track) {
    if (track.genres === null) {
      return 'Retrieving genres...';
    } else if (track.genres.length === 0) {
      return 'No genres found.';
    } else {
      return 'Genres: ' + track.genres.join(', ');
    }
  }

  // Helper functions
  /**
   * Get the number of genres shared between two tracks.
   * @param track1 {Track} First track to compare.
   * @param track2 {Track} Second track to compare.
   * @returns {number} The number of genres shared.
   * @private
   */
  _getNumSharedGenres(track1, track2) {
    let sharedGenres = track1.genresHidden.filter((genre) => {
      return track2.genresHidden.includes(genre);
    });

    return sharedGenres.length;
  }

  /**
   * Get a list of tracks in the input that all share the fewest possible genres with each other.
   * @param {Track[]} data Array of tracks to sort.
   * @returns {Number[]} Array of the indices in the inputted array of the tracks whose lowest nhumber of genre matches with any other track is the minimum out of the data.
   * @private
   */
  _getLeastSimilarTracks(data) {
    let minSharedGenres = Infinity;
    let retVal = [];

    // Test every track against every other track to find the pair of least similar tracks
    data.forEach((track1) => {
      if (track1.genres.length === 0) {
        return;
      }
      data.forEach((track2) => {
        // Continue through loop if comparing track to itself
        if (track1 === track2 || track2.genres.length === 0) {
          return;
        }

        let numSharedGenres = this._getNumSharedGenres(track1, track2);

        // Set retVal to [track1, track2] if they share the fewest genres out of any pair so far
        if (numSharedGenres < minSharedGenres) {
          minSharedGenres = numSharedGenres;
          retVal = [track1, track2];
        }
      });
    });

    // At this point we have an array of 2 tracks to return. See if there are any other tracks
    // in the inputted data that also share fewestMatches genres with all of the tracks in the
    // indices[] array.
    data.forEach((track1) => {
      if (
        retVal.every((track2) => {
          let numSharedGenres = this._getNumSharedGenres(track1, track2);
          return numSharedGenres === minSharedGenres;
        })
      ) {
        retVal.push(track1);
      }
    });

    return retVal;
  }

  /**
   * Find the two consecutive tracks in the input data that share the fewest genres with each other.
   * @param {Track[]} data Array of tracks to sort.
   * @returns {Number} Index of the first track in the pair.
   * @private
   */
  _findLeastSimilarConsecutive(data) {
    let fewestMatches = Infinity;
    let indexOfFirst;

    // Test every track against its sucessor in the data array
    data.forEach((track1, track1Index) => {
      // Continue through loop if comparing track to itself
      if (track1Index === data.length - 1) {
        return;
      }

      let track2 = data[track1Index + 1];
      let numMatches = this._getNumSharedGenres(track1, track2);

      // Set indexOfFirst track1Index if they share the fewest genres out of any pair so far
      if (numMatches < fewestMatches) {
        fewestMatches = numMatches;
        indexOfFirst = track1Index;
      }
    });
    return indexOfFirst;
  }

  /**
   * Find the track in matchAgainst that is most similar to both track1 and track2.
   * @param track1 {Track} First track to compare
   * @param track2 {Track} Second track to compare
   * @param matchAgainst {Track[]} List of tracks to compare to track1 and track2
   * @param separate_artists {boolean} Whether to attempt to separate tracks by the same artist
   * @returns {number} Index of the most similar track in matchAgainst
   * @private
   */
  _findMedianSimilarTrack(
    track1,
    track2,
    matchAgainst,
    separate_artists = false
  ) {
    let mostAvgMatches = 0;
    let bestMatchIndex;

    // For each track in matchAgainst, get the average of its number of shared genres with
    // track1 and with track2. If higher than the current best, replace that.
    matchAgainst.forEach((testTrack, index) => {
      let numMatches1 = this._getNumSharedGenres(track1, testTrack);
      let numMatches2 = this._getNumSharedGenres(track2, testTrack);

      // Disallow track from being selected as the median if separate_artists is true and
      // it shares primary artists with one of the tracks it is being compared to.
      let sharesBothArtists =
        testTrack.artistIds[0] === track1.artistIds[0] ||
        testTrack.artistIds[0] === track2.artistIds[0];
      let isTrackAllowed = !separate_artists || !sharesBothArtists;

      let avgMatches = (numMatches1 + numMatches2) / 2;
      if (avgMatches > mostAvgMatches && isTrackAllowed) {
        mostAvgMatches = avgMatches;
        bestMatchIndex = index;
      }
    });

    // If bestMatchIndex is still undefined, try with separate_artists = false if that is what
    // caused it. Otherwise, set it to 0.
    if (bestMatchIndex === undefined) {
      if (separate_artists) {
        bestMatchIndex = this._findMedianSimilarTrack(
          track1,
          track2,
          matchAgainst,
          false
        );
      } else {
        bestMatchIndex = 0;
      }
    }

    return bestMatchIndex;
  }
}
