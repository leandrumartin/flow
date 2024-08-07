import GenreSort from './GenreSort.js';
import MoodSort from './MoodSort.js';
import AISort from './AISort.js';

export default function SortFactory(sortMethodString) {
  switch (sortMethodString) {
    case 'genre':
      return new GenreSort();
      break;
    case 'mood':
      return new MoodSort();
      break;
    case 'AI':
      return new AISort();
      break;
  }
}
