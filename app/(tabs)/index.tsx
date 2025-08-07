
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList } from 'react-native';
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

  const loadTrendingContent = async () => {
    try {
      const trending = await tmdbService.getTrending();
      setTrendingContent(trending.slice(0, 6));
    } catch (error) {
      console.error('Error loading trending content:', error);
    }
  };

  useEffect(() => {
    if (!showSplash) {
      loadTrendingContent();
    }
  }, [showSplash]);

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  // Get newest releases (latest 4 content items by release year)
  const newReleases = [...contentData]
    .sort((a, b) => b.releaseYear - a.releaseYear)
    .slice(0, 4);

  if (showSplash) {
    return <SplashScreen onAnimationEnd={() => setShowSplash(false)} />;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            RK SWOT
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Explore content from your favorite OTT platforms
          </ThemedText>
        </ThemedView>

        <SliderBanner 
          content={newReleases} 
          onContentPress={handleContentPress}
        />

        {trendingContent.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Trending Worldwide
            </ThemedText>
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

        <ThemedView style={styles.platformsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Choose Platform
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
    marginBottom: 40,
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
  platformsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
