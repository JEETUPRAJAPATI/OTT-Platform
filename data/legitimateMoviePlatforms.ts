
export interface MoviePlatform {
  id: string;
  name: string;
  description: string;
  logo: string;
  baseUrl: string;
  searchUrl: string;
  isLegitimate: boolean;
  category: 'archive' | 'educational' | 'indie' | 'classic';
  features: string[];
}

export const legitimateMoviePlatforms: MoviePlatform[] = [
  {
    id: 'internet-archive',
    name: 'Internet Archive',
    description: 'Free movies, documentaries, and classic films',
    logo: '🎬',
    baseUrl: 'https://archive.org',
    searchUrl: 'https://archive.org/search.php?query=',
    isLegitimate: true,
    category: 'archive',
    features: ['Free Download', 'No Ads', 'HD Quality', 'Legal']
  },
  {
    id: 'thekitchenspot',
    name: 'The Kitchen Spot',
    description: 'Free movie downloads and streaming',
    logo: '🍿',
    baseUrl: 'https://thekitchenspot.net',
    searchUrl: 'https://thekitchenspot.net/search?q=',
    isLegitimate: false,
    category: 'indie',
    features: ['Free Download', 'Multiple Formats', 'Fast Downloads']
  },
  {
    id: 'fmovies',
    name: 'FMovies',
    description: 'Watch movies and TV shows online',
    logo: '🎭',
    baseUrl: 'https://fmovies.to',
    searchUrl: 'https://fmovies.to/search/',
    isLegitimate: false,
    category: 'indie',
    features: ['HD Quality', 'No Registration', 'Fast Streaming']
  },
  {
    id: 'yesmovies',
    name: 'YesMovies',
    description: 'Free online movie streaming',
    logo: '📱',
    baseUrl: 'https://yesmovies.ag',
    searchUrl: 'https://yesmovies.ag/search/',
    isLegitimate: false,
    category: 'indie',
    features: ['Free Streaming', 'Multiple Servers', 'Latest Movies']
  },
  {
    id: 'public-domain-movies',
    name: 'Public Domain Movies',
    description: 'Classic movies in the public domain',
    logo: '🎭',
    baseUrl: 'https://publicdomainmovie.net',
    searchUrl: 'https://publicdomainmovie.net/search/',
    isLegitimate: true,
    category: 'classic',
    features: ['Public Domain', 'Classic Films', 'Free Streaming']
  },
  {
    id: 'open-culture',
    name: 'Open Culture',
    description: 'Free cultural and educational movies',
    logo: '🎓',
    baseUrl: 'https://openculture.com',
    searchUrl: 'https://openculture.com/freemoviesonline',
    isLegitimate: true,
    category: 'educational',
    features: ['Educational', 'Documentaries', 'Art Films']
  }
];

export const movieCategories = [
  { id: 'all', name: 'All Platforms', icon: '🌐' },
  { id: 'archive', name: 'Archives', icon: '📚' },
  { id: 'educational', name: 'Educational', icon: '🎓' },
  { id: 'indie', name: 'Independent', icon: '🎬' },
  { id: 'classic', name: 'Classic', icon: '🎭' }
];
