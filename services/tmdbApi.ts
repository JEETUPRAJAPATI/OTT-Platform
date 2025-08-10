import axios from 'axios';

const TMDB_API_KEY = 'd0405b9f1383e118f9cfa86d7b74e2b9';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const tmdbApi = axios.create({
  baseURL: BASE_URL,
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

export interface TMDbGenre {
  id: number;
  name: string;
}

export interface TMDbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

class TMDbService {
  // Get trending movies and TV shows
  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
    return response.data.results;
  }

  // Get popular movies
  async getPopularMovies(page: number = 1) {
    const response = await tmdbApi.get('/movie/popular', { params: { page } });
    return response.data.results;
  }

  // Get popular TV shows
  async getPopularTVShows(page: number = 1) {
    const response = await tmdbApi.get('/tv/popular', { params: { page } });
    return response.data.results;
  }

  // Get top rated movies
  async getTopRatedMovies(page: number = 1) {
    const response = await tmdbApi.get('/movie/top_rated', { params: { page } });
    return response.data.results;
  }

  // Get upcoming movies
  async getUpcomingMovies(page: number = 1) {
    const response = await tmdbApi.get('/movie/upcoming', { params: { page } });
    return response.data.results;
  }

  // Get movies by genre
  async getMoviesByGenre(genreId: number, page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { with_genres: genreId, page }
    });
    return response.data.results;
  }

  // Get Hindi movies (Bollywood)
  async getHindiMovies(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        with_original_language: 'hi',
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get South Indian movies (Tamil, Telugu, Malayalam, Kannada)
  async getSouthIndianMovies(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        with_original_language: 'ta|te|ml|kn',
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get Marvel movies
  async getMarvelMovies(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        with_companies: '420',
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get thriller movies for 2025
  async getThrillerMovies2025(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        with_genres: '53',
        primary_release_year: '2025',
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get family movies
  async getFamilyMovies(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        with_genres: '10751',
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get romantic movies
  async getRomanticMovies(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        with_genres: '10749',
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get award winners (high rated movies)
  async getAwardWinners(page: number = 1) {
    const response = await tmdbApi.get('/discover/movie', {
      params: { 
        'vote_average.gte': 8.0,
        'vote_count.gte': 1000,
        sort_by: 'vote_average.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Search movies and TV shows
  async searchMulti(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/multi', {
      params: { query, page }
    });
    return response.data.results;
  }

  // Get movie details
  async getMovieDetails(movieId: number) {
    const response = await tmdbApi.get(`/movie/${movieId}`, {
      params: { append_to_response: 'credits,videos' }
    });
    return response.data;
  }

  // Get movie credits
  async getMovieCredits(movieId: number) {
    const response = await tmdbApi.get(`/movie/${movieId}/credits`);
    return response.data;
  }

  // Get movie videos
  async getMovieVideos(movieId: number) {
    const response = await tmdbApi.get(`/movie/${movieId}/videos`);
    return response.data;
  }

  // Get TV show details
  async getTVShowDetails(tvId: number) {
    const response = await tmdbApi.get(`/tv/${tvId}`, {
      params: { append_to_response: 'credits,videos' }
    });
    return response.data;
  }

  // Get TV show credits
  async getTVCredits(tvId: number) {
    const response = await tmdbApi.get(`/tv/${tvId}/credits`);
    return response.data;
  }

  // Get TV show videos
  async getTVVideos(tvId: number) {
    const response = await tmdbApi.get(`/tv/${tvId}/videos`);
    return response.data;
  }

  // Get genres
  async getMovieGenres() {
    const response = await tmdbApi.get('/genre/movie/list');
    return response.data.genres;
  }

  async getTVGenres() {
    const response = await tmdbApi.get('/genre/tv/list');
    return response.data.genres;
  }

  // Helper function to get full image URL
  getImageUrl(path: string, size: string = 'w500') {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
  }

  // Helper function to get YouTube trailer URL
  getYouTubeUrl(key: string) {
    return `https://www.youtube.com/watch?v=${key}`;
  }

  // ENHANCED OTT PLATFORM FEATURES

  // Get airing today TV shows
  async getAiringTodayTVShows(page: number = 1) {
    const response = await tmdbApi.get('/tv/airing_today', { params: { page } });
    return response.data.results;
  }

  // Get on air TV shows
  async getOnAirTVShows(page: number = 1) {
    const response = await tmdbApi.get('/tv/on_the_air', { params: { page } });
    return response.data.results;
  }

  // Get top rated TV shows
  async getTopRatedTVShows(page: number = 1) {
    const response = await tmdbApi.get('/tv/top_rated', { params: { page } });
    return response.data.results;
  }

  // Get now playing movies
  async getNowPlayingMovies(page: number = 1) {
    const response = await tmdbApi.get('/movie/now_playing', { params: { page } });
    return response.data.results;
  }

  // Get similar movies
  async getSimilarMovies(movieId: number, page: number = 1) {
    const response = await tmdbApi.get(`/movie/${movieId}/similar`, { params: { page } });
    return response.data.results;
  }

  // Get similar TV shows
  async getSimilarTVShows(tvId: number, page: number = 1) {
    const response = await tmdbApi.get(`/tv/${tvId}/similar`, { params: { page } });
    return response.data.results;
  }

  // Get movie recommendations
  async getMovieRecommendations(movieId: number, page: number = 1) {
    const response = await tmdbApi.get(`/movie/${movieId}/recommendations`, { params: { page } });
    return response.data.results;
  }

  // Get TV show recommendations
  async getTVRecommendations(tvId: number, page: number = 1) {
    const response = await tmdbApi.get(`/tv/${tvId}/recommendations`, { params: { page } });
    return response.data.results;
  }

  // Get movie reviews
  async getMovieReviews(movieId: number, page: number = 1) {
    const response = await tmdbApi.get(`/movie/${movieId}/reviews`, { params: { page } });
    return response.data.results;
  }

  // Get TV show reviews
  async getTVReviews(tvId: number, page: number = 1) {
    const response = await tmdbApi.get(`/tv/${tvId}/reviews`, { params: { page } });
    return response.data.results;
  }

  // Get movie watch providers
  async getMovieWatchProviders(movieId: number) {
    const response = await tmdbApi.get(`/movie/${movieId}/watch/providers`);
    return response.data;
  }

  // Get TV watch providers
  async getTVWatchProviders(tvId: number) {
    const response = await tmdbApi.get(`/tv/${tvId}/watch/providers`);
    return response.data;
  }

  // Get person details
  async getPersonDetails(personId: number) {
    const response = await tmdbApi.get(`/person/${personId}`, {
      params: { append_to_response: 'movie_credits,tv_credits,combined_credits,images' }
    });
    return response.data;
  }

  // Get popular people
  async getPopularPeople(page: number = 1) {
    const response = await tmdbApi.get('/person/popular', { params: { page } });
    return response.data.results;
  }

  // Get TV season details
  async getTVSeasonDetails(tvId: number, seasonNumber: number) {
    const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`, {
      params: { append_to_response: 'credits,videos,images' }
    });
    return response.data;
  }

  // Get TV episode details
  async getTVEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number) {
    const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
      params: { append_to_response: 'credits,videos,images' }
    });
    return response.data;
  }

  // Get collection details
  async getCollectionDetails(collectionId: number) {
    const response = await tmdbApi.get(`/collection/${collectionId}`, {
      params: { append_to_response: 'images' }
    });
    return response.data;
  }

  // Get movie keywords
  async getMovieKeywords(movieId: number) {
    const response = await tmdbApi.get(`/movie/${movieId}/keywords`);
    return response.data.keywords;
  }

  // Get TV keywords
  async getTVKeywords(tvId: number) {
    const response = await tmdbApi.get(`/tv/${tvId}/keywords`);
    return response.data.results;
  }

  // Get available watch provider regions
  async getWatchProviderRegions() {
    const response = await tmdbApi.get('/watch/providers/regions');
    return response.data.results;
  }

  // Get movie watch providers list
  async getMovieWatchProvidersList() {
    const response = await tmdbApi.get('/watch/providers/movie');
    return response.data.results;
  }

  // Get TV watch providers list
  async getTVWatchProvidersList() {
    const response = await tmdbApi.get('/watch/providers/tv');
    return response.data.results;
  }

  // Get configuration
  async getConfiguration() {
    const response = await tmdbApi.get('/configuration');
    return response.data;
  }

  // Get countries
  async getCountries() {
    const response = await tmdbApi.get('/configuration/countries');
    return response.data;
  }

  // Get languages
  async getLanguages() {
    const response = await tmdbApi.get('/configuration/languages');
    return response.data;
  }

  // Advanced search with filters
  async advancedMovieSearch(filters: {
    query?: string;
    with_genres?: string;
    with_original_language?: string;
    primary_release_year?: number;
    'vote_average.gte'?: number;
    'vote_count.gte'?: number;
    sort_by?: string;
    page?: number;
  }) {
    const response = await tmdbApi.get('/discover/movie', { params: filters });
    return response.data.results;
  }

  // Advanced TV search with filters
  async advancedTVSearch(filters: {
    query?: string;
    with_genres?: string;
    with_original_language?: string;
    first_air_date_year?: number;
    'vote_average.gte'?: number;
    'vote_count.gte'?: number;
    sort_by?: string;
    page?: number;
  }) {
    const response = await tmdbApi.get('/discover/tv', { params: filters });
    return response.data.results;
  }

  // Get content by multiple genres
  async getContentByGenres(genreIds: number[], mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
    const response = await tmdbApi.get(endpoint, {
      params: { 
        with_genres: genreIds.join(','),
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get regional content (by country)
  async getRegionalContent(country: string, mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
    const response = await tmdbApi.get(endpoint, {
      params: { 
        with_origin_country: country,
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get content by release year
  async getContentByYear(year: number, mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
    const yearParam = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    const response = await tmdbApi.get(endpoint, {
      params: { 
        [yearParam]: year,
        sort_by: 'popularity.desc',
        page 
      }
    });
    return response.data.results;
  }

  // Get content by rating range
  async getContentByRating(minRating: number, maxRating: number, mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
    const response = await tmdbApi.get(endpoint, {
      params: { 
        'vote_average.gte': minRating,
        'vote_average.lte': maxRating,
        'vote_count.gte': 100, // Ensure enough votes for reliability
        sort_by: 'vote_average.desc',
        page 
      }
    });
    return response.data.results;
  }

  // WATCH PROVIDERS API METHODS

  // Get available watch providers by region
  async getWatchProviders(region: string = 'US') {
    try {
      const [movieProviders, tvProviders] = await Promise.all([
        tmdbApi.get('/watch/providers/movie', { params: { watch_region: region } }),
        tmdbApi.get('/watch/providers/tv', { params: { watch_region: region } })
      ]);
      
      // Combine and deduplicate providers
      const allProviders = [...movieProviders.data.results, ...tvProviders.data.results];
      const uniqueProviders = allProviders.reduce((acc, provider) => {
        if (!acc.find(p => p.provider_id === provider.provider_id)) {
          acc.push(provider);
        }
        return acc;
      }, []);
      
      return uniqueProviders.sort((a, b) => b.display_priority - a.display_priority);
    } catch (error) {
      console.error('Error fetching watch providers:', error);
      return [];
    }
  }

  // Get content by watch provider
  async getContentByProvider(providerId: number, mediaType: 'movie' | 'tv' = 'movie', region: string = 'US', page: number = 1) {
    try {
      const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
      const response = await tmdbApi.get(endpoint, {
        params: {
          with_watch_providers: providerId,
          watch_region: region,
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching content for provider ${providerId}:`, error);
      return { results: [], total_pages: 0, total_results: 0 };
    }
  }

  // Get popular content from specific providers
  async getPopularByProviders(providerIds: number[], mediaType: 'movie' | 'tv' = 'movie', region: string = 'US', page: number = 1) {
    try {
      const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
      const response = await tmdbApi.get(endpoint, {
        params: {
          with_watch_providers: providerIds.join('|'),
          watch_region: region,
          sort_by: 'popularity.desc',
          'vote_count.gte': 100,
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular content by providers:', error);
      return [];
    }
  }

  // Get trending content from specific providers
  async getTrendingByProviders(providerIds: number[], mediaType: 'movie' | 'tv' = 'movie', region: string = 'US') {
    try {
      const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
      const response = await tmdbApi.get(endpoint, {
        params: {
          with_watch_providers: providerIds.join('|'),
          watch_region: region,
          sort_by: 'popularity.desc',
          'release_date.gte': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
          page: 1
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching trending content by providers:', error);
      return [];
    }
  }

  // Get trending content by time window
  async getTrendingByTimeWindow(mediaType: 'movie' | 'tv' | 'person' = 'movie', timeWindow: 'day' | 'week' = 'week', page: number = 1) {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`, { params: { page } });
    return response.data.results;
  }

  // Get latest content
  async getLatestMovie() {
    const response = await tmdbApi.get('/movie/latest');
    return response.data;
  }

  async getLatestTV() {
    const response = await tmdbApi.get('/tv/latest');
    return response.data;
  }

  // Multi-search (movies, TV, people)
  async multiSearch(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/multi', {
      params: { query, page }
    });
    return response.data.results;
  }

  // Search by person
  async searchPerson(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/person', {
      params: { query, page }
    });
    return response.data.results;
  }

  // Search by company
  async searchCompany(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/company', {
      params: { query, page }
    });
    return response.data.results;
  }

  // Search by keyword
  async searchKeyword(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/keyword', {
      params: { query, page }
    });
    return response.data.results;
  }

  // Search by collection
  async searchCollection(query: string, page: number = 1) {
    const response = await tmdbApi.get('/search/collection', {
      params: { query, page }
    });
    return response.data.results;
  }
}

export const tmdbService = new TMDbService();
export { IMAGE_BASE_URL };