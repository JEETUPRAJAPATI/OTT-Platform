
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, View, Dimensions, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface Genre {
  id: number;
  name: string;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  const genres: Genre[] = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
  ];

  useEffect(() => {
    // Load trending content by default
    loadTrendingContent();
  }, []);

  const loadTrendingContent = async () => {
    try {
      setLoading(true);
      const results = await tmdbService.getTrending();
      setContent(results);
    } catch (error) {
      console.error('Loading trending content error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim().length < 2) {
      loadTrendingContent();
      return;
    }

    try {
      setLoading(true);
      const results = await tmdbService.searchContent(query);
      setContent(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreFilter = async (genreId: number) => {
    setSelectedGenre(genreId);
    setSearchQuery('');
    try {
      setLoading(true);
      const results = await tmdbService.getMoviesByGenre(genreId);
      setContent(results);
    } catch (error) {
      console.error('Genre filter error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (contentItem: TMDbMovie | TMDbTVShow) => {
    const type = (contentItem as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${contentItem.id}?type=${type}`);
  };

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  const renderContentItem = ({ item, index }: { item: any, index: number }) => {
    const mediaType = determineMediaType(item);
    return (
      <View style={[styles.contentItem, { width: cardWidth }]}>
        <TMDbContentCard
          content={item}
          type={mediaType}
          onPress={() => handleContentPress(item)}
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
          Discover
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
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
                  setSelectedGenre(null);
                  loadTrendingContent();
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            <TouchableOpacity
              style={[
                styles.genreChip,
                !selectedGenre && styles.activeGenreChip
              ]}
              onPress={() => {
                setSelectedGenre(null);
                setSearchQuery('');
                loadTrendingContent();
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

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.resultHeader}>
            <ThemedText style={styles.sectionTitle}>
              {searchQuery.trim() ? 'Search Results' : selectedGenre ? 'Filtered Results' : 'Trending Now'}
            </ThemedText>
            {content.length > 0 && (
              <ThemedText style={styles.resultCount}>
                {content.length} {content.length === 1 ? 'item' : 'items'}
              </ThemedText>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <Ionicons name="refresh" size={32} color="#FF453A" />
              </View>
              <ThemedText style={styles.loadingText}>Loading content...</ThemedText>
            </View>
          ) : content.length > 0 ? (
            <FlatList
              data={content}
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
              <Ionicons name="library-outline" size={48} color="#8E8E93" />
              <ThemedText style={styles.emptyText}>
                No content available
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Try adjusting your search or filter
              </ThemedText>
            </View>
          )}
        </View>
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
    letterSpacing: -0.5,
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
    paddingVertical: 60,
  },
  loadingSpinner: {
    marginBottom: 16,
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
