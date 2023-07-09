import { SpotifyWebApi } from '../spotify-web-api.js';
import Track from './Track.js';

// Create Spotify API object
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage.getItem('access-token'));

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

  async filled(data, energyThreshold, valenceThreshold, separate_artists) {
    let count = 0; // TEMP

    while (true) {
      let track1Index = this.findLeastSimilarConsecutive(
        data,
        energyThreshold,
        valenceThreshold
      );
      if (track1Index === null) {
        break;
      }
      let track1 = data[track1Index];
      let track2Index = track1Index + 1;
      let track2 = data[track2Index];

      let diffEnergy = Math.abs(
        track1.audioFeatures.energy - track2.audioFeatures.energy
      );
      let diffValence = Math.abs(
        track1.audioFeatures.valence - track2.audioFeatures.valence
      );
      let avgEnergy =
        (track1.audioFeatures.energy + track2.audioFeatures.energy) / 2;
      let avgValence =
        (track1.audioFeatures.valence + track2.audioFeatures.valence) / 2;

      console.log(
        'Difference in energy is ' +
          diffEnergy +
          '. Difference in valence is ' +
          diffValence +
          ' (' +
          track1.name +
          '), (' +
          track2.name +
          ')'
      );

      let recs = await spotifyApi.getRecommendations({
        seed_tracks: [track1.id, track2.id],
        limit: 10,
        target_energy: avgEnergy,
        target_valence: avgValence,
      });
      console.log(recs);

      if (recs.tracks !== undefined && recs.tracks.length > 0) {
        let recList = recs.tracks.map((track) => new Track(track));
        for (let track of recList) {
          await track.retrieveAudioFeatures();
        }

        if (diffEnergy > diffValence) {
          let recTrack = this.getTrackByEnergy(avgEnergy, recList);
          data.splice(track2Index, 0, recTrack);
        } else {
          let recTrack = this.getTrackByValence(avgValence, recList);
          data.splice(track2Index, 0, recTrack);
        }
      } else {
        break;
      }

      count += 1;
    }

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

  getTrackByEnergy(targetEnergy, data) {
    let retVal;
    let minDifference = Infinity;
    data.forEach((track) => {
      let diffEnergy = Math.abs(track.audioFeatures.energy - targetEnergy);
      if (diffEnergy < minDifference) {
        minDifference = diffEnergy;
        retVal = track;
      }
    });

    return retVal;
  }

  getTrackByValence(targetValence, data) {
    let retVal;
    let minDifference = Infinity;
    data.forEach((track) => {
      let diffValence = Math.abs(track.audioFeatures.valence - targetValence);
      if (diffValence < minDifference) {
        minDifference = diffValence;
        retVal = track;
      }
    });

    return retVal;
  }

  findLeastSimilarConsecutive(data, energyThreshold, valenceThreshold) {
    let indexOfFirst = null;

    // Test every track against its sucessor in the data array
    data.forEach((track1, track1Index) => {
      // Continue through loop if comparing track to itself
      if (track1Index === data.length - 1) {
        return;
      }

      let track2 = data[track1Index + 1];
      let diffEnergy = Math.abs(
        track1.audioFeatures.energy - track2.audioFeatures.energy
      );
      let diffValence = Math.abs(
        track1.audioFeatures.valence - track2.audioFeatures.valence
      );

      // Set indexOfFirst track1Index if the difference exceeds the threshold
      if (diffEnergy > energyThreshold || diffValence > valenceThreshold) {
        indexOfFirst = track1Index;
        return;
      }
    });
    return indexOfFirst;
  }
}
