export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  language: string;
  region: string;
  favoriteGenres: number[];
  parentalControl: boolean;
  autoplay: boolean;
  subtitles: boolean;
  quality: 'auto' | 'low' | 'medium' | 'high' | '4k';
}

export interface WatchlistItem {
  id: string;
  userId: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  addedAt: Date;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  addedAt: Date;
}

export interface Rating {
  id: string;
  userId: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  rating: number; // 1-10
  review?: string;
  createdAt: Date;
}

export interface ViewingHistory {
  id: string;
  userId: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  watchedAt: Date;
  progress?: number; // 0-100 percentage
  episodeId?: number; // for TV shows
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface ContinueWatching {
  id: string;
  userId: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  progress: number; // 0-100 percentage
  lastWatched: Date;
  episodeId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

class UserService {
  private currentUser: User | null = null;
  private watchlist: WatchlistItem[] = [];
  private favorites: FavoriteItem[] = [];
  private ratings: Rating[] = [];
  private viewingHistory: ViewingHistory[] = [];
  private continueWatching: ContinueWatching[] = [];

  // Initialize with demo data
  constructor() {
    this.initializeDemoData();
    this.loadFromStorage().catch(error => console.error('Failed to load initial data:', error));
  }

  private initializeDemoData() {
    this.currentUser = {
      id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@rkswot.com',
      avatar: 'https://via.placeholder.com/100x100/E50914/white?text=RK',
      preferences: {
        language: 'en',
        region: 'IN',
        favoriteGenres: [28, 35, 18, 53], // Action, Comedy, Drama, Thriller
        parentalControl: false,
        autoplay: true,
        subtitles: true,
        quality: 'auto'
      },
      createdAt: new Date()
    };
  }

  // User methods
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    if (this.currentUser) {
      this.currentUser.preferences = { ...this.currentUser.preferences, ...preferences };
      this.saveToStorage().catch(error => console.error('Failed to save preferences:', error));
    }
  }

  // Watchlist methods
  getWatchlist(): WatchlistItem[] {
    return this.watchlist;
  }

  addToWatchlist(contentId: number, contentType: 'movie' | 'tv', title: string, posterPath: string): void {
    if (!this.currentUser) return;

    const existingItem = this.watchlist.find(
      item => item.contentId === contentId && item.contentType === contentType
    );

    if (!existingItem) {
      const item: WatchlistItem = {
        id: `watchlist-${Date.now()}`,
        userId: this.currentUser.id,
        contentId,
        contentType,
        title,
        posterPath,
        addedAt: new Date()
      };
      this.watchlist.unshift(item);
      this.saveToStorage().catch(error => console.error('Failed to save watchlist:', error));
    }
  }

  removeFromWatchlist(contentId: number, contentType: 'movie' | 'tv'): void {
    this.watchlist = this.watchlist.filter(
      item => !(item.contentId === contentId && item.contentType === contentType)
    );
    this.saveToStorage().catch(error => console.error('Failed to save watchlist:', error));
  }

  isInWatchlist(contentId: number, contentType: 'movie' | 'tv'): boolean {
    return this.watchlist.some(
      item => item.contentId === contentId && item.contentType === contentType
    );
  }

  // Favorites methods
  getFavorites(): FavoriteItem[] {
    return this.favorites;
  }

  addToFavorites(contentId: number, contentType: 'movie' | 'tv', title: string, posterPath: string): void {
    if (!this.currentUser) return;

    const existingItem = this.favorites.find(
      item => item.contentId === contentId && item.contentType === contentType
    );

    if (!existingItem) {
      const item: FavoriteItem = {
        id: `favorite-${Date.now()}`,
        userId: this.currentUser.id,
        contentId,
        contentType,
        title,
        posterPath,
        addedAt: new Date()
      };
      this.favorites.unshift(item);
      this.saveToStorage().catch(error => console.error('Failed to save favorites:', error));
    }
  }

  removeFromFavorites(contentId: number, contentType: 'movie' | 'tv'): void {
    this.favorites = this.favorites.filter(
      item => !(item.contentId === contentId && item.contentType === contentType)
    );
    this.saveToStorage().catch(error => console.error('Failed to save favorites:', error));
  }

  isFavorite(contentId: number, contentType: 'movie' | 'tv'): boolean {
    return this.favorites.some(
      item => item.contentId === contentId && item.contentType === contentType
    );
  }

  // Rating methods
  getRatings(): Rating[] {
    return this.ratings;
  }

  addRating(contentId: number, contentType: 'movie' | 'tv', rating: number, review?: string): void {
    if (!this.currentUser) return;

    // Remove existing rating if any
    this.ratings = this.ratings.filter(
      item => !(item.contentId === contentId && item.contentType === contentType)
    );

    const ratingItem: Rating = {
      id: `rating-${Date.now()}`,
      userId: this.currentUser.id,
      contentId,
      contentType,
      rating,
      review,
      createdAt: new Date()
    };
    this.ratings.unshift(ratingItem);
    this.saveToStorage().catch(error => console.error('Failed to save ratings:', error));
  }

  getUserRating(contentId: number, contentType: 'movie' | 'tv'): Rating | undefined {
    return this.ratings.find(
      item => item.contentId === contentId && item.contentType === contentType
    );
  }

  // Viewing history methods
  getViewingHistory(): ViewingHistory[] {
    return this.viewingHistory.slice(0, 50); // Limit to recent 50 items
  }

  addToHistory(
    contentId: number,
    contentType: 'movie' | 'tv',
    title: string,
    posterPath: string,
    progress?: number,
    episodeId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): void {
    if (!this.currentUser) return;

    // Remove existing entry if any
    this.viewingHistory = this.viewingHistory.filter(
      item => !(item.contentId === contentId && item.contentType === contentType)
    );

    const historyItem: ViewingHistory = {
      id: `history-${Date.now()}`,
      userId: this.currentUser.id,
      contentId,
      contentType,
      title,
      posterPath,
      watchedAt: new Date(),
      progress,
      episodeId,
      seasonNumber,
      episodeNumber
    };
    this.viewingHistory.unshift(historyItem);

    // Keep only recent 100 items
    this.viewingHistory = this.viewingHistory.slice(0, 100);
    this.saveToStorage().catch(error => console.error('Failed to save history:', error));
  }

  // Continue watching methods
  getContinueWatching(): ContinueWatching[] {
    return this.continueWatching;
  }

  updateContinueWatching(
    contentId: number,
    contentType: 'movie' | 'tv',
    title: string,
    posterPath: string,
    progress: number,
    episodeId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): void {
    if (!this.currentUser) return;

    // Remove existing entry if any
    this.continueWatching = this.continueWatching.filter(
      item => !(item.contentId === contentId && item.contentType === contentType)
    );

    // Only add if progress is between 5% and 95%
    if (progress >= 5 && progress <= 95) {
      const continueItem: ContinueWatching = {
        id: `continue-${Date.now()}`,
        userId: this.currentUser.id,
        contentId,
        contentType,
        title,
        posterPath,
        progress,
        lastWatched: new Date(),
        episodeId,
        seasonNumber,
        episodeNumber
      };
      this.continueWatching.unshift(continueItem);

      // Keep only recent 20 items
      this.continueWatching = this.continueWatching.slice(0, 20);
    }

    this.saveToStorage().catch(error => console.error('Failed to save continue watching:', error));
  }

  removeContinueWatching(contentId: number, contentType: 'movie' | 'tv'): void {
    this.continueWatching = this.continueWatching.filter(
      item => !(item.contentId === contentId && item.contentType === contentType)
    );
    this.saveToStorage().catch(error => console.error('Failed to save continue watching:', error));
  }

  // Storage methods
  private async saveToStorage(): Promise<void> {
    try {
      const userData = {
        user: this.currentUser,
        watchlist: this.watchlist,
        favorites: this.favorites,
        ratings: this.ratings,
        viewingHistory: this.viewingHistory,
        continueWatching: this.continueWatching
      };

      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        // Web environment - use localStorage
        localStorage.setItem('rkswot-user-data', JSON.stringify(userData));
        console.log('User data saved to localStorage');
      } else {
        // Native environment - use AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('rkswot-user-data', JSON.stringify(userData));
        console.log('User data saved to AsyncStorage');
      }
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  async loadFromStorage(): Promise<void> {
    try {
      let stored: string | null = null;

      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        // Web environment - use localStorage
        stored = localStorage.getItem('rkswot-user-data');
      } else {
        // Native environment - use AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        stored = await AsyncStorage.getItem('rkswot-user-data');
      }

      if (stored) {
        const userData = JSON.parse(stored);
        this.currentUser = userData.user || this.currentUser;
        this.watchlist = userData.watchlist || [];
        this.favorites = userData.favorites || [];
        this.ratings = userData.ratings || [];
        this.viewingHistory = userData.viewingHistory || [];
        this.continueWatching = userData.continueWatching || [];
        console.log('User data loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  // Recommendation methods
  getRecommendedGenres(): number[] {
    if (!this.currentUser) return [];
    return this.currentUser.preferences.favoriteGenres;
  }

  // Clear all user data
  clearAllData(): void {
    this.watchlist = [];
    this.favorites = [];
    this.ratings = [];
    this.viewingHistory = [];
    this.continueWatching = [];
    this.saveToStorage().catch(error => console.error('Failed to clear data:', error));
  }
}

export const userService = new UserService();