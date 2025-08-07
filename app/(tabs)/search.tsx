
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, View, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow, TMDbGenre } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

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
      
      setGenres(uniqueGenres.slice(0, 8));
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
        <ThemedText style={styles.title}>
          Search & Discover
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Find movies and TV shows from around the world
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies and TV shows..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter by Genre */}
        <View style={styles.genreSection}>
          <ThemedText style={styles.sectionTitle}>Filter by Genre</ThemedText>
          
          <View style={styles.genreContainer}>
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
            
            {genres.slice(0, 4).map((genre) => (
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
          </View>

          {genres.length > 4 && (
            <View style={[styles.genreContainer, { marginTop: 12 }]}>
              {genres.slice(4, 8).map((genre) => (
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
            </View>
          )}
        </View>

        {/* Trending Now Section */}
        {!searchQuery.trim() && !selectedGenre && (
          <View style={styles.trendingSection}>
            <View style={styles.trendingSectionHeader}>
              <View style={styles.trendingTitleContainer}>
                <View style={styles.trendingIcon}>
                  <ThemedText style={styles.trendingEmoji}>🔥</ThemedText>
                </View>
                <ThemedText style={styles.sectionTitle}>Trending Now</ThemedText>
              </View>
              <TouchableOpacity>
                <ThemedText style={styles.viewAllText}>View all →</ThemedText>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ThemedText style={styles.loadingText}>Loading...</ThemedText>
              </View>
            ) : trendingContent.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {trendingContent.slice(0, 10).map((item, index) => {
                  const mediaType = determineMediaType(item);
                  return (
                    <View key={`${item.id}-${mediaType}`} style={styles.trendingCard}>
                      <TMDbContentCard
                        content={item}
                        type={mediaType}
                        onPress={() => handleContentPress(item, mediaType)}
                        style={styles.horizontalCard}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        )}

        {/* Results Section */}
        {(searchQuery.trim() || selectedGenre) && (
          <View style={styles.resultsSection}>
            <View style={styles.resultHeader}>
              <ThemedText style={styles.sectionTitle}>
                {searchQuery.trim() ? 'Search Results' : 'Filtered Results'}
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
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="film-outline" size={48} color="#666" />
                <ThemedText style={styles.emptyText}>
                  No results found
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  Try adjusting your search or filter
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
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
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
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
  trendingSection: {
    paddingBottom: 32,
  },
  trendingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  trendingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingIcon: {
    marginRight: 12,
  },
  trendingEmoji: {
    fontSize: 24,
  },
  viewAllText: {
    fontSize: 16,
    color: '#FF453A',
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingHorizontal: 20,
  },
  trendingCard: {
    width: 140,
    marginRight: 16,
  },
  horizontalCard: {
    width: '100%',
  },
  resultsSection: {
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
  contentItem: {
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
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
