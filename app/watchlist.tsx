import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService, WatchlistItem } from '@/services/apiService';
import { TMDbContentCard } from '@/components/TMDbContentCard';

export default function WatchlistScreen() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const data = await apiService.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
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

  const handleContentPress = (item: WatchlistItem) => {
    router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Watchlist ({watchlist.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      {watchlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>No Items in Watchlist</Text>
          <Text style={styles.emptySubText}>Add movies and shows to watch later</Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          renderItem={({ item }) => (
            <View style={styles.watchlistItem}>
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
                onPress={() => handleContentPress(item)}
                style={styles.movieCard}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 16,
    opacity: 0.7,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  watchlistItem: {
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
  movieCard: {
    width: '100%',
  },
});