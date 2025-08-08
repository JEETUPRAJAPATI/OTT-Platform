
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { userService, WatchlistItem } from '@/services/userService';
import { tmdbService } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

export default function WatchlistScreen() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const userWatchlist = userService.getWatchlist();
      setWatchlist(userWatchlist);
    } catch (error) {
      Alert.alert('Error', 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (item: WatchlistItem) => {
    router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`);
  };

  const handleRemove = (item: WatchlistItem) => {
    Alert.alert(
      'Remove from Watchlist',
      `Remove "${item.title}" from watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            userService.removeFromWatchlist(item.contentId, item.contentType);
            loadWatchlist();
          }
        }
      ]
    );
  };

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => (
    <View style={styles.watchlistItem}>
      <TouchableOpacity 
        style={styles.contentContainer}
        onPress={() => handleContentPress(item)}
      >
        <TMDbContentCard
          content={{
            id: item.contentId,
            poster_path: item.posterPath,
            title: item.title,
            name: item.title,
            vote_average: 0,
            release_date: '',
            first_air_date: '',
          } as any}
          type={item.contentType}
          onPress={() => handleContentPress(item)}
          style={styles.card}
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemove(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#4ECDC4" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>My Watchlist</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {watchlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#666" />
          <ThemedText style={styles.emptyText}>No items in watchlist</ThemedText>
          <ThemedText style={styles.emptySubText}>
            Add movies and shows you want to watch later!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  emptySubText: {
    fontSize: 16,
    opacity: 0.7,
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
  contentContainer: {
    flex: 1,
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
});
