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

  sortByGenre(randomize = false, separate_artists = false) {
    let data = this.data;

    if (randomize) {
      data.sort(function () {
        return 0.5 - Math.random();
      });
    }

    // Add data[0] to retval. Then keep adding the track in data that
    // shares the most genres with the last track in retval.
    let retVal = [];
    retVal.push(data.shift());
    while (data.length > 0) {
      let matchData = this.getMatchData(
        retVal[retVal.length - 1],
        data,
        !separate_artists
      );
      if (matchData !== null) {
        retVal.push(matchData.track);
        data.splice(matchData.index, 1);
      } else {
        // If there were no tracks in data that matched any with the last track
        // in retval, instead match against retval[0] and push the result
        // to the front of retval.
        let matchData = this.getMatchData(retVal[0], data, !separate_artists);
        if (matchData !== null) {
          retVal.splice(0, 0, matchData.track);
          data.splice(matchData.index, 1);
        } else {
          // If there still weren't any matches, genre-match data[0] against
          // all tracks in retval, and place data[0] after that matching track
          // in retval.
          let matchData = this.getMatchData(data[0], retVal, !separate_artists);
          if (matchData !== null) {
            retVal.splice(matchData.index, 0, data[0]);
            data.splice(0, 1);
          } else {
            // If there STILL weren't any matches, that means data[0] shares
            // no genres with any of the other tracks. Just add it to the end.
            retVal.push(data.shift());
          }
        }
      }
    }

    this.data = retVal;
  }

  getMatchData(track, matchAgainst, allowSameArtistMatch) {
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
      // There are no matches. Return null.
      return null;
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
      if (allowSameArtistMatch) {
        let retTrack = trackAppearances[0].track;
        return { track: retTrack, index: matchAgainst.indexOf(retTrack) };
      } else {
        // Return the first genre-matching track without the same artist as the
        // current track.
        for (let matchTrack of trackAppearances) {
          let sameArtistMatch =
            track.artistNames[0] === matchTrack.track.artistNames[0];
          if (!sameArtistMatch) {
            let retTrack = matchTrack.track;
            return { track: retTrack, index: matchAgainst.indexOf(retTrack) };
          }
        }

        // If there were no tracks without the same artist, just return the track
        // with the most matches
        let retTrack = trackAppearances[0].track;
        return { track: retTrack, index: matchAgainst.indexOf(retTrack) };
      }
    }
  }
}
