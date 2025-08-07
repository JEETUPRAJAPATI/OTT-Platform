
import React, { useState, useEffect } from 'react';
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
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

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

  const handleTMDbContentPress = (content: TMDbMovie | TMDbTVShow) => {
    const type = (content as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${content.id}?type=${type}`);
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

      setFeaturedContent(trending.slice(0, 5));

      setContentSections([
        {
          id: 'trending',
          title: 'Trending Now',
          icon: '🔥',
          data: trending.slice(0, 15),
        },
        {
          id: 'hindi-top10',
          title: 'Top 10 in India Today',
          icon: '🇮🇳',
          data: hindi.slice(0, 10),
          showRanking: true,
        },
        {
          id: 'popular',
          title: 'Popular on RK SWOT',
          icon: '⭐',
          data: popular.slice(0, 15),
        },
        {
          id: 'latest',
          title: 'New Releases',
          icon: '🎬',
          data: upcoming.slice(0, 15),
        },
        {
          id: 'action',
          title: 'Action Movies',
          icon: '💥',
          data: marvel.slice(0, 15),
        },
        {
          id: 'thriller',
          title: 'Thrillers',
          icon: '😱',
          data: thriller2025.slice(0, 15),
        },
        {
          id: 'south',
          title: 'South Indian Cinema',
          icon: '🎭',
          data: south.slice(0, 15),
        },
        {
          id: 'toprated',
          title: 'Critics Choice',
          icon: '🏆',
          data: topRated.slice(0, 15),
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

  const renderContentRow = ({ item: section }: { item: ContentSection }) => {
    if (!section.data || section.data.length === 0) return null;

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {section.icon} {section.title}
          </Text>
          <TouchableOpacity onPress={() => router.push('/discover')}>
            <Text style={styles.viewAllButton}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={section.data}
          renderItem={({ item, index }) => {
            const mediaType = (item as any).title ? 'movie' : 'tv';
            return (
              <View style={styles.contentItemWrapper}>
                {section.showRanking && (
                  <View style={styles.rankingBadge}>
                    <Text style={styles.rankingNumber}>{index + 1}</Text>
                  </View>
                )}
                <TMDbContentCard
                  content={item}
                  type={mediaType}
                  onPress={() => handleTMDbContentPress(item)}
                  style={[
                    styles.contentCard,
                    section.showRanking && styles.contentCardWithRank
                  ]}
                />
              </View>
            );
          }}
          keyExtractor={(item, index) => `${section.id}-${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contentRow}
          snapToInterval={screenWidth * 0.35}
          decelerationRate="fast"
        />
      </View>
    );
  };

  if (showSplash) {
    return <SplashScreen onAnimationEnd={() => setShowSplash(false)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <FlatList
        data={[{ type: 'hero' }, ...contentSections.map(section => ({ type: 'section', section }))]}
        renderItem={({ item }) => {
          if (item.type === 'hero') {
            return renderHeroSection();
          }
          return renderContentRow({ item: item.section });
        }}
        keyExtractor={(item, index) => 
          item.type === 'hero' ? 'hero' : `section-${item.section.id}-${index}`
        }
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
    </View>
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
  
  // Content Sections
  contentSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllButton: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
  contentRow: {
    paddingLeft: 20,
  },
  contentItemWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  contentCard: {
    width: screenWidth * 0.32,
    height: screenWidth * 0.48,
  },
  contentCardWithRank: {
    marginTop: 20,
  },
  rankingBadge: {
    position: 'absolute',
    top: -15,
    left: -8,
    zIndex: 10,
    width: 28,
    height: 28,
    backgroundColor: '#E50914',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankingNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
