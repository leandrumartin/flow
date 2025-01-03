/**
 * Class for creating a basic display for a playlist.
 */
export default class PlaylistDisplay {
  constructor(trackList) {
    this.trackList = trackList;
  }

  /**
   * Create a basic display for the playlist, with each track's name, artist names, art, and genre list.
   * @param {GenreSort | AISort | MoodSort} sort - Sort object to use for getting display text.
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

      let dataDisplay = document.createElement('p');
      dataDisplay.className = 'data_display';
      dataDisplay.setAttribute('id', 'track' + trackNum);
      dataDisplay.textContent = this.trackList.getDisplayText(sort, trackNum);
      trackDisplay.append(dataDisplay);

      trackNum += 1;
    });

    return fragment;
  };
}
