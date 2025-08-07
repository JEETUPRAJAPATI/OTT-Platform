
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, View, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow, TMDbGenre } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [genres, setGenres] = useState<TMDbGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendingContent, setTrendingContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [movieGenres, tvGenres, trending] = await Promise.all([
        tmdbService.getMovieGenres(),
        tmdbService.getTVGenres(),
        tmdbService.getTrending()
      ]);
      
      const allGenres = [...movieGenres, ...tvGenres];
      const uniqueGenres = allGenres.filter((genre, index, self) => 
        index === self.findIndex(g => g.id === genre.id)
      );
      
      setGenres(uniqueGenres.slice(0, 8)); // Limit genres for better UI
      setTrendingContent(trending);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await tmdbService.searchMulti(query);
      setSearchResults(results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv'));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreFilter = async (genreId: number) => {
    try {
      setLoading(true);
      setSelectedGenre(genreId);
      const movies = await tmdbService.getMoviesByGenre(genreId);
      setSearchResults(movies);
    } catch (error) {
      console.error('Genre filter error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (content: TMDbMovie | TMDbTVShow, type: 'movie' | 'tv') => {
    router.push(`/tmdb-content/${content.id}?type=${type}`);
  };

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  const displayContent = searchQuery.trim() || selectedGenre ? searchResults : trendingContent;

  const renderContentItem = ({ item, index }: { item: any, index: number }) => {
    const mediaType = determineMediaType(item);
    return (
      <View style={[styles.contentItem, { width: cardWidth }]}>
        <TMDbContentCard
          content={item}
          type={mediaType}
          onPress={() => handleContentPress(item, mediaType)}
          style={styles.card}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Search & Discover
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Find movies and TV shows from around the world
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies and TV shows..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              placeholderTextColor="#666"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Genre Filter */}
        <View style={styles.genreSection}>
          <ThemedText style={styles.sectionTitle}>Filter by Genre</ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            <TouchableOpacity
              style={[
                styles.genreChip,
                !selectedGenre && styles.activeGenreChip
              ]}
              onPress={() => {
                setSelectedGenre(null);
                setSearchResults([]);
              }}
            >
              <ThemedText style={[
                styles.genreText,
                !selectedGenre && styles.activeGenreText
              ]}>
                All
              </ThemedText>
            </TouchableOpacity>
            
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={[
                  styles.genreChip,
                  selectedGenre === genre.id && styles.activeGenreChip
                ]}
                onPress={() => handleGenreFilter(genre.id)}
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

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <View style={styles.resultHeader}>
            <ThemedText style={styles.sectionTitle}>
              {searchQuery.trim() ? 'Search Results' : selectedGenre ? 'Filtered Results' : 'Trending Now'}
            </ThemedText>
            {displayContent.length > 0 && (
              <ThemedText style={styles.resultCount}>
                {displayContent.length} {displayContent.length === 1 ? 'item' : 'items'}
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
              renderItem={renderContentItem}
              keyExtractor={(item) => `${item.id}-${determineMediaType(item)}`}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : searchQuery.trim() || selectedGenre ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={48} color="#666" />
              <ThemedText style={styles.emptyText}>
                No results found
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Try adjusting your search or filter
              </ThemedText>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#111',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  clearButton: {
    marginLeft: 8,
  },
  genreSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  genreScroll: {
    marginBottom: 10,
  },
  genreChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeGenreChip: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  activeGenreText: {
    color: '#fff',
  },
  resultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  contentGrid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  contentItem: {
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
