
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { userService } from '@/services/userService';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMDQwNWI5ZjEzODNlMTE4ZjljZmE4NmQ3Yjc0ZTJiOSIsIm5iZiI6MTc1NDU1NTAwNy4xNjQsInN1YiI6IjY4OTQ2MjdmMzQ4MDE5NWFhNDY2ZTZmNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gH2CFYya3S8QwYBUFhuEKcP4JWoMPnAeaRPDAE03Rik';
const ACCOUNT_ID = '22206352';

export default function MoviesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'favorites' | 'watchlist'>('favorites');

  useEffect(() => {
    loadUserContent();
  }, []);

  const loadUserContent = async () => {
    try {
      await Promise.all([
        loadFavorites(),
        loadWatchlist()
      ]);
    } catch (error) {
      console.error('Error loading user content:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/account/${ACCOUNT_ID}/favorite/movies?language=en-US&sort_by=created_at.desc&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${API_READ_ACCESS_TOKEN}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.results || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadWatchlist = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/account/${ACCOUNT_ID}/watchlist/movies?language=en-US&sort_by=created_at.desc&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${API_READ_ACCESS_TOKEN}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.results || []);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserContent();
    setRefreshing(false);
  };

  const handleContentPress = (content: any) => {
    router.push(`/tmdb-content/${content.id}?type=movie`);
  };

  const removeFromFavorites = async (movieId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/account/${ACCOUNT_ID}/favorite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_READ_ACCESS_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            media_type: 'movie',
            media_id: movieId,
            favorite: false
          })
        }
      );
      
      if (response.ok) {
        await loadFavorites();
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const removeFromWatchlist = async (movieId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/account/${ACCOUNT_ID}/watchlist`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_READ_ACCESS_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            media_type: 'movie',
            media_id: movieId,
            watchlist: false
          })
        }
      );
      
      if (response.ok) {
        await loadWatchlist();
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const renderMovieItem = ({ item }: { item: any }) => (
    <View style={styles.movieItem}>
      <TMDbContentCard
        content={item}
        type="movie"
        onPress={() => handleContentPress(item)}
        style={styles.movieCard}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => selectedTab === 'favorites' ? removeFromFavorites(item.id) : removeFromWatchlist(item.id)}
      >
        <Ionicons name="close-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = (type: 'favorites' | 'watchlist') => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'favorites' ? 'heart-outline' : 'bookmark-outline'} 
        size={80} 
        color="#333" 
      />
      <Text style={styles.emptyTitle}>
        No {type === 'favorites' ? 'Favorites' : 'Watchlist Items'} Yet
      </Text>
      <Text style={styles.emptyDescription}>
        {type === 'favorites' 
          ? 'Add movies to your favorites to see them here' 
          : 'Add movies to your watchlist to see them here'}
      </Text>
    </View>
  );

  const currentData = selectedTab === 'favorites' ? favorites : watchlist;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Movies</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
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
          renderItem={renderMovieItem}
          keyExtractor={(item) => `${selectedTab}-${item.id}`}
          numColumns={2}
          contentContainerStyle={styles.moviesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#222',
    gap: 8,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
    lineHeight: 24,
  },
  moviesList: {
    padding: 20,
  },
  movieItem: {
    flex: 1,
    margin: 8,
    position: 'relative',
  },
  movieCard: {
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    padding: 4,
    zIndex: 10,
  },
});
