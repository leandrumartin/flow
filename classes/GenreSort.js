import { SpotifyWebApi } from '../spotify-web-api.js';
import Track from './Track.js';

// Create Spotify API object
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage.getItem('access-token'));

export default class GenreSort {
  sorted(data, separate_artists = false) {
    let newTrackOrder;

    // Add to newTrackOrder the tracks that share the fewest genres with each other,
    // and remove from data
    newTrackOrder = this.getLeastSimilarTracks(data);
    newTrackOrder.forEach((track) => {
      let dataIndex = data.findIndex((dataTrack) => dataTrack === track);
      data.splice(dataIndex, 1);
    });

    // Until data is empty, get the pairs of consecutive tracks in newTrackOrder
    // that share the fewest genres, and insert between them whichever track matches
    // them both best.
    while (data.length > 0) {
      let track1Index = this.findLeastSimilarConsecutive(newTrackOrder);
      let track1 = newTrackOrder[track1Index];
      let track2Index = track1Index + 1;
      let track2 = newTrackOrder[track2Index];

      let trackToInsertIndex = this.findMedianSimilarTrack(
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

  async filled(data) {
    let done = false;

    let count = 0; // TEMP

    while (!done) {
      let track1Index = this.findLeastSimilarConsecutive(data);
      let track1 = data[track1Index];
      let track2Index = track1Index + 1;
      let track2 = data[track2Index];

      let numSharedGenres = this.getNumSharedGenres(track1, track2);

      console.log(
        'Shared genres is ' +
          numSharedGenres +
          '. Min genres is ' +
          Math.min(track1.genres.length, track2.genres.length) +
          ' (' +
          track1.name +
          '), (' +
          track2.name +
          ')'
      );

      if (
        numSharedGenres <
        Math.min(track1.genres.length, track2.genres.length) / 2
        // count < 5 // TEMP
      ) {
        console.log(track1.name + ' ' + track2.name);
        let recs = await spotifyApi.getRecommendations({
          seed_tracks: [track1.id, track2.id],
          // limit: 5,
        });
        console.log(recs);

        if (recs.tracks !== undefined && recs.tracks.length > 0) {
          let recList = recs.tracks.map((track) => new Track(track));
          for (let track of recList) {
            // await track.retrieveGenres();
            track.genres = await track.getSpotifyGenres();
          }
          let recTrackIndex = this.findMedianSimilarTrack(
            track1,
            track2,
            recList
          );
          data.splice(track2Index, 0, recList[recTrackIndex]);

          // let rec = recs.tracks[0];
          // let recTrack = new Track(rec);
          // await recTrack.retrieveGenres();
          // data.splice(track2Index, 0, recTrack);
        } else {
          done = true;
        }
      } else {
        done = true;
      }

      count += 1;
    }

    return data;
  }

  async retrieveData(track) {
    await track.retrieveGenres();
  }

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

  getNumSharedGenres(track1, track2) {
    let sharedGenres = track1.genres.filter((genre) => {
      return track2.genres.includes(genre);
    });

    return sharedGenres.length;
  }

  /**
   * Gets a list of tracks in the input that all share the fewest possible genres with each other.
   * @param {Track[]} data
   * @returns {Number[]} Array of the indices in the inputted array of the tracks whose lowest nhumber of genre matches with any other track is the minimum out of the data.
   */
  getLeastSimilarTracks(data) {
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

        let numSharedGenres = this.getNumSharedGenres(track1, track2);

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
          let numSharedGenres = this.getNumSharedGenres(track1, track2);
          return numSharedGenres === minSharedGenres;
        })
      ) {
        retVal.push(track1);
      }
    });

    return retVal;
  }

  /**
   * Finds the two consecutive tracks in the input data that share the fewest genres with each other.
   * @param {Track[]} data
   * @returns {Number} Index of the first track in the pair.
   */
  findLeastSimilarConsecutive(data) {
    let fewestMatches = Infinity;
    let indexOfFirst;

    // Test every track against its sucessor in the data array
    data.forEach((track1, track1Index) => {
      // Continue through loop if comparing track to itself
      if (track1Index === data.length - 1) {
        return;
      }

      let track2 = data[track1Index + 1];
      let numMatches = this.getNumSharedGenres(track1, track2);

      // Set indexOfFirst track1Index if they share the fewest genres out of any pair so far
      if (numMatches < fewestMatches) {
        fewestMatches = numMatches;
        indexOfFirst = track1Index;
      }
    });
    return indexOfFirst;
  }

  findMedianSimilarTrack(
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
      let numMatches1 = this.getNumSharedGenres(track1, testTrack);
      let numMatches2 = this.getNumSharedGenres(track2, testTrack);

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
      if (separate_artists == true) {
        bestMatchIndex = this.findMedianSimilarTrack(
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
