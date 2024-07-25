import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

env.allowLocalModels = false;
export default class AISort {
  async sorted(data, separate_artists = false) {
    await this._getEmbeddings(data);
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

  async _getEmbeddings(data) {
    const extractor = await pipeline("feature-extraction", "Xenova/jina-embeddings-v2-small-en", ); // Using this model because it's relatively small at ~32M params
    console.log(JSON.stringify(data[0]))
    for (let track of data) {
      let extraction = await extractor(JSON.stringify(track))
      track.embedding = extraction.data
      console.log(track.embedding)
    }
  }

  async retrieveData(track) {
    await track.retrieveGenres();
    await track.retrieveAudioFeatures();
  }

  getDisplayText(track) {
    if (track.genres === null || track.audioFeatures === null) {
      return 'Retrieving data...';
    } else {
      return(
        `Energy: ${track.audioFeatures.energy},\n
        Valence: ${track.audioFeatures.valence},\n
        Genres: ${track.genres.slice(0, 3).join(', ')}`
      );
    }
  }

  // Helper functions
  /**
   * Gets a list of tracks in the input that all share the fewest possible genres with each other.
   * @param {Track[]} data
   * @returns {Number[]} Array of the indices in the inputted array of the tracks whose lowest nhumber of genre matches with any other track is the minimum out of the data.
   */
  _getLeastSimilarTracks(data) {
    let minSimilarity = Infinity;
    let retVal = [];

    // Test every track against every other track to find the pair of least similar tracks
    data.forEach((track1) => {
      data.forEach((track2) => {
        // Continue through loop if comparing track to itself
        if (track1 === track2) {
          return;
        }

        let similarity = this._getCosineSimilarity(track1, track2);

        // Set retVal to [track1, track2] if they share the fewest genres out of any pair so far
        if (similarity < minSimilarity) {
          minSimilarity = similarity;
          retVal = [track1, track2];
        }
      });
    });

    // At this point we have an array of 2 tracks to return. See if there are any other tracks
    // in the inputted data that also share minSimilarity with all of the tracks in the
    // indices[] array.
    data.forEach((track1) => {
      if (
        retVal.every((track2) => {
          let similarity = this._getCosineSimilarity(track1, track2);
          return similarity === minSimilarity;
        })
      ) {
        retVal.push(track1);
      }
    });

    return retVal;
  }

  /**
   * Finds the two consecutive tracks in the input data that are least similar to each other.
   * @param {Track[]} data
   * @returns {Number} Index of the first track in the pair.
   */
  _findLeastSimilarConsecutive(data) {
    let leastSimilarity = Infinity;
    let indexOfFirst;

    // Test every track against its successor in the data array
    data.forEach((track1, track1Index) => {
      // Continue through loop if comparing track to itself
      if (track1Index === data.length - 1) {
        return;
      }

      let track2 = data[track1Index + 1];
      let similarity = this._getCosineSimilarity(track1, track2);

      // Set indexOfFirst to track1Index if they have the lowest similarity out of any pair so far
      if (similarity < leastSimilarity) {
        leastSimilarity = similarity;
        indexOfFirst = track1Index;
      }
    });
    return indexOfFirst;
  }

  _findMedianSimilarTrack(
    track1,
    track2,
    matchAgainst,
    separate_artists = false
  ) {
    let greatestSimilarity = 0;
    let bestMatchIndex;

    // For each track in matchAgainst, get the average of its similarity to
    // track1 and with track2. If higher than the current best, replace that.
    matchAgainst.forEach((testTrack, index) => {
      let similarity1 = this._getCosineSimilarity(track1, testTrack);
      let similarity2 = this._getCosineSimilarity(track2, testTrack);

      // Disallow track from being selected as the median if separate_artists is true and
      // it shares primary artists with one of the tracks it is being compared to.
      let sharesBothArtists =
        testTrack.artistIds[0] === track1.artistIds[0] ||
        testTrack.artistIds[0] === track2.artistIds[0];
      let isTrackAllowed = !separate_artists || !sharesBothArtists;

      let avgSimilarity = (similarity1 + similarity2) / 2;
      if (avgSimilarity > greatestSimilarity && isTrackAllowed) {
        greatestSimilarity = avgSimilarity;
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

  _getCosineSimilarity(track1, track2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (let i = 0; i < Math.min(track1.embedding.length, track2.embedding.length); i++) {
      dotProduct += track1.embedding[i] * track2.embedding[i];
      magnitude1 += track1.embedding[i] ** 2;
      magnitude2 += track2.embedding[i] ** 2;
    }
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    return dotProduct / (magnitude1 * magnitude2);
  }
}
