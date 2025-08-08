
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { userService, FavoriteItem } from '@/services/userService';
import { tmdbService } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const userFavorites = userService.getFavorites();
      setFavorites(userFavorites);
    } catch (error) {
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (item: FavoriteItem) => {
    router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`);
  };

  const handleRemove = (item: FavoriteItem) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${item.title}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            userService.removeFromFavorites(item.contentId, item.contentType);
            loadFavorites();
          }
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
    <View style={styles.favoriteItem}>
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
        <Ionicons name="trash-outline" size={20} color="#E50914" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>My Favorites</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#666" />
          <ThemedText style={styles.emptyText}>No favorites yet</ThemedText>
          <ThemedText style={styles.emptySubText}>
            Start adding movies and shows to your favorites!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
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
  favoriteItem: {
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
