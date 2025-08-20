
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService, FavoriteItem } from '@/services/apiService';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { Stack } from 'expo-router';
export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await apiService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
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

  const handleContentPress = (item: FavoriteItem) => {
    router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`);
  };

  return (
      <>
              <Stack.Screen options={{ title: 'Reviews & Ratings', headerShown: false }} />
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Favorites ({favorites.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>No Favorites Yet</Text>
          <Text style={styles.emptySubText}>Add movies and shows to your favorites</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({ item }) => (
            <View style={styles.favoriteItem}>
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
    </>
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
  favoriteItem: {
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
