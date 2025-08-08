import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  View, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  ImageBackground,
  Text,
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { MovieSlider } from '@/components/MovieSlider';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { userService } from '@/services/userService';
import { Footer } from '@/components/Footer';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [currentHero, setCurrentHero] = useState(0);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleTMDbContentPress = useCallback((content: TMDbMovie | TMDbTVShow) => {
    const type = (content as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${content.id}?type=${type}`);
  }, [router]);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadContent = async () => {
    try {
      // Load user data
      userService.loadFromStorage();
      const continueWatching = userService.getContinueWatching();
      const userFavoriteGenres = userService.getRecommendedGenres();

      const [
        trending,
        popular,
        topRated,
        upcoming,
        nowPlaying,
        hindi,
        south,
        marvel,
        thriller2025,
        family,
        romantic,
        awards,
        airingToday,
        onAir,
        topRatedTV,
        popularTV,
        personalizedMovies,
        personalizedTV
      ] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedMovies(),
        tmdbService.getUpcomingMovies(),
        tmdbService.getNowPlayingMovies(),
        tmdbService.getHindiMovies(),
        tmdbService.getSouthIndianMovies(),
        tmdbService.getMarvelMovies(),
        tmdbService.getThrillerMovies2025(),
        tmdbService.getFamilyMovies(),
        tmdbService.getRomanticMovies(),
        tmdbService.getAwardWinners(),
        tmdbService.getAiringTodayTVShows(),
        tmdbService.getOnAirTVShows(),
        tmdbService.getTopRatedTVShows(),
        tmdbService.getPopularTVShows(),
        userFavoriteGenres.length > 0 ? tmdbService.getContentByGenres(userFavoriteGenres, 'movie') : [],
        userFavoriteGenres.length > 0 ? tmdbService.getContentByGenres(userFavoriteGenres, 'tv') : []
      ]);

      setFeaturedContent(trending.slice(0, 5));

      // Create a pool of used content to avoid duplicates
      const usedIds = new Set();

      const getUniqueContent = (data: any[], count: number, preserveOrder = false) => {
        let filtered = data.filter(item => !usedIds.has(item.id));
        if (!preserveOrder) {
          // Always randomize content for dynamic experience
          filtered = shuffleArray(filtered);
        }
        const selected = filtered.slice(0, count);
        selected.forEach(item => usedIds.add(item.id));
        return selected;
      };

      // Build sections array dynamically
      const sections: ContentSection[] = [];

      // Continue Watching (if user has viewing history)
      if (continueWatching.length > 0) {
        sections.push({
          id: 'continue-watching',
          title: 'Continue Watching',
          icon: '▶️',
          data: continueWatching.map(item => ({
            id: item.contentId,
            title: item.title,
            poster_path: item.posterPath,
            vote_average: 0,
            overview: '',
            release_date: '',
            first_air_date: '',
            genre_ids: [],
            original_language: '',
            popularity: 0,
            backdrop_path: ''
          })),
          showRanking: false,
        });
      }

      // Core sections
      sections.push(
        {
          id: 'trending',
          title: 'Trending Now',
          icon: '🔥',
          data: getUniqueContent(trending, 20),
        },
        {
          id: 'hindi-top10',
          title: 'Top 10 in India',
          icon: '🇮🇳',
          data: getUniqueContent(hindi, 10, true), // Preserve order for rankings
          showRanking: true,
        }
      );

      // Personalized recommendations
      if (personalizedMovies.length > 0 || personalizedTV.length > 0) {
        const personalizedContent = [...personalizedMovies, ...personalizedTV];
        sections.push({
          id: 'recommended',
          title: 'Recommended for You',
          icon: '🎯',
          data: getUniqueContent(personalizedContent, 20),
        });
      }

      // Continue with other sections
      sections.push(
        {
          id: 'now-playing',
          title: 'Now Playing in Cinemas',
          icon: '🎭',
          data: getUniqueContent(nowPlaying, 20),
        },
        {
          id: 'airing-today',
          title: 'On TV Today',
          icon: '📺',
          data: getUniqueContent(airingToday, 20),
        },
        {
          id: 'popular',
          title: 'Popular on RK SWOT',
          icon: '⭐',
          data: getUniqueContent(popular, 20),
        },
        {
          id: 'latest',
          title: 'New Releases',
          icon: '🎬',
          data: getUniqueContent(upcoming, 20),
        },
        {
          id: 'on-air',
          title: 'Currently Airing Series',
          icon: '📡',
          data: getUniqueContent(onAir, 20),
        },
        {
          id: 'action',
          title: 'Action & Adventure',
          icon: '💥',
          data: getUniqueContent(marvel, 20),
        },
        {
          id: 'thriller',
          title: 'Thrillers & Suspense',
          icon: '😱',
          data: getUniqueContent(thriller2025, 20),
        },
        {
          id: 'south',
          title: 'South Indian Cinema',
          icon: '🎭',
          data: getUniqueContent(south, 20),
        },
        {
          id: 'toprated',
          title: 'Critics Choice',
          icon: '🏆',
          data: getUniqueContent(topRated, 20),
        },
        {
          id: 'toprated-tv',
          title: 'Top Rated Series',
          icon: '🏅',
          data: getUniqueContent(topRatedTV, 20),
        },
        {
          id: 'family',
          title: 'Family Entertainment',
          icon: '👨‍👩‍👧‍👦',
          data: getUniqueContent(family, 20),
        },
        {
          id: 'romantic',
          title: 'Romance & Drama',
          icon: '💕',
          data: getUniqueContent(romantic, 20),
        },
        {
          id: 'awards',
          title: 'Award Winners',
          icon: '🥇',
          data: getUniqueContent(awards, 20),
        },
        {
          id: 'popular-tv',
          title: 'Popular Series',
          icon: '📺',
          data: getUniqueContent(popularTV, 20),
        }
      );

      setContentSections(sections);
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

  // Auto-change hero content
  useEffect(() => {
    if (featuredContent.length > 1) {
      const interval = setInterval(() => {
        setCurrentHero(prev => (prev + 1) % featuredContent.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [featuredContent.length]);

  const renderHeroSection = () => {
    if (!featuredContent.length) return null;

    const heroItem = featuredContent[currentHero];
    const title = (heroItem as any).title || (heroItem as any).name;
    const backdropUrl = `https://image.tmdb.org/t/p/w1280${heroItem.backdrop_path}`;

    return (
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: backdropUrl }}
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)', '#000']}
            locations={[0, 0.6, 0.8, 1]}
            style={styles.heroGradient}
          >
            <SafeAreaView style={styles.heroContent}>
              <View style={styles.heroTopSection}>
                <Text style={styles.logoText}>RK SWOT</Text>
                <TouchableOpacity style={styles.profileButton}>
                  <Text style={styles.profileIcon}>👤</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.heroBottomSection}>
                <View style={styles.newReleaseBadge}>
                  <Text style={styles.badgeText}>NEW RELEASE</Text>
                </View>

                <Text style={styles.heroTitle} numberOfLines={2}>
                  {title}
                </Text>

                <View style={styles.heroMeta}>
                  <Text style={styles.heroYear}>
                    {new Date((heroItem as any).release_date || (heroItem as any).first_air_date).getFullYear()}
                  </Text>
                  <View style={styles.heroDot} />
                  <Text style={styles.heroRating}>
                    ⭐ {heroItem.vote_average.toFixed(1)}
                  </Text>
                  <View style={styles.heroDot} />
                  <Text style={styles.heroType}>
                    {(heroItem as any).title ? 'Movie' : 'Series'}
                  </Text>
                </View>

                <Text style={styles.heroDescription} numberOfLines={3}>
                  {heroItem.overview}
                </Text>

                <View style={styles.heroButtons}>
                  <TouchableOpacity 
                    style={styles.playButton}
                    onPress={() => handleTMDbContentPress(heroItem)}
                  >
                    <Text style={styles.playIcon}>▶</Text>
                    <Text style={styles.playText}>Play</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={() => handleTMDbContentPress(heroItem)}
                  >
                    <Text style={styles.infoIcon}>ℹ</Text>
                    <Text style={styles.infoText}>More Info</Text>
                  </TouchableOpacity>
                </View>

                {/* Hero Indicators */}
                <View style={styles.heroIndicators}>
                  {featuredContent.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.heroIndicator,
                        index === currentHero && styles.heroIndicatorActive
                      ]}
                    />
                  ))}
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  const handleViewAll = useCallback((sectionId: string) => {
    // Navigate to discover with the specific category
    router.push(`/discover?category=${sectionId}`);
  }, [router]);

  if (showSplash) {
    return <SplashScreen onAnimationEnd={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        data={[{ type: 'hero' }, ...contentSections.map(section => ({ type: 'section', section }))]}
        renderItem={({ item }) => {
          if (item.type === 'hero') {
            return renderHeroSection();
          }
          return (
            <MovieSlider
              title={item.section.title}
              icon={item.section.icon}
              data={item.section.data}
              onContentPress={handleTMDbContentPress}
              onViewAll={() => handleViewAll(item.section.id)}
              showRanking={item.section.showRanking}
              autoSlide={true}
            />
          );
        }}
        keyExtractor={useCallback((item: any, index: number) => 
          item.type === 'hero' ? 'hero' : `section-${item.section.id}-${index}`, []
        )}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#E50914"
            progressBackgroundColor="#000"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.mainContainer}
        bounces={true}
      />

      <Footer
        onFavoritePress={() => {
          const favorites = userService.getFavorites();
          if (favorites.length > 0) {
            Alert.alert(
              `My Favorites (${favorites.length})`,
              'Your favorite movies and shows are saved in your profile.',
              [
                { text: 'View Profile', onPress: () => router.push('/(tabs)/profile') },
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert('No Favorites', 'You haven\'t added any favorites yet. Tap the heart icon on any content to add it to your favorites!');
          }
        }}
        onWatchlistPress={() => {
          const watchlist = userService.getWatchlist();
          if (watchlist.length > 0) {
            Alert.alert(
              `My Watchlist (${watchlist.length})`,
              'Your watchlist items are saved in your profile.',
              [
                { text: 'View Profile', onPress: () => router.push('/(tabs)/profile') },
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert('No Watchlist Items', 'You haven\'t added any items to your watchlist yet. Tap the bookmark icon on any content to add it!');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContainer: {
    flex: 1,
  },

  // Hero Section
  heroContainer: {
    height: screenHeight * 0.75,
  },
  heroBackground: {
    flex: 1,
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  heroGradient: {
    flex: 1,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E50914',
    letterSpacing: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 18,
    color: '#fff',
  },
  heroBottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  newReleaseBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 38,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroYear: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
  heroRating: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButtons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  playIcon: {
    color: '#000',
    fontSize: 16,
    marginRight: 8,
  },
  playText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  infoIcon: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  heroIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  heroIndicatorActive: {
    backgroundColor: '#E50914',
    width: 20,
  },


});