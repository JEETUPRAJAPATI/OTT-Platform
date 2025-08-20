
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  TextInput,
  ScrollView,
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
  const [filteredMovies, setFilteredMovies] = useState<TMDbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [hasMorePages, setHasMorePages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        setMovies([]);
        setHasMorePages(true);
      } else {
        setLoadingMore(true);
      }

      if (!category) return;

      const currentPage = reset ? 1 : page;
      let response: any;

      if (category.country) {
        const result = await tmdbService.getRegionalContent(category.country, 'movie', currentPage);
        response = {
          results: result,
          total_pages: 500, // TMDb limit
          total_results: 10000
        };
      } else if (category.language) {
        const filters = {
          with_original_language: category.language,
          sort_by: 'popularity.desc',
          page: currentPage
        };
        const result = await tmdbService.advancedMovieSearch(filters);
        response = {
          results: result,
          total_pages: 500, // TMDb limit
          total_results: 10000
        };
      }

      if (response && response.results) {
        const newMovies = response.results;

        if (reset) {
          setMovies(newMovies);
          setTotalPages(response.total_pages || 500);
          setTotalResults(response.total_results || newMovies.length);
        } else {
          const updatedMovies = [...movies, ...newMovies];
          setMovies(updatedMovies);
        }

        // Check if there are more pages
        setHasMorePages(currentPage < (response.total_pages || 500));
        setPage(currentPage + 1);

        // Apply filters to the current movie list
        applyFilters(reset ? newMovies : [...movies, ...newMovies], selectedFilter, searchQuery);
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
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    applyFilters(movies, filter, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(movies, selectedFilter, query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    applyFilters(movies, selectedFilter, '');
  };

  const applyFilters = (movieList: TMDbMovie[], filter: string, query: string) => {
    let filtered = [...movieList];

    // Apply search filter first
    if (query.trim() !== '') {
      filtered = filtered.filter(movie =>
        (movie.title || movie.name)?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply sort filter
    switch (filter) {
      case 'popular':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'latest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.release_date || '').getTime();
          const dateB = new Date(b.release_date || '').getTime();
          return dateB - dateA;
        });
        break;
      case 'year':
        filtered.sort((a, b) => {
          const yearA = new Date(a.release_date || '').getFullYear();
          const yearB = new Date(b.release_date || '').getFullYear();
          return yearB - yearA;
        });
        break;
      default:
        // Keep original order for 'all'
        break;
    }

    setFilteredMovies(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    loadMovies(true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMorePages && movies.length > 0 && !searchQuery.trim()) {
      loadMovies(false);
    }
  };

  const renderMovieItem = useCallback(({ item, index }: { item: TMDbMovie, index: number }) => {
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
  }, [handleMoviePress]);

  const renderFooter = () => {
    if (!loadingMore) return <View style={styles.footerSpacing} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF453A" />
        <Text style={styles.loadingText}>Loading more movies...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: category?.name || "Category",
            headerShown: false,
          }}
        />
        
        {/* Custom Header for Loading State */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category?.name || "Category"}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF453A" />
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
            headerShown: false,
          }}
        />
        
        {/* Custom Header for Error State */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Category Not Found</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF453A" />
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
          headerShown: false,
        }}
      />
      
      {/* Custom Header with Back Button */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {category.icon} {category.name}
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies and TV shows..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#8E8E93"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter by Genre */}
        <View style={styles.genreSection}>
          <Text style={styles.sectionTitle}>Filter by Category</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            <TouchableOpacity
              style={[
                styles.genreChip,
                selectedFilter === 'all' && styles.activeGenreChip
              ]}
              onPress={() => handleFilterChange('all')}
            >
              <Text style={[
                styles.genreText,
                selectedFilter === 'all' && styles.activeGenreText
              ]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genreChip,
                selectedFilter === 'popular' && styles.activeGenreChip
              ]}
              onPress={() => handleFilterChange('popular')}
            >
              <Text style={[
                styles.genreText,
                selectedFilter === 'popular' && styles.activeGenreText
              ]}>
                Popular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genreChip,
                selectedFilter === 'rating' && styles.activeGenreChip
              ]}
              onPress={() => handleFilterChange('rating')}
            >
              <Text style={[
                styles.genreText,
                selectedFilter === 'rating' && styles.activeGenreText
              ]}>
                Top Rated
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genreChip,
                selectedFilter === 'latest' && styles.activeGenreChip
              ]}
              onPress={() => handleFilterChange('latest')}
            >
              <Text style={[
                styles.genreText,
                selectedFilter === 'latest' && styles.activeGenreText
              ]}>
                Latest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genreChip,
                selectedFilter === 'year' && styles.activeGenreChip
              ]}
              onPress={() => handleFilterChange('year')}
            >
              <Text style={[
                styles.genreText,
                selectedFilter === 'year' && styles.activeGenreText
              ]}>
                By Year
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery.trim() ? 'Search Results' : `${category.name} Movies`}
            </Text>
            {filteredMovies.length > 0 && (
              <Text style={styles.resultCount}>
                {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
              </Text>
            )}
          </View>

          {filteredMovies.length > 0 ? (
            <FlatList
              data={filteredMovies}
              renderItem={renderMovieItem}
              keyExtractor={(item, index) => `movie-${item.id}-${index}`}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={renderFooter}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FF453A"
                  progressBackgroundColor="#1C1C1E"
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? 'No search results' : 'No movies available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim() 
                  ? `No movies found for "${searchQuery}"`
                  : 'Try refreshing or check back later'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  genreSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  genreScroll: {
    flexDirection: 'row',
  },
  genreChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    marginRight: 12,
  },
  activeGenreChip: {
    backgroundColor: '#FF453A',
    borderColor: '#FF453A',
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  activeGenreText: {
    color: '#FFFFFF',
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  contentGrid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#FF453A',
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
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerSpacing: {
    height: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
