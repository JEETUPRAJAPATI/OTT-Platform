
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

  // Get TV show details
  async getTVShowDetails(tvId: number) {
    const response = await tmdbApi.get(`/tv/${tvId}`, {
      params: { append_to_response: 'credits,videos' }
    });
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
}

export const tmdbService = new TMDbService();
export { IMAGE_BASE_URL };
