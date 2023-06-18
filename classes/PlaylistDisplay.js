export default class PlaylistDisplay {
  constructor(tracks) {
    this.tracks = tracks;
  }

  /**
   * Creates a basic display for the playlist, with each track's name, artist names, art, and genre list.
   * @returns {DocumentFragment} DocumentFragment object with a <div> for each track.
   */
  getDisplay = () => {
    let fragment = new DocumentFragment();
    let trackNum = 0;

    this.tracks.forEach((track) => {
      let trackDisplay = document.createElement('div');
      trackDisplay.className = 'track_container';
      fragment.append(trackDisplay);

      let nameDisplay = document.createElement('p');
      nameDisplay.textContent = track.name;
      trackDisplay.append(nameDisplay);

      let artistsDisplay = document.createElement('p');
      artistsDisplay.textContent = track.artistNames;
      trackDisplay.append(artistsDisplay);

      let artDisplay = document.createElement('img');
      artDisplay.setAttribute('src', track.albumArt.url);
      artDisplay.setAttribute('width', 200);
      trackDisplay.append(artDisplay);

      let statusDisplay = document.createElement('p');
      statusDisplay.setAttribute('id', 'track' + trackNum);
      if (track.genres === null) {
        statusDisplay.textContent = 'Retrieving genres...';
      } else if (track.genres.length === 0) {
        statusDisplay.textContent = 'No genres found.';
      } else {
        statusDisplay.textContent = 'Genres: ' + track.genres;
      }
      trackDisplay.append(statusDisplay);

      trackNum += 1;
    });

    return fragment;
  };
}
