import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { apiService, FavoriteItem, WatchlistItem } from '@/services/apiService';
import { Footer } from '@/components/Footer';

export default function HomeScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderContentItem = ({ item }: { item: FavoriteItem | WatchlistItem }) => (
    <View style={styles.contentItem}>
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
    </View>
  );

  const renderSection = (title: string, data: any[], emptyMessage: string, emptyIcon: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <Text style={styles.itemCount}>({data.length})</Text>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name={emptyIcon as any} size={48} color="#666" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={data.slice(0, 6)} // Show only first 6 items
          renderItem={renderContentItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>RK SWOT</ThemedText>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeTitle}>Welcome back!</ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            Your personal movie and TV show collection
          </ThemedText>
        </View>

        {/* Movies Section */}
        <View style={styles.moviesContainer}>
          <ThemedText style={styles.moviesTitle}>My Movies & Shows</ThemedText>

          {renderSection(
            'Favorites',
            favorites,
            'No favorites yet. Start adding movies and shows you love!',
            'heart-outline'
          )}

          {renderSection(
            'Watchlist',
            watchlist,
            'No items in watchlist. Add movies and shows to watch later!',
            'bookmark-outline'
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/discover')}
          >
            <Ionicons name="compass" size={24} color="#E50914" />
            <Text style={styles.actionButtonText}>Discover New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={24} color="#E50914" />
            <Text style={styles.actionButtonText}>Search Content</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Footer currentRoute="/" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E50914',
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  moviesContainer: {
    paddingHorizontal: 20,
  },
  moviesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  itemCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  horizontalList: {
    paddingVertical: 8,
  },
  contentItem: {
    marginRight: 12,
    width: 120,
  },
  card: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});