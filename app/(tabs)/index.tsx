import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  View, 
  TouchableOpacity, 
  Dimensions,
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { SliderBanner } from '@/components/SliderBanner';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

const { width: screenWidth } = Dimensions.get('window');

interface ContentSection {
  id: string;
  title: string;
  icon: string;
  data: (TMDbMovie | TMDbTVShow)[];
  showRanking?: boolean;
}

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [featuredContent, setFeaturedContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleTMDbContentPress = (content: TMDbMovie | TMDbTVShow) => {
    const type = (content as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${content.id}?type=${type}`);
  };

  const handleWatchNow = (content: TMDbMovie | TMDbTVShow) => {
    // Navigate to content details or player
    handleTMDbContentPress(content);
  };

  const loadContent = async () => {
    try {
      const [
        trending,
        popular,
        topRated,
        upcoming,
        hindi,
        south,
        marvel,
        thriller2025
      ] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedMovies(),
        tmdbService.getUpcomingMovies(),
        tmdbService.getHindiMovies(),
        tmdbService.getSouthIndianMovies(),
        tmdbService.getMarvelMovies(),
        tmdbService.getThrillerMovies2025()
      ]);

      // Set featured content for slider (top trending items)
      setFeaturedContent(trending.slice(0, 5));

      // Set up content sections
      setContentSections([
        {
          id: 'international',
          title: 'International Hits',
          icon: '🌍',
          data: popular.slice(0, 10),
        },
        {
          id: 'hindi-top10',
          title: 'Top 10 in India Today - Hindi',
          icon: '🇮🇳',
          data: hindi.slice(0, 10),
          showRanking: true,
        },
        {
          id: 'latest',
          title: 'Latest Releases',
          icon: '🎬',
          data: upcoming.slice(0, 10),
        },
        {
          id: 'action',
          title: 'Action Extravaganza',
          icon: '💥',
          data: marvel.slice(0, 10),
        },
        {
          id: 'thriller',
          title: 'Thriller Zone',
          icon: '😱',
          data: thriller2025.slice(0, 10),
        },
        {
          id: 'south',
          title: 'South Indian Cinema',
          icon: '🎭',
          data: south.slice(0, 10),
        },
        {
          id: 'trending',
          title: 'Trending Now',
          icon: '🔥',
          data: trending.slice(5, 15),
        },
        {
          id: 'toprated',
          title: 'Critics Choice',
          icon: '⭐',
          data: topRated.slice(0, 10),
        },
      ]);
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

  const renderContentSection = ({ item: section }: { item: ContentSection }) => {
    if (!section.data || section.data.length === 0) return null;

    return (
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {section.icon} {section.title}
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/discover')}>
            <ThemedText style={styles.viewAllText}>View All →</ThemedText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={section.data}
          renderItem={({ item, index }) => {
            const mediaType = (item as any).title ? 'movie' : 'tv';
            return (
              <View style={styles.contentItem}>
                {section.showRanking && (
                  <View style={styles.rankContainer}>
                    <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                  </View>
                )}
                <TMDbContentCard
                  content={item}
                  type={mediaType}
                  onPress={() => handleTMDbContentPress(item)}
                  style={[
                    styles.card,
                    section.showRanking && styles.cardWithRank
                  ]}
                />
              </View>
            );
          }}
          keyExtractor={(item, index) => `${section.id}-${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionContent}
        />
      </ThemedView>
    );
  };

  if (showSplash) {
    return <SplashScreen onAnimationEnd={() => setShowSplash(false)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <FlatList
        data={[{ type: 'slider' }, ...contentSections.map(section => ({ type: 'section', section }))]}
        renderItem={({ item }) => {
          if (item.type === 'slider') {
            return (
              <SliderBanner
                content={featuredContent}
                onContentPress={handleTMDbContentPress}
                onWatchNow={handleWatchNow}
              />
            );
          }

          return renderContentSection({ item: item.section });
        }}
        keyExtractor={(item, index) => 
          item.type === 'slider' ? 'slider' : `section-${item.section.id}-${index}`
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#E50914"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.mainScrollView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainScrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContent: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  contentItem: {
    marginRight: 12,
    position: 'relative',
  },
  card: {
    width: screenWidth * 0.32,
    height: screenWidth * 0.48,
  },
  cardWithRank: {
    marginTop: 15,
  },
  rankContainer: {
    position: 'absolute',
    top: -15,
    left: -10,
    zIndex: 10,
    width: 35,
    height: 35,
    backgroundColor: '#E50914',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});