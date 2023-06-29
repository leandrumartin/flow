export default class PlaylistDisplay {
  constructor(trackList) {
    this.trackList = trackList;
  }

  /**
   * Creates a basic display for the playlist, with each track's name, artist names, art, and genre list.
   * @returns {DocumentFragment} DocumentFragment object with a <div> for each track.
   */
  getDisplay = (sort) => {
    let fragment = new DocumentFragment();
    let trackNum = 0;

    this.trackList.data.forEach((track) => {
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
      genresDisplay.textContent = this.trackList.getDisplayText(sort, trackNum);
      trackDisplay.append(genresDisplay);

      trackNum += 1;
    });

    return fragment;
  };
}
