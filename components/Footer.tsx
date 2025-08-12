
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService, FavoriteItem, WatchlistItem, Review } from '@/services/apiService';
import { TMDbContentCard } from './TMDbContentCard';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMDQwNWI5ZjEzODNlMTE4ZjljZmE4NmQ3Yjc0ZTJiOSIsIm5iZiI6MTc1NDU1NTAwNy4xNjQsInN1YiI6IjY4OTQ2MjdmMzQ4MDE5NWFhNDY2ZTZmNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gH2CFYya3S8QwYBUFhuEKcP4JWoMPnAeaRPDAE03Rik';
const ACCOUNT_ID = '22206352';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface FooterProps {
  currentRoute?: string;
}

export function Footer({ currentRoute }: FooterProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSettingsTab, setSelectedSettingsTab] = useState<'favorites' | 'watchlist' | 'about' | 'privacy' | 'ratings' | 'reviews'>('favorites');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    contentId: '',
    title: '',
    review: '',
    rating: 0,
  });

  const loadRatedMovies = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/account/${ACCOUNT_ID}/rated/movies?language=en-US&sort_by=created_at.desc&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${API_READ_ACCESS_TOKEN}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRatedMovies(data.results || []);
      }
    } catch (error) {
      console.error('Error loading rated movies:', error);
    }
  };

  const loadData = async () => {
    try {
      const [favoritesData, watchlistData, reviewsData] = await Promise.all([
        apiService.getFavorites(),
        apiService.getWatchlist(),
        apiService.getReviews(),
        loadRatedMovies(),
      ]);

      setFavorites(favoritesData);
      setWatchlist(watchlistData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const openSettings = () => {
    setShowSettings(true);
    loadData();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSettings = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSettings(false);
    });
  };

  const removeFromFavorites = async (contentId: string) => {
    try {
      await apiService.removeFromFavorites(contentId);
      setFavorites(prev => prev.filter(item => item.contentId !== contentId));
      Alert.alert('Success', 'Removed from favorites');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  const removeFromWatchlist = async (contentId: string) => {
    try {
      await apiService.removeFromWatchlist(contentId);
      setWatchlist(prev => prev.filter(item => item.contentId !== contentId));
      Alert.alert('Success', 'Removed from watchlist');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from watchlist');
    }
  };

  const submitReview = async () => {
    if (!reviewForm.title || !reviewForm.review || reviewForm.rating === 0) {
      Alert.alert('Error', 'Please fill all fields and provide a rating');
      return;
    }

    try {
      await apiService.addReview(
        reviewForm.contentId || 'sample-content',
        reviewForm.title,
        reviewForm.review,
        reviewForm.rating,
        'movie'
      );

      setReviewForm({ contentId: '', title: '', review: '', rating: 0 });
      loadData();
      Alert.alert('Success', 'Review submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const renderStars = (rating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={24}
              color={star <= rating ? '#FFD700' : '#666'}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFavorites = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>My Favorites ({favorites.length})</Text>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubText}>Add movies and shows to your favorites</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromFavorites(item.contentId)}
              >
                <Ionicons name="close-circle" size={24} color="#E50914" />
              </TouchableOpacity>
              <TMDbContentCard
                content={{
                  id: parseInt(item.contentId),
                  title: item.title,
                  poster_path: item.posterPath,
                  vote_average: 0,
                  overview: '',
                  release_date: '',
                  first_air_date: '',
                  genre_ids: [],
                  original_language: '',
                  popularity: 0,
                  backdrop_path: ''
                }}
                onPress={() => router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`)}
                style={styles.card}
              />
            </View>
          )}
        />
      )}
    </View>
  );

  const renderWatchlist = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>My Watchlist ({watchlist.length})</Text>
      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No items in watchlist</Text>
          <Text style={styles.emptySubText}>Add movies and shows to watch later</Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWatchlist(item.contentId)}
              >
                <Ionicons name="close-circle" size={24} color="#E50914" />
              </TouchableOpacity>
              <TMDbContentCard
                content={{
                  id: parseInt(item.contentId),
                  title: item.title,
                  poster_path: item.posterPath,
                  vote_average: 0,
                  overview: '',
                  release_date: '',
                  first_air_date: '',
                  genre_ids: [],
                  original_language: '',
                  popularity: 0,
                  backdrop_path: ''
                }}
                onPress={() => router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`)}
                style={styles.card}
              />
            </View>
          )}
        />
      )}
    </View>
  );

  const renderReviews = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Reviews & Ratings</Text>

      {/* Add Review Form */}
      <View style={styles.reviewForm}>
        <Text style={styles.formTitle}>Write a Review</Text>

        <TextInput
          style={styles.input}
          placeholder="Movie/Show Title"
          placeholderTextColor="#666"
          value={reviewForm.title}
          onChangeText={(text) => setReviewForm(prev => ({ ...prev, title: text }))}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your review..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          value={reviewForm.review}
          onChangeText={(text) => setReviewForm(prev => ({ ...prev, review: text }))}
        />

        <Text style={styles.ratingLabel}>Your Rating:</Text>
        {renderStars(reviewForm.rating, (rating) => setReviewForm(prev => ({ ...prev, rating })))}

        <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>{item.title}</Text>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.reviewText}>{item.review}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </View>
  );

  const renderAbout = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>About RK SWOT</Text>
      <View style={styles.aboutContent}>
        <Text style={styles.aboutText}>
          RK SWOT is your ultimate movie and TV show streaming companion. Discover, watch, and organize your favorite content all in one place.
        </Text>
        <Text style={styles.aboutText}>
          Features:
          • Extensive movie and TV show database
          • Personal favorites and watchlist
          • Ratings and reviews
          • Discover trending content
          • Search across all platforms
        </Text>
        <Text style={styles.aboutText}>
          Version: 1.0.0
        </Text>
      </View>
    </View>
  );

  const renderRatings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>My Ratings ({ratedMovies.length})</Text>
      {ratedMovies.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No Ratings Yet</Text>
          <Text style={styles.emptySubText}>Rate movies to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={ratedMovies}
          keyExtractor={(item) => `rated-${item.id}`}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <TMDbContentCard
                content={item}
                type="movie"
                onPress={() => router.push(`/tmdb-content/${item.id}?type=movie`)}
                style={styles.card}
              />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating || item.vote_average}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Privacy Policy</Text>
      <ScrollView style={styles.privacyContent}>
        <Text style={styles.privacyText}>
          <Text style={styles.privacyHeader}>Data Collection</Text>
          {'\n\n'}
          We collect minimal data necessary to provide our services. This includes your viewing preferences, ratings, and reviews.
          {'\n\n'}
          <Text style={styles.privacyHeader}>Data Usage</Text>
          {'\n\n'}
          Your data is used solely to enhance your experience and provide personalized recommendations.
          {'\n\n'}
          <Text style={styles.privacyHeader}>Data Security</Text>
          {'\n\n'}
          We implement industry-standard security measures to protect your personal information.
          {'\n\n'}
          <Text style={styles.privacyHeader}>Contact</Text>
          {'\n\n'}
          For privacy concerns, contact us at privacy@rkswot.com
        </Text>
      </ScrollView>
    </View>
  );

  const renderSettingsContent = () => {
    switch (selectedSettingsTab) {
      case 'favorites':
        return renderFavorites();
      case 'watchlist':
        return renderWatchlist();
      case 'ratings':
        return renderRatings();
      case 'reviews':
        return renderReviews();
      case 'about':
        return renderAbout();
      case 'privacy':
        return renderPrivacy();
      default:
        return renderFavorites();
    }
  };

  const settingsTabs = [
    { key: 'favorites', label: 'Favorites', icon: 'heart', count: favorites.length },
    { key: 'watchlist', label: 'Watchlist', icon: 'bookmark', count: watchlist.length },
    { key: 'ratings', label: 'Ratings', icon: 'star-half', count: ratedMovies.length },
    { key: 'reviews', label: 'Reviews', icon: 'star', count: reviews.length },
    { key: 'about', label: 'About', icon: 'information-circle' },
    { key: 'privacy', label: 'Privacy', icon: 'shield-checkmark' },
  ];

  return (
    <>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, currentRoute === '/' && styles.activeButton]}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={22} color={currentRoute === '/' ? '#E50914' : '#666'} />
          <Text style={[styles.footerText, currentRoute === '/' && styles.activeText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, currentRoute === '/movies' && styles.activeButton]}
          onPress={() => router.push('/movies')}
        >
          <Ionicons name="film" size={22} color={currentRoute === '/movies' ? '#E50914' : '#666'} />
          <Text style={[styles.footerText, currentRoute === '/movies' && styles.activeText]}>Movies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, currentRoute === '/discover' && styles.activeButton]}
          onPress={() => router.push('/discover')}
        >
          <Ionicons name="compass" size={22} color={currentRoute === '/discover' ? '#E50914' : '#666'} />
          <Text style={[styles.footerText, currentRoute === '/discover' && styles.activeText]}>Discover</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, currentRoute === '/search' && styles.activeButton]}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={22} color={currentRoute === '/search' ? '#E50914' : '#666'} />
          <Text style={[styles.footerText, currentRoute === '/search' && styles.activeText]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={openSettings}>
          <Ionicons name="settings" size={22} color="#666" />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="none"
        onRequestClose={closeSettings}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.settingsModal,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <SafeAreaView style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={closeSettings} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Horizontal Tabs */}
              <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalTabs}>
                  {settingsTabs.map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.horizontalTab,
                        selectedSettingsTab === tab.key && styles.activeHorizontalTab
                      ]}
                      onPress={() => setSelectedSettingsTab(tab.key as any)}
                    >
                      <Ionicons 
                        name={tab.icon as any} 
                        size={20} 
                        color={selectedSettingsTab === tab.key ? '#E50914' : '#666'} 
                      />
                      <Text style={[
                        styles.horizontalTabText,
                        selectedSettingsTab === tab.key && styles.activeHorizontalTabText
                      ]}>
                        {tab.label}
                      </Text>
                      {tab.count !== undefined && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{tab.count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Content Area */}
              <View style={styles.fullContentArea}>
                {renderSettingsContent()}
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#222',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeButton: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  footerText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeText: {
    color: '#E50914',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#000',
    height: screenHeight * 0.9,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  horizontalTabs: {
    paddingVertical: 10,
  },
  horizontalTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 25,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 100,
  },
  activeHorizontalTab: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderColor: '#E50914',
  },
  horizontalTabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeHorizontalTabText: {
    color: '#E50914',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#E50914',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    marginLeft: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fullContentArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  gridItem: {
    flex: 1,
    margin: 8,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
  },
  card: {
    width: '100%',
  },
  reviewForm: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#E50914',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewItem: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  reviewText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  aboutContent: {
    flex: 1,
  },
  aboutText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 16,
  },
  privacyContent: {
    flex: 1,
  },
  privacyText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  privacyHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
