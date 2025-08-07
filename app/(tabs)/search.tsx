
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow, TMDbGenre } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [trendingContent, setTrendingContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [genres, setGenres] = useState<TMDbGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  const quickSearches = [
    { icon: '🔥', title: 'Trending Now', action: 'trending' },
    { icon: '🎬', title: 'Latest Movies', action: 'latest' },
    { icon: '📺', title: 'Popular Series', action: 'series' },
    { icon: '🇮🇳', title: 'Bollywood', action: 'bollywood' },
  ];

  useEffect(() => {
    loadInitialContent();
  }, []);

  const loadInitialContent = async () => {
    try {
      setLoading(true);
      const [trending, movieGenres, tvGenres] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getMovieGenres(),
        tmdbService.getTVGenres()
      ]);
      
      setTrendingContent(trending.slice(0, 20));
      
      // Combine and deduplicate genres
      const allGenres = [...movieGenres, ...tvGenres];
      const uniqueGenres = allGenres.filter((genre, index, self) => 
        index === self.findIndex(g => g.id === genre.id)
      );
      setGenres(uniqueGenres.slice(0, 8));
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchActive(false);
      return;
    }

    try {
      setLoading(true);
      setSearchActive(true);
      const results = await tmdbService.searchMulti(query);
      setSearchResults(results.slice(0, 20));
      setSelectedGenre(null);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search content');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreFilter = async (genreId: number) => {
    try {
      setLoading(true);
      setSelectedGenre(genreId);
      setSearchQuery('');
      setSearchActive(true);
      const movies = await tmdbService.getMoviesByGenre(genreId);
      setSearchResults(movies);
    } catch (error) {
      console.error('Genre filter error:', error);
      Alert.alert('Error', 'Failed to filter by genre');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = async (action: string) => {
    try {
      setLoading(true);
      setSearchActive(true);
      setSearchQuery('');
      setSelectedGenre(null);
      
      let results: (TMDbMovie | TMDbTVShow)[] = [];
      
      switch (action) {
        case 'trending':
          results = await tmdbService.getTrending();
          break;
        case 'latest':
          results = await tmdbService.getUpcomingMovies();
          break;
        case 'series':
          results = await tmdbService.getPopularTVShows();
          break;
        case 'bollywood':
          results = await tmdbService.getHindiMovies();
          break;
      }
      
      setSearchResults(results.slice(0, 20));
    } catch (error) {
      console.error('Quick search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedGenre(null);
    setSearchActive(false);
  };

  const handleContentPress = (content: TMDbMovie | TMDbTVShow, type: 'movie' | 'tv') => {
    router.push(`/tmdb-content/${content.id}?type=${type}`);
  };

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  const displayContent = searchActive ? searchResults : trendingContent;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.title}>
            Search & Discover
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Find movies and TV shows from around the world
          </ThemedText>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search movies and TV shows..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(searchQuery)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      <ThemedView style={styles.content}>
        {!searchActive && (
          <>
            {/* Quick Search Section */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Quick Discovery</ThemedText>
              <View style={styles.quickSearchGrid}>
                {quickSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickSearchCard}
                    onPress={() => handleQuickSearch(item.action)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickSearchIcon}>{item.icon}</Text>
                    <ThemedText style={styles.quickSearchText}>{item.title}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Genre Filter */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Browse by Genre</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[
                      styles.genreChip,
                      selectedGenre === genre.id && styles.activeGenreChip
                    ]}
                    onPress={() => handleGenreFilter(genre.id)}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[
                      styles.genreText,
                      selectedGenre === genre.id && styles.activeGenreText
                    ]}>
                      {genre.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* Content Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {searchQuery.trim() ? 'Search Results' : 
               selectedGenre ? 'Filtered Results' : 
               'Trending Now'}
            </ThemedText>
            {displayContent.length > 0 && (
              <ThemedText style={styles.resultCount}>
                {displayContent.length} items
              </ThemedText>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading...</ThemedText>
            </View>
          ) : displayContent.length > 0 ? (
            <FlatList
              data={displayContent}
              renderItem={({ item }) => {
                const mediaType = determineMediaType(item);
                return (
                  <View style={styles.cardContainer}>
                    <TMDbContentCard
                      content={item}
                      type={mediaType}
                      onPress={() => handleContentPress(item, mediaType)}
                    />
                  </View>
                );
              }}
              keyExtractor={(item) => `${item.id}-${determineMediaType(item)}`}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={60} color="#666" />
              <ThemedText style={styles.emptyText}>
                {searchQuery.trim() ? 'No results found' : 'Start searching to discover content'}
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 30,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  clearButton: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  resultCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickSearchCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickSearchIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickSearchText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  genreScroll: {
    marginBottom: 10,
  },
  genreChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeGenreChip: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  activeGenreText: {
    color: '#fff',
  },
  cardContainer: {
    flex: 1,
    margin: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    textAlign: 'center',
  },
});
