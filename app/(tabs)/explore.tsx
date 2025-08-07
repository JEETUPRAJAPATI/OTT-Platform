
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ContentCard } from '@/components/ContentCard';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { contentData, platforms, Content } from '@/data/ottPlatforms';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [tmdbContent, setTmdbContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const genres = [
    { id: 'all', name: 'All Genres' },
    { id: 'action', name: 'Action' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'drama', name: 'Drama' },
    { id: 'thriller', name: 'Thriller' },
    { id: 'horror', name: 'Horror' },
    { id: 'romance', name: 'Romance' },
    { id: 'sci-fi', name: 'Sci-Fi' },
  ];

  const loadTMDbContent = async () => {
    try {
      const [popular, topRated] = await Promise.all([
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedTVShows()
      ]);
      
      // Combine and shuffle the content
      const combined = [...popular.slice(0, 10), ...topRated.slice(0, 10)];
      const shuffled = combined.sort(() => 0.5 - Math.random());
      setTmdbContent(shuffled);
    } catch (error) {
      console.error('Error loading TMDb content:', error);
    }
  };

  useEffect(() => {
    loadTMDbContent();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTMDbContent();
    setRefreshing(false);
  };

  const filteredContent = selectedPlatform === 'all' 
    ? contentData 
    : contentData.filter(content => content.platform === selectedPlatform);

  const filteredByGenre = selectedGenre === 'all'
    ? filteredContent
    : filteredContent.filter(content => 
        content.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );

  const handleContentPress = (content: Content) => {
    router.push(`/content/${content.id}`);
  };

  const handleTMDbContentPress = (content: TMDbMovie | TMDbTVShow) => {
    const type = (content as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${content.id}?type=${type}`);
  };

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  const topRatedContent = [...contentData]
    .sort((a, b) => b.imdbRating - a.imdbRating)
    .slice(0, 4);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Explore Content
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Discover amazing movies and series
          </ThemedText>
        </ThemedView>

        {/* Stats Section */}
        <ThemedView style={styles.statsSection}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{contentData.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Local Content</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{tmdbContent.length}</ThemedText>
            <ThemedText style={styles.statLabel}>TMDb Content</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{platforms.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Platforms</ThemedText>
          </View>
        </ThemedView>

        {/* TMDb Content Section */}
        {tmdbContent.length > 0 && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                🌟 Discover New Content
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/discover')}>
                <ThemedText style={styles.seeAllText}>More</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={tmdbContent.slice(0, 6)}
              renderItem={({ item }) => {
                const mediaType = determineMediaType(item);
                return (
                  <TMDbContentCard
                    content={item}
                    type={mediaType}
                    onPress={() => handleTMDbContentPress(item)}
                  />
                );
              }}
              keyExtractor={(item) => `tmdb-${item.id}`}
              numColumns={2}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
            />
          </ThemedView>
        )}

        {/* Top Rated Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🏆 Top Rated
          </ThemedText>
          <FlatList
            data={topRatedContent}
            renderItem={({ item }) => (
              <ContentCard
                content={item}
                onPress={() => handleContentPress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.contentGrid}
            scrollEnabled={false}
          />
        </ThemedView>

        {/* Filter Section */}
        <ThemedView style={styles.filterSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🎯 Browse by Platform
          </ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPlatform === 'all' && styles.activeFilterChip
              ]}
              onPress={() => setSelectedPlatform('all')}
            >
              <ThemedText style={[
                styles.filterChipText,
                selectedPlatform === 'all' && styles.activeFilterChipText
              ]}>
                All Platforms
              </ThemedText>
            </TouchableOpacity>
            
            {platforms.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.filterChip,
                  selectedPlatform === platform.id && styles.activeFilterChip,
                  selectedPlatform === platform.id && { backgroundColor: platform.color }
                ]}
                onPress={() => setSelectedPlatform(platform.id)}
              >
                <ThemedText style={[
                  styles.filterChipText,
                  selectedPlatform === platform.id && styles.activeFilterChipText
                ]}>
                  {platform.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Genre Filter */}
        <ThemedView style={styles.filterSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🎭 Browse by Genre
          </ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={[
                  styles.filterChip,
                  selectedGenre === genre.id && styles.activeGenreChip
                ]}
                onPress={() => setSelectedGenre(genre.id)}
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

        {/* Filtered Content */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📚 Local Content ({filteredByGenre.length} items)
          </ThemedText>
          <FlatList
            data={filteredByGenre}
            renderItem={({ item }) => (
              <ContentCard
                content={item}
                onPress={() => handleContentPress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.contentGrid}
            scrollEnabled={false}
          />
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
    marginBottom: 25,
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
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E50914',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
  contentGrid: {
    paddingBottom: 10,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    marginBottom: 10,
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
  activeGenreChip: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
});
