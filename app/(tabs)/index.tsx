
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, RefreshControl, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { PlatformLogo } from '@/components/PlatformLogo';
import { SliderBanner } from '@/components/SliderBanner';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { platforms, contentData, Content } from '@/data/ottPlatforms';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [trendingContent, setTrendingContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDbMovie[]>([]);
  const [topRatedTv, setTopRatedTv] = useState<TMDbTVShow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handlePlatformPress = (platformId: string) => {
    router.push(`/platform/${platformId}`);
  };

  const handleContentPress = (content: Content) => {
    router.push(`/content/${content.id}`);
  };

  const handleTMDbContentPress = (content: TMDbMovie | TMDbTVShow) => {
    const type = (content as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${content.id}?type=${type}`);
  };

  const loadContent = async () => {
    try {
      const [trending, popular, topRated] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedTVShows()
      ]);
      
      setTrendingContent(trending.slice(0, 6));
      setPopularMovies(popular.slice(0, 6));
      setTopRatedTv(topRated.slice(0, 6));
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!showSplash) {
      loadContent();
    }
  }, [showSplash]);

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  // Get newest releases (latest 4 content items by release year)
  const newReleases = contentData && contentData.length > 0 
    ? [...contentData].sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 4)
    : [];

  if (showSplash) {
    return <SplashScreen onAnimationEnd={() => setShowSplash(false)} />;
  }

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
            RK SWOT
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Your Ultimate Entertainment Hub
          </ThemedText>
        </ThemedView>

        <SliderBanner 
          content={newReleases} 
          onContentPress={handleContentPress}
        />

        {/* Quick Actions */}
        <ThemedView style={styles.quickActionsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/search')}
            >
              <ThemedText style={styles.quickActionIcon}>🔍</ThemedText>
              <ThemedText style={styles.quickActionText}>Search</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/discover')}
            >
              <ThemedText style={styles.quickActionIcon}>🎬</ThemedText>
              <ThemedText style={styles.quickActionText}>Discover</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/downloads')}
            >
              <ThemedText style={styles.quickActionIcon}>📥</ThemedText>
              <ThemedText style={styles.quickActionText}>Downloads</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Trending Section */}
        {trendingContent.length > 0 && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                🔥 Trending Worldwide
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/discover')}>
                <ThemedText style={styles.seeAllText}>See All</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={trendingContent}
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
              keyExtractor={(item) => `trending-${item.id}`}
              numColumns={2}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
            />
          </ThemedView>
        )}

        {/* Popular Movies Section */}
        {popularMovies.length > 0 && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                🍿 Popular Movies
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/discover')}>
                <ThemedText style={styles.seeAllText}>See All</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={popularMovies}
              renderItem={({ item }) => (
                <TMDbContentCard
                  content={item}
                  type="movie"
                  onPress={() => handleTMDbContentPress(item)}
                />
              )}
              keyExtractor={(item) => `popular-${item.id}`}
              numColumns={2}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
            />
          </ThemedView>
        )}

        {/* Top Rated TV Shows Section */}
        {topRatedTv.length > 0 && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                📺 Top Rated TV Shows
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/discover')}>
                <ThemedText style={styles.seeAllText}>See All</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={topRatedTv}
              renderItem={({ item }) => (
                <TMDbContentCard
                  content={item}
                  type="tv"
                  onPress={() => handleTMDbContentPress(item)}
                />
              )}
              keyExtractor={(item) => `toprated-${item.id}`}
              numColumns={2}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
            />
          </ThemedView>
        )}

        {/* Platforms Section */}
        <ThemedView style={styles.platformsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🎭 Choose Platform
          </ThemedText>
          <FlatList
            data={platforms}
            renderItem={({ item }) => (
              <PlatformLogo
                platform={item}
                onPress={() => handlePlatformPress(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.platformGrid}
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
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  quickActionsSection: {
    marginBottom: 30,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  platformsContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20,
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
  platformGrid: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  contentGrid: {
    paddingBottom: 10,
  },
});
