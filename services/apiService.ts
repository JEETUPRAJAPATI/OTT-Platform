
// API Service for favorites, watchlist, ratings, and reviews
export interface FavoriteItem {
  id: string;
  contentId: string;
  title: string;
  posterPath: string;
  contentType: 'movie' | 'tv';
  addedAt: string;
}

export interface WatchlistItem {
  id: string;
  contentId: string;
  title: string;
  posterPath: string;
  contentType: 'movie' | 'tv';
  addedAt: string;
}

export interface Rating {
  id: string;
  contentId: string;
  rating: number; // 1-5 stars
  contentType: 'movie' | 'tv';
  createdAt: string;
}

export interface Review {
  id: string;
  contentId: string;
  title: string;
  review: string;
  rating: number;
  contentType: 'movie' | 'tv';
  createdAt: string;
  userName?: string;
}

class ApiService {
  private baseUrl = 'https://api.example.com'; // Replace with your actual API URL
  
  // Favorites API
  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      // Mock data for now - replace with actual API call
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.default.getItem('favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  async addToFavorites(contentId: string, title: string, posterPath: string, contentType: 'movie' | 'tv'): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const newFavorite: FavoriteItem = {
        id: Date.now().toString(),
        contentId,
        title,
        posterPath,
        contentType,
        addedAt: new Date().toISOString(),
      };
      
      const updatedFavorites = [...favorites, newFavorite];
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('favorites', JSON.stringify(updatedFavorites));
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  async removeFromFavorites(contentId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(item => item.contentId !== contentId);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('favorites', JSON.stringify(updatedFavorites));
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  async isFavorite(contentId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(item => item.contentId === contentId);
  }

  // Watchlist API
  async getWatchlist(): Promise<WatchlistItem[]> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.default.getItem('watchlist');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  }

  async addToWatchlist(contentId: string, title: string, posterPath: string, contentType: 'movie' | 'tv'): Promise<boolean> {
    try {
      const watchlist = await this.getWatchlist();
      const newWatchlistItem: WatchlistItem = {
        id: Date.now().toString(),
        contentId,
        title,
        posterPath,
        contentType,
        addedAt: new Date().toISOString(),
      };
      
      const updatedWatchlist = [...watchlist, newWatchlistItem];
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('watchlist', JSON.stringify(updatedWatchlist));
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  }

  async removeFromWatchlist(contentId: string): Promise<boolean> {
    try {
      const watchlist = await this.getWatchlist();
      const updatedWatchlist = watchlist.filter(item => item.contentId !== contentId);
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('watchlist', JSON.stringify(updatedWatchlist));
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  }

  async isInWatchlist(contentId: string): Promise<boolean> {
    const watchlist = await this.getWatchlist();
    return watchlist.some(item => item.contentId === contentId);
  }

  // Ratings API
  async getRatings(): Promise<Rating[]> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.default.getItem('ratings');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }
  }

  async addRating(contentId: string, rating: number, contentType: 'movie' | 'tv'): Promise<boolean> {
    try {
      const ratings = await this.getRatings();
      const existingRatingIndex = ratings.findIndex(r => r.contentId === contentId);
      
      const newRating: Rating = {
        id: Date.now().toString(),
        contentId,
        rating,
        contentType,
        createdAt: new Date().toISOString(),
      };

      if (existingRatingIndex >= 0) {
        ratings[existingRatingIndex] = newRating;
      } else {
        ratings.push(newRating);
      }
      
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('ratings', JSON.stringify(ratings));
      return true;
    } catch (error) {
      console.error('Error adding rating:', error);
      return false;
    }
  }

  async getRating(contentId: string): Promise<number | null> {
    const ratings = await this.getRatings();
    const rating = ratings.find(r => r.contentId === contentId);
    return rating ? rating.rating : null;
  }

  // Reviews API
  async getReviews(): Promise<Review[]> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.default.getItem('reviews');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  async addReview(contentId: string, title: string, review: string, rating: number, contentType: 'movie' | 'tv'): Promise<boolean> {
    try {
      const reviews = await this.getReviews();
      const newReview: Review = {
        id: Date.now().toString(),
        contentId,
        title,
        review,
        rating,
        contentType,
        createdAt: new Date().toISOString(),
        userName: 'You',
      };
      
      const updatedReviews = [newReview, ...reviews];
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('reviews', JSON.stringify(updatedReviews));
      return true;
    } catch (error) {
      console.error('Error adding review:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
