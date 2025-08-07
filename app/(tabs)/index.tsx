
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, RefreshControl, View, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { PlatformLogo } from '@/components/PlatformLogo';
import { SliderBanner } from '@/components/SliderBanner';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { platforms, contentData, Content } from '@/data/ottPlatforms';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [trendingContent, setTrendingContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDbMovie[]>([]);
  const [topRatedTv, setTopRatedTv] = useState<TMDbTVShow[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<TMDbMovie[]>([]);
  const [hindiMovies, setHindiMovies] = useState<TMDbMovie[]>([]);
  const [southIndianMovies, setSouthIndianMovies] = useState<TMDbMovie[]>([]);
  const [marvelMovies, setMarvelMovies] = useState<TMDbMovie[]>([]);
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
      const [trending, popular, topRated, upcoming, hindi, south, marvel] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedTVShows(),
        tmdbService.getUpcomingMovies?.() || tmdbService.getPopularMovies(),
        tmdbService.getHindiMovies(),
        tmdbService.getSouthIndianMovies(),
        tmdbService.getMarvelMovies()
      ]);
      
      setTrendingContent(trending.slice(0, 10));
      setPopularMovies(popular.slice(0, 10));
      setTopRatedTv(topRated.slice(0, 10));
      setUpcomingMovies(upcoming.slice(0, 10));
      setHindiMovies(hindi.slice(0, 10));
      setSouthIndianMovies(south.slice(0, 10));
      setMarvelMovies(marvel.slice(0, 10));
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

  // Get newest releases for the hero slider
  const newReleases = contentData && contentData.length > 0 
    ? [...contentData].sort((a, b) => b.releaseYear - a.releaseYear).slice(0, 6)
    : [];

  const renderHorizontalSection = (
    title: string, 
    data: any[], 
    icon: string,
    showViewAll: boolean = true
  ) => (
    <ThemedView style={styles.horizontalSection}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {icon} {title}
        </ThemedText>
        {showViewAll && (
          <TouchableOpacity onPress={() => router.push('/discover')}>
            <ThemedText style={styles.viewAllText}>View All →</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data}
        renderItem={({ item, index }) => {
          const mediaType = determineMediaType(item);
          return (
            <View style={styles.horizontalCard}>
              {title.includes('Top 10') && (
                <View style={styles.rankBadge}>
                  <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
                </View>
              )}
              <TMDbContentCard
                content={item}
                type={mediaType}
                onPress={() => handleTMDbContentPress(item)}
                style={styles.cardInHorizontal}
              />
            </View>
          );
        }}
        keyExtractor={(item, index) => `${title}-${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </ThemedView>
  );

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
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            RK SWOT
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Your Ultimate Entertainment Hub
          </ThemedText>
        </ThemedView>

        {/* Hero Slider */}
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

        {/* Content Sections */}
        {trendingContent.length > 0 && renderHorizontalSection(
          'International Hits', 
          trendingContent, 
          '🌍'
        )}

        {hindiMovies.length > 0 && renderHorizontalSection(
          'Top 10 in India Today - Hindi', 
          hindiMovies, 
          '🇮🇳'
        )}

        {southIndianMovies.length > 0 && renderHorizontalSection(
          'South Indian Cinema', 
          southIndianMovies, 
          '🎭'
        )}

        {marvelMovies.length > 0 && renderHorizontalSection(
          'Marvel Universe', 
          marvelMovies, 
          '🦸'
        )}

        {upcomingMovies.length > 0 && renderHorizontalSection(
          'Latest Releases', 
          upcomingMovies, 
          '🆕'
        )}

        {popularMovies.length > 0 && renderHorizontalSection(
          'Popular Movies', 
          popularMovies, 
          '🍿'
        )}

        {topRatedTv.length > 0 && renderHorizontalSection(
          'Top Rated TV Shows', 
          topRatedTv, 
          '📺'
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
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 20,
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
    color: '#fff',
  },
  quickActionsSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
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
    backgroundColor: '#1a1a1a',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  horizontalSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  viewAllText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  horizontalCard: {
    marginRight: 10,
    position: 'relative',
  },
  cardInHorizontal: {
    width: screenWidth * 0.35,
    height: screenWidth * 0.52,
  },
  rankBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#E50914',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#000',
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  platformsContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  platformGrid: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
