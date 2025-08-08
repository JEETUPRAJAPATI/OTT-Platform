
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { Footer } from '@/components/Footer';

type TMDbContent = TMDbMovie | TMDbTVShow;

export default function DiscoverScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingContent, setTrendingContent] = useState<TMDbContent[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDbMovie[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TMDbTVShow[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDbMovie[]>([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const [trending, movies, tvShows, topRated] = await Promise.all([
        tmdbService.getTrending('all', 'week'),
        tmdbService.getPopularMovies(),
        tmdbService.getPopularTVShows(),
        tmdbService.getTopRatedMovies(),
      ]);

      setTrendingContent(trending.slice(0, 10));
      setPopularMovies(movies.slice(0, 10));
      setPopularTVShows(tvShows.slice(0, 10));
      setTopRatedMovies(topRated.slice(0, 10));
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  const handleContentPress = (item: TMDbContent) => {
    const mediaType = (item as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${item.id}?type=${mediaType}`);
  };

  const renderSection = (title: string, data: TMDbContent[]) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <TMDbContentCard
            content={item}
            onPress={() => handleContentPress(item)}
            style={styles.contentCard}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <ThemedText style={styles.loadingText}>Loading content...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Discover</ThemedText>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content Sections */}
        {renderSection('🔥 Trending This Week', trendingContent)}
        {renderSection('🎬 Popular Movies', popularMovies)}
        {renderSection('📺 Popular TV Shows', popularTVShows)}
        {renderSection('⭐ Top Rated Movies', topRatedMovies)}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <Footer currentRoute="/discover" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E50914',
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  contentCard: {
    width: 140,
    marginRight: 12,
  },
  bottomSpacer: {
    height: 100,
  },
});
