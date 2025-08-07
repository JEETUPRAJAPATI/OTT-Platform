
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow, TMDbGenre } from '@/services/tmdbApi';

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
      
      // Combine and deduplicate genres
      const allGenres = [...movieGenres, ...tvGenres];
      const uniqueGenres = allGenres.filter((genre, index, self) => 
        index === self.findIndex(g => g.id === genre.id)
      );
      
      setGenres(uniqueGenres);
      setTrendingContent(trending);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data');
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
      Alert.alert('Error', 'Search failed');
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
      Alert.alert('Error', 'Failed to filter by genre');
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

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Search & Discover
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Find movies and TV shows from around the world
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies and TV shows..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            placeholderTextColor="#999"
          />
        </ThemedView>

        <ThemedView style={styles.filterSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Filter by Genre
          </ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedGenre && styles.activeFilterChip
              ]}
              onPress={() => {
                setSelectedGenre(null);
                setSearchResults([]);
              }}
            >
              <ThemedText style={[
                styles.filterChipText,
                !selectedGenre && styles.activeFilterChipText
              ]}>
                All
              </ThemedText>
            </TouchableOpacity>
            
            {genres.slice(0, 10).map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={[
                  styles.filterChip,
                  selectedGenre === genre.id && styles.activeFilterChip
                ]}
                onPress={() => handleGenreFilter(genre.id)}
              >
                <ThemedText style={[
                  styles.filterChipText,
                  selectedGenre === genre.id && styles.activeFilterChipText
                ]}>
                  {genre.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {searchQuery.trim() ? 'Search Results' : selectedGenre ? 'Filtered Results' : 'Trending Now'}
          </ThemedText>
          
          {loading ? (
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          ) : (
            <FlatList
              data={displayContent}
              renderItem={({ item }) => {
                const mediaType = determineMediaType(item);
                return (
                  <TMDbContentCard
                    content={item}
                    type={mediaType}
                    onPress={() => handleContentPress(item, mediaType)}
                  />
                );
              }}
              keyExtractor={(item) => `${item.id}-${determineMediaType(item)}`}
              numColumns={2}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
            />
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  contentGrid: {
    paddingBottom: 10,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});
