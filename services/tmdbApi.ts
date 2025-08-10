import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = 'a4b8ec8bb47b90b3ad4a04b2c0fc8a9a';

const tmdbAxios = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface TMDbTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface TMDbPerson {
  id: number;
  name: string;
  profile_path: string;
  known_for_department: string;
  popularity: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

class TMDbService {
  // Get image URL for TMDb images
  getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  // Get popular streaming providers for a region
  async getWatchProviders(region: string = 'US'): Promise<WatchProvider[]> {
    try {
      const response = await tmdbAxios.get(`/watch/providers/movie`, {
        params: { watch_region: region }
      });

      let providers = response.data.results || [];

      // Add some additional popular platforms that might not be in API
      const additionalPlatforms = [
        {
          provider_id: 1899,
          provider_name: "Max",
          logo_path: "/wpOTbpJmhKgJKl8AgtgkvZQ7H9O.jpg",
          display_priority: 15
        },
        {
          provider_id: 1796,
          provider_name: "Crunchyroll",
          logo_path: "/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg",
          display_priority: 25
        },
        {
          provider_id: 1838,
          provider_name: "Funimation",
          logo_path: "/kl6aKMzplmJWWbHPIz6xJEt8rCX.jpg",
          display_priority: 30
        },
        {
          provider_id: 1945,
          provider_name: "Tubi",
          logo_path: "/4nAyR5Ye6a4J12Lv8CHwZbxT5K3.jpg",
          display_priority: 35
        },
        {
          provider_id: 1789,
          provider_name: "Pluto TV",
          logo_path: "/kF3g0zSK6PQxK7WdMfMXCFO6vy9.jpg",
          display_priority: 40
        },
        {
          provider_id: 1654,
          provider_name: "Vudu",
          logo_path: "/7TVfqxyNOjKf7GNTZkxPGVpRy7l.jpg",
          display_priority: 45
        }
      ];

      // Merge with existing providers
      providers = [...providers, ...additionalPlatforms];

      // Sort by display priority and popularity
      return providers
        .sort((a: any, b: any) => (a.display_priority || 100) - (b.display_priority || 100))
        .slice(0, 25); // Return top 25 platforms
    } catch (error) {
      console.error('Error fetching watch providers:', error);

      // Return fallback popular platforms
      return [
        {
          provider_id: 8,
          provider_name: "Netflix",
          logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg",
          display_priority: 1
        },
        {
          provider_id: 9,
          provider_name: "Amazon Prime Video",
          logo_path: "/emthp39XA2YScoYL1p0sdbAH2WA.jpg",
          display_priority: 2
        },
        {
          provider_id: 337,
          provider_name: "Disney Plus",
          logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg",
          display_priority: 3
        },
        {
          provider_id: 15,
          provider_name: "Hulu",
          logo_path: "/giwM8XX4V2AQb9vsoN7yti82tKK.jpg",
          display_priority: 4
        },
        {
          provider_id: 384,
          provider_name: "HBO Max",
          logo_path: "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg",
          display_priority: 5
        },
        {
          provider_id: 350,
          provider_name: "Apple TV Plus",
          logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg",
          display_priority: 6
        },
        {
          provider_id: 531,
          provider_name: "Paramount Plus",
          logo_path: "/fi83B1oztoS47xxcemFdTztUbnG.jpg",
          display_priority: 7
        },
        {
          provider_id: 387,
          provider_name: "Peacock Premium",
          logo_path: "/xTVM8PsEBOa5hm7NtGJ0wJpZo8V.jpg",
          display_priority: 8
        }
      ];
    }
  }

  // Get movies/shows by provider
  async getContentByProvider(providerId: number, type: 'movie' | 'tv' = 'movie', region: string = 'US', page: number = 1): Promise<(TMDbMovie | TMDbTVShow)[]> {
    try {
      const response = await tmdbAxios.get(`/discover/${type}`, {
        params: {
          with_watch_providers: providerId,
          watch_region: region,
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching content by provider:', error);
      return [];
    }
  }

  // Get trending content
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<(TMDbMovie | TMDbTVShow)[]> {
    try {
      const response = await tmdbAxios.get(`/trending/${mediaType}/${timeWindow}`);
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching trending content:', error);
      return [];
    }
  }

  // Get popular movies
  async getPopularMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/movie/popular', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  }

  // Get top rated movies
  async getTopRatedMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/movie/top_rated', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return [];
    }
  }

  // Get upcoming movies
  async getUpcomingMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/movie/upcoming', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      return [];
    }
  }

  // Get now playing movies
  async getNowPlayingMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/movie/now_playing', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      return [];
    }
  }

  // Get popular TV shows
  async getPopularTVShows(page: number = 1): Promise<TMDbTVShow[]> {
    try {
      const response = await tmdbAxios.get('/tv/popular', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      return [];
    }
  }

  // Get top rated TV shows
  async getTopRatedTVShows(page: number = 1): Promise<TMDbTVShow[]> {
    try {
      const response = await tmdbAxios.get('/tv/top_rated', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching top rated TV shows:', error);
      return [];
    }
  }

  // Get airing today TV shows
  async getAiringTodayTVShows(page: number = 1): Promise<TMDbTVShow[]> {
    try {
      const response = await tmdbAxios.get('/tv/airing_today', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching airing today TV shows:', error);
      return [];
    }
  }

  // Get on air TV shows
  async getOnAirTVShows(page: number = 1): Promise<TMDbTVShow[]> {
    try {
      const response = await tmdbAxios.get('/tv/on_the_air', {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching on air TV shows:', error);
      return [];
    }
  }

  // Get content by genre
  async getContentByGenres(genreIds: number[], type: 'movie' | 'tv' = 'movie', page: number = 1): Promise<(TMDbMovie | TMDbTVShow)[]> {
    try {
      const response = await tmdbAxios.get(`/discover/${type}`, {
        params: {
          with_genres: genreIds.join(','),
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching content by genres:', error);
      return [];
    }
  }

  // Get Hindi movies
  async getHindiMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          with_original_language: 'hi',
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching Hindi movies:', error);
      return [];
    }
  }

  // Get South Indian movies (Telugu, Tamil, Malayalam, Kannada)
  async getSouthIndianMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          with_original_language: 'te|ta|ml|kn',
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching South Indian movies:', error);
      return [];
    }
  }

  // Get Marvel movies
  async getMarvelMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          with_companies: '420|7505', // Marvel Studios and Marvel Entertainment
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching Marvel movies:', error);
      return [];
    }
  }

  // Get thriller movies from 2025
  async getThrillerMovies2025(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          with_genres: '53', // Thriller genre ID
          primary_release_year: 2025,
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching thriller movies 2025:', error);
      return [];
    }
  }

  // Get family movies
  async getFamilyMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          with_genres: '10751', // Family genre ID
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching family movies:', error);
      return [];
    }
  }

  // Get romantic movies
  async getRomanticMovies(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          with_genres: '10749', // Romance genre ID
          page,
          sort_by: 'popularity.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching romantic movies:', error);
      return [];
    }
  }

  // Get award winners (using vote_average as proxy)
  async getAwardWinners(page: number = 1): Promise<TMDbMovie[]> {
    try {
      const response = await tmdbAxios.get('/discover/movie', {
        params: {
          'vote_average.gte': 8.0,
          'vote_count.gte': 1000,
          page,
          sort_by: 'vote_average.desc'
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching award winners:', error);
      return [];
    }
  }

  // Get movie/TV details
  async getDetails(id: number, type: 'movie' | 'tv'): Promise<any> {
    try {
      const response = await tmdbAxios.get(`/${type}/${id}`, {
        params: {
          append_to_response: 'credits,videos,watch/providers,similar,recommendations'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching details:', error);
      return null;
    }
  }

  // Search for content
  async search(query: string, type: 'multi' | 'movie' | 'tv' | 'person' = 'multi', page: number = 1): Promise<any[]> {
    try {
      const response = await tmdbAxios.get(`/search/${type}`, {
        params: {
          query,
          page
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching content:', error);
      return [];
    }
  }
}

export const tmdbService = new TMDbService();