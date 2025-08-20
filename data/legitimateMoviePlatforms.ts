export interface MoviePlatform {
  id: string;
  name: string;
  description: string;
  logo: string;
  baseUrl: string;
  searchUrl: string;
  isLegitimate: boolean;
  category: 'archive' | 'educational' | 'indie' | 'classic' | 'streaming';
  features: string[];
}

export const legitimateMoviePlatforms: MoviePlatform[] = [
  {
    id: 'internet-archive',
    name: 'Internet Archive',
    logo: '📚',
    description: 'Free digital library with movies, books, and historical content',
    baseUrl: 'https://archive.org',
    searchUrl: 'https://archive.org/search.php?query=',
    category: 'archive',
    features: ['Free Content', 'Historical Films', 'Public Domain'],
    isLegitimate: true,
  },
];

// External platforms for streaming and downloading
export const externalMoviePlatforms: MoviePlatform[] = [
  {
    id: 'thekitchenspot',
    name: 'The Kitchen Spot',
    logo: '🍿',
    description: 'Movie streaming and download platform',
    baseUrl: 'https://thekitchenspot.net',
    searchUrl: 'https://thekitchenspot.net/search?q=',
    category: 'streaming',
    features: ['Free Movies', 'HD Quality', 'Latest Releases'],
    isLegitimate: false,
  },
  {
    id: 'fmovies',
    name: 'Fmovies',
    logo: '🎬',
    description: 'Free movie and TV show streaming',
    baseUrl: 'https://fmovies.to',
    searchUrl: 'https://fmovies.to/search?keyword=',
    category: 'streaming',
    features: ['Free Streaming', 'TV Shows', 'Movies'],
    isLegitimate: false,
  },
  {
    id: 'yesmovies',
    name: 'YesMovies',
    logo: '✅',
    description: 'Free online movie streaming platform',
    baseUrl: 'https://yesmovies.ag',
    searchUrl: 'https://yesmovies.ag/search?q=',
    category: 'streaming',
    features: ['Free Content', 'HD Streaming', 'Popular Movies'],
    isLegitimate: false,
  },
];

// Combined list for backward compatibility
export const allMoviePlatforms: MoviePlatform[] = [
  ...legitimateMoviePlatforms,
  ...externalMoviePlatforms,
];

export const movieCategories = [
  { id: 'all', name: 'All Platforms', icon: '🌐' },
  { id: 'archive', name: 'Archives', icon: '📚' },
  { id: 'educational', name: 'Educational', icon: '🎓' },
  { id: 'indie', name: 'Independent', icon: '🎬' },
  { id: 'classic', name: 'Classic', icon: '🎭' }
];