
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface SavedItem {
  id: string;
  contentId: string;
  title: string;
  posterPath: string;
  contentType: 'movie' | 'tv';
  addedAt: string;
}

const STORAGE_KEYS = {
  FAVORITES: '@favorites',
  WATCHLIST: '@watchlist',
  RATINGS: '@ratings',
  REVIEWS: '@reviews',
  SAVED: '@saved',
};

class ApiService {
  private baseUrl = 'https://api.example.com'; // Replace with your actual API URL
  private storageInitialized = false;

  constructor() {
    this.initializeStorage();
  }

  // Helper method to safely handle AsyncStorage operations
  private async safeAsyncStorage<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      // Check if we're in a web environment
      if (typeof window !== 'undefined') {
        // Web environment - use localStorage directly
        const webOperation = operation.toString().includes('AsyncStorage.getItem') 
          ? () => this.webStorageOperation(operation) 
          : operation;
        return await webOperation();
      }
      
      // Add a small delay to ensure AsyncStorage is ready
      await new Promise(resolve => setTimeout(resolve, 10));
      return await operation();
    } catch (error) {
      console.warn('Storage operation failed:', error);
      return fallback;
    }
  }

  // Web storage operation handler
  private async webStorageOperation<T>(operation: () => Promise<T>): Promise<T> {
    // This is a fallback that uses localStorage for web
    try {
      const operationStr = operation.toString();
      if (operationStr.includes('getItem')) {
        // Extract key from operation and use localStorage
        return null as any; // Will be handled by fallback
      }
      return await operation();
    } catch (error) {
      throw error;
    }
  }

  // Initialize storage and ensure it's working
  private async initializeStorage(): Promise<void> {
    try {
      // Check if we're in a web environment with localStorage support
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        // Web environment - use localStorage
        const testKey = '@storage_test';
        const testValue = 'test';
        localStorage.setItem(testKey, testValue);
        const retrievedValue = localStorage.getItem(testKey);
        if (retrievedValue === testValue) {
          localStorage.removeItem(testKey);
          console.log('Web storage initialized successfully');
        }
        return;
      }

      // Native environment - use AsyncStorage
      const testKey = '@storage_test';
      const testValue = 'test';
      await AsyncStorage.setItem(testKey, testValue);
      const retrievedValue = await AsyncStorage.getItem(testKey);
      if (retrievedValue === testValue) {
        await AsyncStorage.removeItem(testKey);
        console.log('AsyncStorage initialized successfully');
      } else {
        console.error('AsyncStorage test failed - values do not match');
      }
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  }

  // Favorites API
  async getFavorites(): Promise<FavoriteItem[]> {
    if (!this.storageInitialized) {
      await this.initializeStorage();
      this.storageInitialized = true;
    }
    
    try {
      let favorites: string | null = null;
      
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        // Web environment
        favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      } else {
        // Native environment
        favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      }
      
      const parsed = favorites ? JSON.parse(favorites) : [];
      const filtered = parsed.filter((item: any) => item && item.contentId && item.title);
      console.log('Retrieved favorites from storage:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async addToFavorites(item: Omit<FavoriteItem, 'id' | 'addedAt'>): Promise<void> {
    // Validate input data more thoroughly
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid item data: item is required');
    }

    const contentId = String(item.contentId || '').trim();
    const title = String(item.title || '').trim();
    
    if (!contentId || !title || contentId === 'undefined' || title === 'undefined') {
      throw new Error('Invalid item data: contentId and title are required and must be valid');
    }

    if (!item.contentType || !['movie', 'tv'].includes(item.contentType)) {
      throw new Error('Invalid item data: contentType must be "movie" or "tv"');
    }

    try {
      const favorites = await this.getFavorites();
      const existingIndex = favorites.findIndex(fav => String(fav.contentId) === contentId);

      if (existingIndex === -1) {
        const newFavorite: FavoriteItem = {
          id: `fav_${contentId}_${Date.now()}`,
          contentId,
          title,
          posterPath: String(item.posterPath || ''),
          contentType: item.contentType,
          addedAt: new Date().toISOString()
        };
        
        const updatedFavorites = [newFavorite, ...favorites];
        
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          // Web environment
          localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
          // Verify the item was saved
          const verifyFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        } else {
          // Native environment
          await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
          // Verify the item was saved
          const verifyFavorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
        }
        const verifyParsed = verifyFavorites ? JSON.parse(verifyFavorites) : [];
        const wasAdded = verifyParsed.some((fav: any) => String(fav.contentId) === contentId);
        
        if (wasAdded) {
          console.log('Successfully added to favorites and verified:', newFavorite.title);
        } else {
          throw new Error('Failed to verify favorite was saved');
        }
      } else {
        console.log('Item already in favorites:', title);
      }
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      throw new Error(`Failed to add to favorites: ${error.message}`);
    }
  }

  async removeFromFavorites(contentId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter(fav => String(fav.contentId) !== String(contentId));
      
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
      
      console.log('Removed from favorites, contentId:', contentId);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error(`Failed to remove from favorites: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isFavorite(contentId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const result = favorites.some(fav => String(fav.contentId) === String(contentId));
      console.log(`Checking if ${contentId} is favorite:`, result);
      return result;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // Watchlist API
  async getWatchlist(): Promise<WatchlistItem[]> {
    if (!this.storageInitialized) {
      await this.initializeStorage();
      this.storageInitialized = true;
    }
    
    return this.safeAsyncStorage(async () => {
      const watchlist = await AsyncStorage.getItem(STORAGE_KEYS.WATCHLIST);
      const parsed = watchlist ? JSON.parse(watchlist) : [];
      const filtered = parsed.filter((item: any) => item && item.contentId && item.title);
      console.log('Retrieved watchlist from storage:', filtered.length);
      return filtered;
    }, []);
  }

  async addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<void> {
    // Validate input data more thoroughly
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid item data: item is required');
    }

    const contentId = String(item.contentId || '').trim();
    const title = String(item.title || '').trim();
    
    if (!contentId || !title || contentId === 'undefined' || title === 'undefined') {
      throw new Error('Invalid item data: contentId and title are required and must be valid');
    }

    if (!item.contentType || !['movie', 'tv'].includes(item.contentType)) {
      throw new Error('Invalid item data: contentType must be "movie" or "tv"');
    }

    try {
      const watchlist = await this.getWatchlist();
      const existingIndex = watchlist.findIndex(watchItem => String(watchItem.contentId) === contentId);

      if (existingIndex === -1) {
        const newWatchItem: WatchlistItem = {
          id: `watch_${contentId}_${Date.now()}`,
          contentId,
          title,
          posterPath: String(item.posterPath || ''),
          contentType: item.contentType,
          addedAt: new Date().toISOString()
        };
        
        const updatedWatchlist = [newWatchItem, ...watchlist];
        
        await AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updatedWatchlist));
        
        console.log('Added to watchlist:', newWatchItem.title);
      } else {
        console.log('Item already in watchlist:', title);
      }
    } catch (error) {
      console.error('Error in addToWatchlist:', error);
      throw new Error(`Failed to add to watchlist: ${error.message}`);
    }
  }

  async removeFromWatchlist(contentId: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist();
      const filtered = watchlist.filter(watchItem => String(watchItem.contentId) !== String(contentId));
      
      await AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(filtered));
      
      console.log('Removed from watchlist, contentId:', contentId);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw new Error(`Failed to remove from watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isInWatchlist(contentId: string): Promise<boolean> {
    try {
      const watchlist = await this.getWatchlist();
      const result = watchlist.some(watchItem => String(watchItem.contentId) === String(contentId));
      console.log(`Checking if ${contentId} is in watchlist:`, result);
      return result;
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      return false;
    }
  }

  // Ratings API
  async getRatings(): Promise<Rating[]> {
    return this.safeAsyncStorage(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.RATINGS);
      return stored ? JSON.parse(stored) : [];
    }, []);
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

      await this.safeAsyncStorage(async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
      }, undefined);
      
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
    return this.safeAsyncStorage(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
      return stored ? JSON.parse(stored) : [];
    }, []);
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
      
      await this.safeAsyncStorage(async () => {
        await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updatedReviews));
      }, undefined);
      
      return true;
    } catch (error) {
      console.error('Error adding review:', error);
      return false;
    }
  }

  // Saved Items API
  async getSaved(): Promise<SavedItem[]> {
    if (!this.storageInitialized) {
      await this.initializeStorage();
      this.storageInitialized = true;
    }
    
    return this.safeAsyncStorage(async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.SAVED);
      const parsed = saved ? JSON.parse(saved) : [];
      const filtered = parsed.filter((item: any) => item && item.contentId && item.title);
      console.log('Retrieved saved items from storage:', filtered.length);
      return filtered;
    }, []);
  }

  async addToSaved(item: Omit<SavedItem, 'id' | 'addedAt'>): Promise<void> {
    // Validate input data more thoroughly
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid item data: item is required');
    }

    const contentId = String(item.contentId || '').trim();
    const title = String(item.title || '').trim();
    
    if (!contentId || !title || contentId === 'undefined' || title === 'undefined') {
      throw new Error('Invalid item data: contentId and title are required and must be valid');
    }

    if (!item.contentType || !['movie', 'tv'].includes(item.contentType)) {
      throw new Error('Invalid item data: contentType must be "movie" or "tv"');
    }

    try {
      const saved = await this.getSaved();
      const existingIndex = saved.findIndex(savedItem => String(savedItem.contentId) === contentId);

      if (existingIndex === -1) {
        const newSaved: SavedItem = {
          id: `saved_${contentId}_${Date.now()}`,
          contentId,
          title,
          posterPath: String(item.posterPath || ''),
          contentType: item.contentType,
          addedAt: new Date().toISOString()
        };
        
        const updatedSaved = [newSaved, ...saved];
        
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(updatedSaved));
        
        console.log('Added to saved:', newSaved.title);
      } else {
        console.log('Item already in saved:', title);
      }
    } catch (error) {
      console.error('Error in addToSaved:', error);
      throw new Error(`Failed to add to saved: ${error.message}`);
    }
  }

  async removeFromSaved(contentId: string): Promise<void> {
    try {
      const saved = await this.getSaved();
      const filtered = saved.filter(savedItem => String(savedItem.contentId) !== String(contentId));
      
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(filtered));
      
      console.log('Removed from saved, contentId:', contentId);
    } catch (error) {
      console.error('Error removing from saved:', error);
      throw new Error(`Failed to remove from saved: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isSaved(contentId: string): Promise<boolean> {
    try {
      const saved = await this.getSaved();
      const result = saved.some(savedItem => String(savedItem.contentId) === String(contentId));
      console.log(`Checking if ${contentId} is saved:`, result);
      return result;
    } catch (error) {
      console.error('Error checking saved status:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
