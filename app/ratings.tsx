
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TMDbContentCard } from '@/components/TMDbContentCard';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMDQwNWI5ZjEzODNlMTE4ZjljZmE4NmQ3Yjc0ZTJiOSIsIm5iZiI6MTc1NDU1NTAwNy4xNjQsInN1YiI6IjY4OTQ2MjdmMzQ4MDE5NWFhNDY2ZTZmNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gH2CFYya3S8QwYBUFhuEKcP4JWoMPnAeaRPDAE03Rik';
const ACCOUNT_ID = '22206352';

export default function RatingsScreen() {
  const router = useRouter();
  const [ratedMovies, setRatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatedMovies();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (content: any) => {
    router.push(`/tmdb-content/${content.id}?type=movie`);
  };

  const renderRatingItem = ({ item }: { item: any }) => (
    <View style={styles.ratingItem}>
      <TMDbContentCard
        content={item}
        type="movie"
        onPress={() => handleContentPress(item)}
        style={styles.movieCard}
      />
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>{item.rating || item.vote_average}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Ratings</Text>
        <View style={{ width: 24 }} />
      </View>

      {ratedMovies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>No Ratings Yet</Text>
          <Text style={styles.emptySubText}>Rate movies to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={ratedMovies}
          renderItem={renderRatingItem}
          keyExtractor={(item) => `rated-${item.id}`}
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
  ratingItem: {
    flex: 1,
    margin: 8,
    position: 'relative',
  },
  movieCard: {
    width: '100%',
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
