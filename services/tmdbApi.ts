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
    try {
      const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching trending ${mediaType} for ${timeWindow}:`, error);
      return [];
    }
  }

  // Get popular movies
  async getPopularMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/movie/popular', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  }

  // Get popular TV shows
  async getPopularTVShows(page: number = 1) {
    try {
      const response = await tmdbApi.get('/tv/popular', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      return [];
    }
  }

  // Get top rated movies
  async getTopRatedMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/movie/top_rated', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      return [];
    }
  }

  // Get upcoming movies
  async getUpcomingMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/movie/upcoming', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      return [];
    }
  }

  // Get movies by genre
  async getMoviesByGenre(genreId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: { with_genres: genreId, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching movies by genre ${genreId}:`, error);
      return [];
    }
  }

  // Get Hindi movies (Bollywood)
  async getHindiMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          with_original_language: 'hi',
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching Hindi movies:', error);
      return [];
    }
  }

  // Get South Indian movies (Tamil, Telugu, Malayalam, Kannada)
  async getSouthIndianMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          with_original_language: 'ta|te|ml|kn',
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching South Indian movies:', error);
      return [];
    }
  }

  // Get Marvel movies
  async getMarvelMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          with_companies: '420',
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching Marvel movies:', error);
      return [];
    }
  }

  // Get thriller movies for 2025
  async getThrillerMovies2025(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          with_genres: '53',
          primary_release_year: '2025',
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching Thriller movies for 2025:', error);
      return [];
    }
  }

  // Get family movies
  async getFamilyMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          with_genres: '10751',
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching Family movies:', error);
      return [];
    }
  }

  // Get romantic movies
  async getRomanticMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          with_genres: '10749',
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching Romantic movies:', error);
      return [];
    }
  }

  // Get award winners (high rated movies)
  async getAwardWinners(page: number = 1) {
    try {
      const response = await tmdbApi.get('/discover/movie', {
        params: {
          'vote_average.gte': 8.0,
          'vote_count.gte': 1000,
          sort_by: 'vote_average.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching Award Winners movies:', error);
      return [];
    }
  }

  // Search movies and TV shows
  async searchMulti(query: string, page: number = 1) {
    try {
      const response = await tmdbApi.get('/search/multi', {
        params: { query, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error searching multi for query "${query}":`, error);
      return [];
    }
  }

  // Get movie details
  async getMovieDetails(movieId: number) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}`, {
        params: { append_to_response: 'credits,videos' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie details for movie ID ${movieId}:`, error);
      return null;
    }
  }

  // Get movie credits
  async getMovieCredits(movieId: number) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/credits`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie credits for movie ID ${movieId}:`, error);
      return null;
    }
  }

  // Get movie videos
  async getMovieVideos(movieId: number) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/videos`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie videos for movie ID ${movieId}:`, error);
      return null;
    }
  }

  // Get TV show details
  async getTVShowDetails(tvId: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}`, {
        params: { append_to_response: 'credits,videos' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TV show details for TV ID ${tvId}:`, error);
      return null;
    }
  }

  // Get TV show credits
  async getTVCredits(tvId: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/credits`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching TV show credits for TV ID ${tvId}:`, error);
      return null;
    }
  }

  // Get TV show videos
  async getTVVideos(tvId: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/videos`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching TV show videos for TV ID ${tvId}:`, error);
      return null;
    }
  }

  // Get genres
  async getMovieGenres() {
    try {
      const response = await tmdbApi.get('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching movie genres:', error);
      return [];
    }
  }

  async getTVGenres() {
    try {
      const response = await tmdbApi.get('/genre/tv/list');
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching TV genres:', error);
      return [];
    }
  }

  // Helper function to get full image URL
  getImageUrl(path: string | null): string {
    if (!path) return '';
    try {
      return `${IMAGE_BASE_URL}${path}`;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return '';
    }
  }

  // Helper function to get YouTube trailer URL
  getYouTubeUrl(key: string): string {
    if (!key) return '';
    try {
      return `https://www.youtube.com/watch?v=${key}`;
    } catch (error) {
      console.error('Error generating YouTube URL:', error);
      return '';
    }
  }

  // ENHANCED OTT PLATFORM FEATURES

  // Get airing today TV shows
  async getAiringTodayTVShows(page: number = 1) {
    try {
      const response = await tmdbApi.get('/tv/airing_today', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching airing today TV shows:', error);
      return [];
    }
  }

  // Get on air TV shows
  async getOnAirTVShows(page: number = 1) {
    try {
      const response = await tmdbApi.get('/tv/on_the_air', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching on air TV shows:', error);
      return [];
    }
  }

  // Get top rated TV shows
  async getTopRatedTVShows(page: number = 1) {
    try {
      const response = await tmdbApi.get('/tv/top_rated', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching top rated TV shows:', error);
      return [];
    }
  }

  // Get now playing movies
  async getNowPlayingMovies(page: number = 1) {
    try {
      const response = await tmdbApi.get('/movie/now_playing', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      return [];
    }
  }

  // Get similar movies
  async getSimilarMovies(movieId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/similar`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching similar movies for movie ID ${movieId}:`, error);
      return [];
    }
  }

  // Get similar TV shows
  async getSimilarTVShows(tvId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/similar`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching similar TV shows for TV ID ${tvId}:`, error);
      return [];
    }
  }

  // Get movie recommendations
  async getMovieRecommendations(movieId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/recommendations`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching movie recommendations for movie ID ${movieId}:`, error);
      return [];
    }
  }

  // Get TV show recommendations
  async getTVRecommendations(tvId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/recommendations`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching TV show recommendations for TV ID ${tvId}:`, error);
      return [];
    }
  }

  // Get movie reviews
  async getMovieReviews(movieId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/reviews`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching movie reviews for movie ID ${movieId}:`, error);
      return [];
    }
  }

  // Get TV show reviews
  async getTVReviews(tvId: number, page: number = 1) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/reviews`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching TV show reviews for TV ID ${tvId}:`, error);
      return [];
    }
  }

  // Get movie watch providers
  async getMovieWatchProviders(movieId: number) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/watch/providers`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie watch providers for movie ID ${movieId}:`, error);
      return null;
    }
  }

  // Get TV watch providers
  async getTVWatchProviders(tvId: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/watch/providers`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching TV watch providers for TV ID ${tvId}:`, error);
      return null;
    }
  }

  // Get person details
  async getPersonDetails(personId: number) {
    try {
      const response = await tmdbApi.get(`/person/${personId}`, {
        params: { append_to_response: 'movie_credits,tv_credits,combined_credits,images' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching person details for person ID ${personId}:`, error);
      return null;
    }
  }

  // Get popular people
  async getPopularPeople(page: number = 1) {
    try {
      const response = await tmdbApi.get('/person/popular', { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular people:', error);
      return [];
    }
  }

  // Get TV season details
  async getTVSeasonDetails(tvId: number, seasonNumber: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`, {
        params: { append_to_response: 'credits,videos,images' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TV season details for TV ID ${tvId}, Season ${seasonNumber}:`, error);
      return null;
    }
  }

  // Get TV episode details
  async getTVEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
        params: { append_to_response: 'credits,videos,images' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching TV episode details for TV ID ${tvId}, Season ${seasonNumber}, Episode ${episodeNumber}:`, error);
      return null;
    }
  }

  // Get collection details
  async getCollectionDetails(collectionId: number) {
    try {
      const response = await tmdbApi.get(`/collection/${collectionId}`, {
        params: { append_to_response: 'images' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching collection details for collection ID ${collectionId}:`, error);
      return null;
    }
  }

  // Get movie keywords
  async getMovieKeywords(movieId: number) {
    try {
      const response = await tmdbApi.get(`/movie/${movieId}/keywords`);
      return response.data.keywords;
    } catch (error) {
      console.error(`Error fetching movie keywords for movie ID ${movieId}:`, error);
      return [];
    }
  }

  // Get TV keywords
  async getTVKeywords(tvId: number) {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/keywords`);
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching TV keywords for TV ID ${tvId}:`, error);
      return [];
    }
  }

  // Get available watch provider regions
  async getWatchProviderRegions() {
    try {
      const response = await tmdbApi.get('/watch/providers/regions');
      return response.data.results;
    } catch (error) {
      console.error('Error fetching watch provider regions:', error);
      return [];
    }
  }

  // Get movie watch providers list
  async getMovieWatchProvidersList() {
    try {
      const response = await tmdbApi.get('/watch/providers/movie');
      return response.data.results;
    } catch (error) {
      console.error('Error fetching movie watch providers list:', error);
      return [];
    }
  }

  // Get TV watch providers list
  async getTVWatchProvidersList() {
    try {
      const response = await tmdbApi.get('/watch/providers/tv');
      return response.data.results;
    } catch (error) {
      console.error('Error fetching TV watch providers list:', error);
      return [];
    }
  }

  // Get configuration
  async getConfiguration() {
    try {
      const response = await tmdbApi.get('/configuration');
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return null;
    }
  }

  // Get countries
  async getCountries() {
    try {
      const response = await tmdbApi.get('/configuration/countries');
      return response.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  // Get languages
  async getLanguages() {
    try {
      const response = await tmdbApi.get('/configuration/languages');
      return response.data;
    } catch (error) {
      console.error('Error fetching languages:', error);
      return [];
    }
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
    try {
      const response = await tmdbApi.get('/discover/movie', { params: filters });
      return response.data.results;
    } catch (error) {
      console.error('Error performing advanced movie search:', error);
      return [];
    }
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
    try {
      const response = await tmdbApi.get('/discover/tv', { params: filters });
      return response.data.results;
    } catch (error) {
      console.error('Error performing advanced TV search:', error);
      return [];
    }
  }

  // Get content by multiple genres
  async getContentByGenres(genreIds: number[], mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    try {
      const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
      const response = await tmdbApi.get(endpoint, {
        params: {
          with_genres: genreIds.join(','),
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching ${mediaType} content by genres ${genreIds.join(',')}:`, error);
      return [];
    }
  }

  // Get regional content (by country)
  async getRegionalContent(country: string, mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    try {
      const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
      const response = await tmdbApi.get(endpoint, {
        params: {
          with_origin_country: country,
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching ${mediaType} content for country ${country}:`, error);
      return [];
    }
  }

  // Get content by release year
  async getContentByYear(year: number, mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    try {
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
    } catch (error) {
      console.error(`Error fetching ${mediaType} content for year ${year}:`, error);
      return [];
    }
  }

  // Get content by rating range
  async getContentByRating(minRating: number, maxRating: number, mediaType: 'movie' | 'tv' = 'movie', page: number = 1) {
    try {
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
    } catch (error) {
      console.error(`Error fetching ${mediaType} content with rating range ${minRating}-${maxRating}:`, error);
      return [];
    }
  }

  // Get trending content by time window
  async getTrendingByTimeWindow(mediaType: 'movie' | 'tv' | 'person' = 'movie', timeWindow: 'day' | 'week' = 'week', page: number = 1) {
    try {
      const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`, { params: { page } });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching trending ${mediaType} for ${timeWindow}:`, error);
      return [];
    }
  }

  // Get latest content
  async getLatestMovie() {
    try {
      const response = await tmdbApi.get('/movie/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching latest movie:', error);
      return null;
    }
  }

  async getLatestTV() {
    try {
      const response = await tmdbApi.get('/tv/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching latest TV show:', error);
      return null;
    }
  }

  // Multi-search (movies, TV, people)
  async multiSearch(query: string, page: number = 1) {
    try {
      const response = await tmdbApi.get('/search/multi', {
        params: { query, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error performing multi search for query "${query}":`, error);
      return [];
    }
  }

  // Search by person
  async searchPerson(query: string, page: number = 1) {
    try {
      const response = await tmdbApi.get('/search/person', {
        params: { query, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error searching for person "${query}":`, error);
      return [];
    }
  }

  // Search by company
  async searchCompany(query: string, page: number = 1) {
    try {
      const response = await tmdbApi.get('/search/company', {
        params: { query, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error searching for company "${query}":`, error);
      return [];
    }
  }

  // Search by keyword
  async searchKeyword(query: string, page: number = 1) {
    try {
      const response = await tmdbApi.get('/search/keyword', {
        params: { query, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error searching for keyword "${query}":`, error);
      return [];
    }
  }

  // Search by collection
  async searchCollection(query: string, page: number = 1) {
    try {
      const response = await tmdbApi.get('/search/collection', {
        params: { query, page }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error searching for collection "${query}":`, error);
      return [];
    }
  }
}

export const tmdbService = new TMDbService();
export { IMAGE_BASE_URL };