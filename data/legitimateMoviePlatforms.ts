
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
  },
  {
    id: 'retrovision',
    name: 'Retrovision',
    description: 'Classic TV shows and movies',
    logo: '📺',
    baseUrl: 'https://retrovision.tv',
    searchUrl: 'https://retrovision.tv/search/',
    isLegitimate: true,
    category: 'classic',
    features: ['Classic Content', 'TV Shows', 'Movies']
  },
  {
    id: 'film-chest',
    name: 'Film Chest',
    description: 'Independent and classic films',
    logo: '🎞️',
    baseUrl: 'https://filmchest.com',
    searchUrl: 'https://filmchest.com/search/',
    isLegitimate: true,
    category: 'indie',
    features: ['Independent Films', 'Free Streaming', 'Classic Movies']
  }
];

export const movieCategories = [
  { id: 'all', name: 'All Platforms', icon: '🌐' },
  { id: 'archive', name: 'Archives', icon: '📚' },
  { id: 'educational', name: 'Educational', icon: '🎓' },
  { id: 'indie', name: 'Independent', icon: '🎬' },
  { id: 'classic', name: 'Classic', icon: '🎭' }
];
