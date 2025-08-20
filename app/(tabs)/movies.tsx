import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Text,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { apiService, FavoriteItem, WatchlistItem, SavedItem } from '@/services/apiService';
import { MovieDownloader } from '@/components/MovieDownloader';
import { MoviePlatformBrowser } from '@/components/MoviePlatformBrowser';

type TabType = 'favorites' | 'watchlist' | 'saved';

export default function MoviesScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<TabType>('saved');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [platformBrowserVisible, setPlatformBrowserVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [favoritesData, watchlistData, savedData] = await Promise.all([
        apiService.getFavorites(),
        apiService.getWatchlist(),
        apiService.getSaved(),
      ]);

      setFavorites(favoritesData);
      setWatchlist(watchlistData);
      setSaved(savedData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleContentPress = (item: FavoriteItem | WatchlistItem | SavedItem | any) => {
    router.push(`/tmdb-content/${item.contentId || item.id}?type=${item.contentType || 'movie'}`);
  };

  const handleRemove = async (contentId: string, type: TabType) => {
    try {
      console.log(`Removing from ${type}:`, contentId);
      
      // Immediately update UI for better UX
      switch (type) {
        case 'favorites':
          setFavorites(prev => prev.filter(item => item.contentId !== contentId));
          await apiService.removeFromFavorites(contentId);
          break;
        case 'watchlist':
          setWatchlist(prev => prev.filter(item => item.contentId !== contentId));
          await apiService.removeFromWatchlist(contentId);
          break;
        case 'saved':
          setSaved(prev => prev.filter(item => item.contentId !== contentId));
          await apiService.removeFromSaved(contentId);
          break;
      }
      
      Alert.alert('✓ Removed', `Item removed from ${type}`);
    } catch (error) {
      console.error(`Error removing from ${type}:`, error);
      Alert.alert('Error', `Failed to remove from ${type}. Please try again.`);
      // Reload data to revert any UI changes
      await loadData();
    }
  };

  const renderItem = ({ item, index }: { item: FavoriteItem | WatchlistItem | SavedItem, index: number }) => (
    <View style={styles.gridItem}>
      <View style={styles.cardContainer}>
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
          type={item.contentType as 'movie' | 'tv'}
          onPress={() => handleContentPress(item)}
          style={styles.movieCard}
          showShareButton={false}
        />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.contentId, selectedTab)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = (type: TabType) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === 'favorites' ? 'heart-outline' : type === 'watchlist' ? 'bookmark-outline' : 'save-outline'}
        size={80}
        color="#333"
      />
      <ThemedText style={styles.emptyText}>
        {type === 'favorites' ? 'No Favorites Yet' : type === 'watchlist' ? 'No Items in Watchlist' : 'No Saved Items Yet'}
      </ThemedText>
      <ThemedText style={styles.emptySubText}>
        {type === 'favorites'
          ? 'Add movies and shows to your favorites by tapping the heart icon'
          : type === 'watchlist'
          ? 'Add movies and shows to your watchlist by tapping the bookmark icon'
          : 'Add movies and shows to your saved list by tapping the save icon'
        }
      </ThemedText>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.exploreButtonText}>Explore Content</Text>
      </TouchableOpacity>
    </View>
  );

  const getCurrentData = () => {
    switch (selectedTab) {
      case 'favorites':
        return favorites;
      case 'watchlist':
        return watchlist;
      case 'saved':
        return saved;
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>My Movies & Shows</ThemedText>
        <TouchableOpacity 
          style={styles.platformsButton}
          onPress={() => setPlatformBrowserVisible(true)}
        >
          <Ionicons name="globe" size={20} color="#fff" />
          <Text style={styles.platformsButtonText}>Free Platforms</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'favorites' && styles.activeTab]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Ionicons
            name={selectedTab === 'favorites' ? 'heart' : 'heart-outline'}
            size={20}
            color={selectedTab === 'favorites' ? '#fff' : '#999'}
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'favorites' && styles.activeTabText
          ]}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'watchlist' && styles.activeTab]}
          onPress={() => setSelectedTab('watchlist')}
        >
          <Ionicons
            name={selectedTab === 'watchlist' ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={selectedTab === 'watchlist' ? '#fff' : '#999'}
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'watchlist' && styles.activeTabText
          ]}>
            Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'saved' && styles.activeTab]}
          onPress={() => setSelectedTab('saved')}
        >
          <Ionicons
            name={selectedTab === 'saved' ? 'save' : 'save-outline'}
            size={20}
            color={selectedTab === 'saved' ? '#fff' : '#999'}
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'saved' && styles.activeTabText
          ]}>
            Saved ({saved.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {currentData.length === 0 ? (
        renderEmptyState(selectedTab)
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${selectedTab}-${item.contentId}-${index}`}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E50914"
              colors={['#E50914']}
              progressBackgroundColor="#1a1a1a"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <MovieDownloader
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        movieTitle={selectedMovie?.title || selectedMovie?.name || ''}
        contentId={selectedMovie?.id || 0}
        contentType="movie"
        posterPath={selectedMovie?.poster_path || ''}
      />

      <MoviePlatformBrowser
        visible={platformBrowserVisible}
        onClose={() => setPlatformBrowserVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  platformsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  platformsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#222',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E50914',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#fff',
  },
  emptySubText: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 10,
    textAlign: 'center',
    color: '#999',
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  cardContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 2/3,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  movieCard: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: '#E50914',
  },
  separator: {
    height: 0,
  },
});