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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { apiService, FavoriteItem, WatchlistItem } from '@/services/apiService';
import { MovieDownloader } from '@/components/MovieDownloader';
import { MoviePlatformBrowser } from '@/components/MoviePlatformBrowser';

type TabType = 'favorites' | 'watchlist';

export default function MoviesScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<TabType>('favorites');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [platformBrowserVisible, setPlatformBrowserVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [favoritesData, watchlistData] = await Promise.all([
        apiService.getFavorites(),
        apiService.getWatchlist(),
      ]);

      setFavorites(favoritesData);
      setWatchlist(watchlistData);
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

  const handleContentPress = (item: FavoriteItem | WatchlistItem) => {
    router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`);
  };

  const removeFromFavorites = async (contentId: string) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this item from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeFromFavorites(contentId);
              setFavorites(prev => prev.filter(item => item.contentId !== contentId));
              Alert.alert('Success', 'Removed from favorites');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const removeFromWatchlist = async (contentId: string) => {
    Alert.alert(
      'Remove from Watchlist',
      'Are you sure you want to remove this item from your watchlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeFromWatchlist(contentId);
              setWatchlist(prev => prev.filter(item => item.contentId !== contentId));
              Alert.alert('Success', 'Removed from watchlist');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove from watchlist');
            }
          },
        },
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
    <View style={styles.favoriteItem}>
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
        onPress={() => handleContentPress(item)}
        style={styles.card}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromFavorites(item.contentId)}
      >
        <Ionicons name="heart" size={20} color="#E50914" />
      </TouchableOpacity>
    </View>
  );

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => (
    <View style={styles.favoriteItem}>
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
        onPress={() => handleContentPress(item)}
        style={styles.card}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromWatchlist(item.contentId)}
      >
        <Ionicons name="bookmark" size={20} color="#E50914" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = (type: TabType) => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={type === 'favorites' ? 'heart-outline' : 'bookmark-outline'} 
        size={80} 
        color="#333" 
      />
      <ThemedText style={styles.emptyText}>
        {type === 'favorites' ? 'No Favorites Yet' : 'No Items in Watchlist'}
      </ThemedText>
      <ThemedText style={styles.emptySubText}>
        {type === 'favorites' 
          ? 'Add movies and shows to your favorites by tapping the heart icon'
          : 'Add movies and shows to your watchlist by tapping the bookmark icon'
        }
      </ThemedText>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/discover')}
      >
        <Text style={styles.exploreButtonText}>Explore Content</Text>
      </TouchableOpacity>
    </View>
  );

  const currentData = selectedTab === 'favorites' ? favorites : watchlist;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
      </View>

      {/* Content */}
      {currentData.length === 0 ? (
        renderEmptyState(selectedTab)
      ) : (
        <FlatList
          data={currentData}
          renderItem={selectedTab === 'favorites' ? renderFavoriteItem : renderWatchlistItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#E50914"
            />
          }
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#222',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
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
    padding: 20,
  },
  favoriteItem: {
    flex: 1,
    margin: 8,
    position: 'relative',
  },
  card: {
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
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
});