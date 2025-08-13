
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { tmdbService, TMDbMovie } from '@/services/tmdbApi';
import { TMDbContentCard } from './TMDbContentCard';
import { Category } from './CategorySlider';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface CategoryMovieListProps {
  category: Category | null;
  onMoviePress: (movie: TMDbMovie) => void;
}

export function CategoryMovieList({ category, onMoviePress }: CategoryMovieListProps) {
  const [movies, setMovies] = useState<TMDbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (category) {
      fetchMoviesByCategory(category);
    }
  }, [category]);

  const fetchMoviesByCategory = async (selectedCategory: Category) => {
    try {
      setLoading(true);
      setMovies([]);
      
      let response;
      
      if (selectedCategory.country) {
        // For Hollywood
        response = await tmdbService.getRegionalContent(selectedCategory.country, 'movie', 1);
      } else if (selectedCategory.language) {
        // For language-based categories
        const filters = {
          with_original_language: selectedCategory.language,
          sort_by: 'popularity.desc',
          page: 1
        };
        response = await tmdbService.advancedMovieSearch(filters);
      } else {
        response = [];
      }

      setMovies(response.slice(0, 20)); // Limit to 20 movies
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error fetching movies by category:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const renderSkeletonItem = () => (
    <View style={[styles.skeletonCard, { width: cardWidth }]}>
      <View style={styles.skeletonPoster} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonRating} />
    </View>
  );

  const renderMovieItem = ({ item }: { item: TMDbMovie }) => (
    <TMDbContentCard
      content={item}
      type="movie"
      onPress={() => onMoviePress(item)}
      style={[styles.movieCard, { width: cardWidth }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemSeparator: {
    height: 16,
  },
  movieCard: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  // Skeleton styles
  skeletonCard: {
    marginBottom: 16,
  },
  skeletonPoster: {
    width: '100%',
    height: cardWidth * 1.5,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonRating: {
    width: '50%',
    height: 12,
    backgroundColor: '#333',
    borderRadius: 4,
  },
});
