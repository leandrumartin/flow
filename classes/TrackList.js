import Track from './Track.js';

export default class TrackList {
  constructor(data) {
    // Build list of tracks from the raw Spotify API data, getting only the necessary info
    let retVal = [];
    data.items.forEach((item) => {
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
    });

    this.data = retVal;
  }

  async retrieveGenres(onGenreUpdate) {
    let trackNum = 0;
    for (let track of this.data) {
      await track.retrieveGenres();
      onGenreUpdate(trackNum, track.genres);
      trackNum += 1;
    }
  }

  sortByGenre(separate_artists = false) {
    let data = this.data.slice();
    let newTrackOrder = [];

    // Set aside the songs with no genre tags and remove from data
    /* let noGenres = [];
    this.data.forEach((track, index) => {
      if (track.genres.length === 0) {
        noGenres.push(track);
        data.splice(index, 1);
      }
    }); */

    // Get each track's data of tracks it shares the most and least genres with
    /* let dataWithMatches = [];
    data.forEach((track) => {
      let matchData = this.getTrackMatchData(track, data);
      dataWithMatches.push({
        track: track,
        matchData: matchData,
      });
    }); */

    // Declare constant with the original track order intact
    /* const dataCopy = dataWithMatches.slice(); */
    const dataCopy = data.slice();

    // Add to newTrackOrder the tracks that share the fewest genres with each other,
    // and remove from dataWithMatches
    /* let matchLeastAmounts = dataWithMatches.map(
      (track) => track.matchData.leastMatches
    );
    let minMatches = Math.min(matchLeastAmounts);
    dataCopy.forEach((track, index) => {
      if (track.matchData.leastMatches === minMatches) {
        newTrackOrder.push(track);
        dataWithMatches.splice(index, 1);
      }
    }); */
    let matchLeastAmounts = this.findLeastMatchingTracks(dataCopy);
    matchLeastAmounts.forEach((trackIndex) => {
      let thing = dataCopy[trackIndex];
      newTrackOrder.push(thing);
      // console.log(dataCopy[trackIndex]);
      let whatever = data.findIndex((track) => track === thing);
      data.splice(whatever, 1);
    });

    // Until data is empty, get the pairs of consecutive tracks in newTrackOrder
    // that share the fewest genres, and insert between them whichever track matches
    // them both best.
    while (data.length > 0) {
      console.log('data: ');
      console.log(data.slice());

      console.log('newTrackOrder: ');
      console.log(newTrackOrder.slice());

      let tracksToInsertBetween =
        this.findLeastMatchingConsecutive(newTrackOrder);
      // for (let track1Index of tracksToInsertBetween) {
      let track1Index = tracksToInsertBetween[0];
      let track1 = newTrackOrder[track1Index];
      let track2 = newTrackOrder[track1Index + 1];

      // console.log('Inserting between ' + track1.name + ' and ' + track2.name);

      let trackToInsertIndex = this.findBestMatchingTrack(track1, track2, data);
      let trackToInsert = data[trackToInsertIndex];

      // console.log('Inserting ' + trackToInsert.name);

      newTrackOrder.splice(track1Index, 0, trackToInsert);
      data.splice(trackToInsertIndex, 1);
      // }
    }

    this.data = newTrackOrder;
  }

  /**
   *
   * @param {Track[]} data
   * @returns {Number[]} Array of the indices in the inputted array of the tracks whose lowest nhumber of genre matches with any other track is the minimum out of the data.
   */
  findLeastMatchingTracks(data) {
    let fewestMatches = Infinity;
    let indices = [];
    // Test every track against every other track
    data.forEach((track1, track1Index) => {
      // For each track2 in data, see how many genres it shares with track1.
      data.forEach((track2, track2Index) => {
        if (track1 !== track2) {
          console.log('Comparing ' + track1.name + ' to ' + track2.name);

          // Let matchingGenres be an array of all genres the two tracks share
          let matchingGenres = track1.genres.filter((genre) => {
            return track2.genres.includes(genre);
          });
          let numMatches = matchingGenres.length;

          // Add track1's index to the indices array if it's the lowest number of matches so far
          if (numMatches < fewestMatches) {
            fewestMatches = numMatches;
            indices = [];

            console.log('numMatches: ' + numMatches + '. Clearing.');
          }
          if (numMatches === fewestMatches && !indices.includes(track1Index)) {
            indices.push(track1Index);

            console.log('numMatches: ' + numMatches + '. Adding.');
          } else {
            console.log('numMatches: ' + numMatches + '. NOT adding.');
          }
        }
      });
    });
    console.log(fewestMatches);
    return indices;
  }

  findLeastMatchingConsecutive(data) {
    let fewestMatches = Infinity;
    let indices = [];
    // Test every track against it sucessor in the data array
    data.forEach((track1, track1Index) => {
      if (track1Index !== data.length - 1) {
        let track2 = data[track1Index + 1];
        // Let matchingGenres be an array of all genres the two tracks share
        let matchingGenres = track1.genres.filter((genre) => {
          return track2.genres.includes(genre);
        });
        let numMatches = matchingGenres.length;

        // Add track1's index to the indices array if it's the lowest number of matches so far
        if (numMatches < fewestMatches) {
          fewestMatches = numMatches;
          indices = [];
        }
        if (numMatches === fewestMatches && !indices.includes(track1Index)) {
          indices.push(track1Index);
        }
      }
    });
    return indices;
  }

  /**
   * Returns data for the tracks sharing genres with one track.
   * @param {*} track - The track to get data for.
   * @param {*} matchAgainst - An array of Track objects to find matches for the track.
   * @returns
   */
  getTrackMatchData(track, matchAgainst) {
    let retVal = {
      mostMatches: 0,
      mostMatchesTrackIndices: [],
      leastMatches: Infinity,
      leastMatchesTrackIndices: [],
    };

    // OLD
    /*

    // For each genre tag of the current track, generate a list of tracks that
    // also share that genre tag. Then append that list to the genreMatches
    // array.
    let genreMatches = [];
    track.genres.forEach((genre) => {
      let matchesThisGenre = matchAgainst.filter((testTrack) => {
        return testTrack.genres.includes(genre) && testTrack != track;
      });
      genreMatches = genreMatches.concat(matchesThisGenre);
    });

    if (genreMatches.length === 0) {
      // There are no matches. Return retVal as is.
      return retVal;
    } else {
      // Since we looped through each genre, the genreMatches[] array will have
      // duplicates of each track that matched for more than one genre.
      // We create a new array with an object for each track with the track itself
      // and the number of appearances (the number of genres it matches with the
      // current track) and reverse sort it by appearances.
      genreMatches.sort((a, b) => {
        if (a.id > b.id) {
          return 1;
        } else if (a.id < b.id) {
          return -1;
        }
        return 0;
      }); // Group duplicates together
      let trackAppearances = [];
      genreMatches.forEach((matchTrack) => {
        if (
          trackAppearances.length === 0 ||
          matchTrack.id !==
            trackAppearances[trackAppearances.length - 1].track.id
        ) {
          trackAppearances.push({
            track: matchTrack,
            appearances:
              genreMatches.lastIndexOf(matchTrack) -
              genreMatches.indexOf(matchTrack),
          });
        }
      });
      trackAppearances.sort((a, b) => b.appearances - a.appearances);

      // let trackDebug = JSON.stringify(track.name);
      // let listDebug = JSON.stringify(trackAppearances.map((t) => t.track.name));
      // console.log('Matching ' + trackDebug + ' against ' + listDebug);

      // Return the track with the most genre matches (the first element).
      let retTrack = trackAppearances[0].track;
      return { track: retTrack, index: matchAgainst.indexOf(retTrack) };

      */

    // NEW

    // For each track in matchAgainst, see how many genres it shares with the track.
    matchAgainst.forEach((testTrack, testTrackIndex) => {
      if (track != testTrack) {
        // Let matchingGenres be an array of all genres the two tracks share
        let matchingGenres = track.genres.filter((genre) => {
          return testTrack.genres.includes(genre);
        });
        let numMatches = matchingGenres.length;

        // Add testTrack's index and number of matches to retVal if it's the highest
        // number of matches so far
        if (numMatches > retVal.mostMatches) {
          retVal.mostMatches = numMatches;
          retVal.mostMatchesTrackIndices = [];
        }
        if (numMatches === retVal.mostMatches) {
          retVal.mostMatchesTrackIndices.push(testTrackIndex);
        }

        // Do the same if it's the lowest number of matches so far
        if (numMatches < retVal.leastMatches) {
          retVal.leastMatches = numMatches;
          retVal.leastMatchesTrackIndices = [];
        }
        if (numMatches === retVal.leastMatches) {
          retVal.leastMatchesTrackIndices.push(testTrackIndex);
        }
      }
    });

    return retVal;
  }

  findBestMatchingTrack(track1, track2, matchAgainst) {
    let mostAvgMatches = 0;
    let bestMatchIndex;

    // For each track in matchAgainst, get the average of its number of shared genres with
    // track1 and with track2. If higher than the current best, replace that.
    matchAgainst.forEach((testTrack, index) => {
      let matches1 = track1.genres.filter((genre) => {
        return testTrack.genres.includes(genre);
      });
      let numMatches1 = matches1.length;

      let matches2 = track2.genres.filter((genre) => {
        return testTrack.genres.includes(genre);
      });
      let numMatches2 = matches2.length;

      let avgMatches = (numMatches1 + numMatches2) / 2;
      if (avgMatches > mostAvgMatches) {
        mostAvgMatches = avgMatches;
        bestMatchIndex = index;
      }
    });

    if (bestMatchIndex === undefined) {
      bestMatchIndex = 0;
    }

    return bestMatchIndex;
  }
}
