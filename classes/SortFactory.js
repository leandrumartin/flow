import GenreSort from './GenreSort.js';
import MoodSort from './MoodSort.js';
import AISort from './AISort.js';

/**
 * Factory for creating sort objects
 * @param sortMethodString {string} - The type of sort object to create. Valid values are 'genre', 'mood', and 'AI'.
 * @returns {AISort|MoodSort|GenreSort}
 * @constructor
 */
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
