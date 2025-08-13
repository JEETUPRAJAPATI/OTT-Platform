
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tmdbService, TMDbMovie } from '@/services/tmdbApi';
import { TMDbContentCard } from '@/components/TMDbContentCard';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface Category {
  id: string;
  name: string;
  language?: string;
  country?: string;
  gradient: string[];
  icon: string;
}

const categories: Category[] = [
  { id: 'hindi', name: 'Hindi', language: 'hi', gradient: ['#FF6B35', '#F7931E'], icon: '🇮🇳' },
  { id: 'south', name: 'South', language: 'te|ta|ml|kn', gradient: ['#667eea', '#764ba2'], icon: '🎭' },
  { id: 'hollywood', name: 'Hollywood', country: 'US', gradient: ['#f093fb', '#f5576c'], icon: '🎬' },
  { id: 'tamil', name: 'Tamil', language: 'ta', gradient: ['#4facfe', '#00f2fe'], icon: '🎪' },
  { id: 'telugu', name: 'Telugu', language: 'te', gradient: ['#43e97b', '#38f9d7'], icon: '🎨' },
  { id: 'malayalam', name: 'Malayalam', language: 'ml', gradient: ['#fa709a', '#fee140'], icon: '🌺' },
  { id: 'kannada', name: 'Kannada', language: 'kn', gradient: ['#a8edea', '#fed6e3'], icon: '🏛️' },
  { id: 'english', name: 'English', language: 'en', gradient: ['#ff9a9e', '#fecfef'], icon: '🌍' },
];

export default function CategoryScreen() {
  const { id: categoryId } = useLocalSearchParams();
  const router = useRouter();
  
  const [movies, setMovies] = useState<TMDbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const category = categories.find(cat => cat.id === categoryId);

  useEffect(() => {
    if (category) {
      loadMovies(true);
    }
  }, [category]);

  const loadMovies = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      if (!category) return;

      const currentPage = reset ? 1 : page;
      let response: any;

      if (category.country) {
        response = await tmdbService.getRegionalContent(category.country, 'movie', currentPage);
      } else if (category.language) {
        const filters = {
          with_original_language: category.language,
          sort_by: 'popularity.desc',
          page: currentPage
        };
        response = await tmdbService.advancedMovieSearch(filters);
      }

      if (response) {
        if (reset) {
          setMovies(response);
          setTotalPages(Math.min(500, 100));
        } else {
          setMovies(prev => [...prev, ...response]);
        }
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error loading category movies:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleMoviePress = (movie: TMDbMovie) => {
    router.push(`/tmdb-content/${movie.id}?type=movie`);
  };

  const handleBackPress = () => {
    router.back();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMovies(true);
  };

  const loadMore = () => {
    if (!loadingMore && page <= totalPages && movies.length > 0) {
      loadMovies(false);
    }
  };

  const renderMovieItem = ({ item, index }: { item: TMDbMovie, index: number }) => {
    return (
      <View style={styles.movieItemContainer}>
        <TouchableOpacity 
          style={styles.movieCard}
          onPress={() => handleMoviePress(item)}
        >
          <ImageBackground
            source={{ 
              uri: item.poster_path 
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
                : 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image'
            }}
            style={styles.moviePoster}
            imageStyle={styles.posterImage}
          >
            {/* Quality Badge */}
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>HD</Text>
            </View>
            
            {/* Type Badge */}
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>MOVIE</Text>
            </View>
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.movieGradient}
            >
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {item.title || item.name}
                </Text>
                <View style={styles.movieMeta}>
                  <Text style={styles.movieYear}>
                    {new Date(item.release_date || '').getFullYear() || 'N/A'}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {item.vote_average?.toFixed(1) || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E50914" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={category?.gradient || ['#667eea', '#764ba2']}
        style={styles.categoryHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.categoryIcon}>{category?.icon}</Text>
        <Text style={styles.categoryTitle}>{category?.name} Movies</Text>
      </LinearGradient>
      
      <View style={styles.statsContainer}>
        <Text style={styles.resultCount}>
          {movies.length} movies found
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: category?.name || "Category",
            headerStyle: { backgroundColor: "#000" },
            headerTintColor: "#fff",
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading {category?.name} movies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Category Not Found",
            headerStyle: { backgroundColor: "#000" },
            headerTintColor: "#fff",
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E50914" />
          <Text style={styles.errorText}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: category.name,
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item, index) => `${category.id}-${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
            progressBackgroundColor="#000"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    marginLeft: 10,
    padding: 8,
  },
  headerContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  resultCount: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  separator: {
    height: 20,
  },
  movieItemContainer: {
    width: cardWidth,
    marginBottom: 20,
  },
  movieCard: {
    width: '100%',
    height: cardWidth * 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  moviePoster: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  posterImage: {
    borderRadius: 16,
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 2,
  },
  qualityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 2,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  movieGradient: {
    height: '50%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 18,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movieYear: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
