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
      
      let trackLink = document.createElement('a');
      trackLink.href = track.url;
      trackDisplay.append(trackLink);

      let nameDisplay = document.createElement('p');
      nameDisplay.textContent = track.name;
      trackLink.append(nameDisplay);

      let artistsDisplay = document.createElement('p');
      artistsDisplay.textContent = track.artistNames.join(', ');
      trackLink.append(artistsDisplay);

      let artDisplay = document.createElement('img');
      artDisplay.setAttribute('src', track.albumArt.url);
      artDisplay.setAttribute('width', 200);
      trackLink.append(artDisplay);

      let genresDisplay = document.createElement('p');
      genresDisplay.className = 'genres_display';
      genresDisplay.setAttribute('id', 'track' + trackNum);
      if (track.genres === null) {
        genresDisplay.textContent = 'Retrieving genres...';
      } else if (track.genres.length === 0) {
        genresDisplay.textContent = 'No genres found.';
      } else {
        genresDisplay.textContent = 'Genres: ' + track.genres.join(', ');
      }
      trackDisplay.append(genresDisplay);

      trackNum += 1;
    });

    return fragment;
  };
}
