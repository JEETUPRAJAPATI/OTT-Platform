import React, { useState, useEffect, useRef } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height: screenHeight } = Dimensions.get('window');

interface ContentSection {
  id: string;
  title: string;
  icon: string;
  data: (TMDbMovie | TMDbTVShow)[];
  showRanking?: boolean;
  layout?: 'horizontal' | 'grid' | 'featured' | 'carousel';
  cardSize?: 'small' | 'medium' | 'large';
  autoSlide?: boolean;
  slideInterval?: number;
  showRating?: boolean;
}

// Helper function to determine media type
const determineMediaType = (item: TMDbMovie | TMDbTVShow) => {
  return (item as any).title ? 'movie' : 'tv';
};

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [featuredContent, setFeaturedContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [currentHero, setCurrentHero] = useState(0);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleTMDbContentPress = (content: TMDbMovie | TMDbTVShow) => {
    const type = determineMediaType(content);
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
          layout: 'horizontal',
          cardSize: 'medium',
          autoSlide: true,
          slideInterval: 4000,
          showRating: true,
        },
        {
          id: 'hindi-top10',
          title: 'Top 10 in India Today',
          icon: '🇮🇳',
          data: hindi.slice(0, 10),
          showRanking: true,
          layout: 'grid',
          cardSize: 'small',
        },
        {
          id: 'popular',
          title: 'Popular on RK SWOT',
          icon: '⭐',
          data: popular.slice(0, 15),
          layout: 'carousel',
        },
        {
          id: 'latest',
          title: 'New Releases',
          icon: '🎬',
          data: upcoming.slice(0, 15),
          layout: 'horizontal',
          cardSize: 'large',
          showRating: true,
        },
        {
          id: 'action',
          title: 'Action Movies',
          icon: '💥',
          data: marvel.slice(0, 15),
          layout: 'featured',
        },
        {
          id: 'thriller',
          title: 'Thrillers',
          icon: '😱',
          data: thriller2025.slice(0, 15),
          layout: 'horizontal',
          cardSize: 'medium',
          autoSlide: true,
          slideInterval: 3500,
          showRating: true,
        },
        {
          id: 'south',
          title: 'South Indian Cinema',
          icon: '🎭',
          data: south.slice(0, 15),
          layout: 'grid',
          cardSize: 'medium',
        },
        {
          id: 'toprated',
          title: 'Critics Choice',
          icon: '🏆',
          data: topRated.slice(0, 15),
          layout: 'horizontal',
          cardSize: 'medium',
          showRating: true,
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
                    {determineMediaType(heroItem)}
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

  const ContentRow = ({ section }: { section: ContentSection }) => {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (section.autoSlide && section.data.length > 0) {
        const interval = setInterval(() => {
          setCurrentIndex(prevIndex => {
            const nextIndex = (prevIndex + 1) % section.data.length;
            flatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
            return nextIndex;
          });
        }, section.slideInterval || 3000);

        return () => clearInterval(interval);
      }
    }, [section.data.length, section.autoSlide, section.slideInterval]);

    if (!section.data || section.data.length === 0) return null;

    const getCardWidth = () => {
      switch (section.cardSize) {
        case 'small': return 120;
        case 'large': return 180;
        default: return 140;
      }
    };

    const cardWidth = getCardWidth();

    const renderHorizontalLayout = () => (
      <FlatList
        ref={flatListRef}
        data={section.data}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={[
            styles.contentCard,
            { width: cardWidth },
            section.showRanking && styles.rankedCard
          ]}>
            {section.showRanking && (
              <View style={styles.rankBadge}>
                <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
              </View>
            )}
            <TMDbContentCard
              content={item}
              type={determineMediaType(item)}
              onPress={() => handleTMDbContentPress(item)}
              style={[styles.card, { width: cardWidth }]}
            />
            {section.showRating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {item.vote_average.toFixed(1)}
                </ThemedText>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => `${section.id}-${item.id}`}
        contentContainerStyle={styles.horizontalScrollContent}
        snapToInterval={cardWidth + 16}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    );

    const renderGridLayout = () => (
      <FlatList
        data={section.data}
        numColumns={section.cardSize === 'large' ? 2 : 3}
        renderItem={({ item, index }) => (
          <View style={[
            styles.gridCard,
            { width: section.cardSize === 'large' ? '48%' : '30%' }
          ]}>
            <TMDbContentCard
              content={item}
              type={determineMediaType(item)}
              onPress={() => handleTMDbContentPress(item)}
              style={styles.card}
            />
            {section.showRating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {item.vote_average.toFixed(1)}
                </ThemedText>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => `${section.id}-${item.id}`}
        contentContainerStyle={styles.gridContent}
        scrollEnabled={false}
      />
    );

    const renderFeaturedLayout = () => (
      <View style={styles.featuredLayout}>
        {section.data.slice(0, 3).map((item, index) => (
          <TouchableOpacity
            key={`${section.id}-${item.id}`}
            style={[styles.featuredCard, index === 0 && styles.mainFeaturedCard]}
            onPress={() => handleTMDbContentPress(item)}
          >
            <TMDbContentCard
              content={item}
              type={determineMediaType(item)}
              onPress={() => handleTMDbContentPress(item)}
              style={[styles.card, index === 0 && styles.mainFeaturedCardImage]}
            />
            <View style={styles.featuredOverlay}>
              <ThemedText style={[
                styles.featuredTitle,
                index === 0 && styles.mainFeaturedTitle
              ]}>
                {determineMediaType(item) === 'movie' ? (item as TMDbMovie).title : (item as TMDbTVShow).name}
              </ThemedText>
              {section.showRating && (
                <View style={styles.featuredRating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <ThemedText style={styles.featuredRatingText}>
                    {item.vote_average.toFixed(1)}
                  </ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );

    const renderCarouselLayout = () => (
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={section.data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.carouselCard}>
              <TMDbContentCard
                content={item}
                type={determineMediaType(item)}
                onPress={() => handleTMDbContentPress(item)}
                style={styles.carouselImage}
              />
              <View style={styles.carouselOverlay}>
                <ThemedText style={styles.carouselTitle}>
                  {determineMediaType(item) === 'movie' ? (item as TMDbMovie).title : (item as TMDbTVShow).name}
                </ThemedText>
              </View>
            </View>
          )}
          keyExtractor={(item) => `${section.id}-${item.id}`}
          snapToInterval={width - 40}
          decelerationRate="fast"
        />
        <View style={styles.carouselIndicators}>
          {section.data.slice(0, 5).map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex % 5 && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      </View>
    );

    return (
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/discover')}
          >
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#E50914" />
          </TouchableOpacity>
        </View>

        {section.layout === 'grid' && renderGridLayout()}
        {section.layout === 'featured' && renderFeaturedLayout()}
        {section.layout === 'carousel' && renderCarouselLayout()}
        {(!section.layout || section.layout === 'horizontal') && renderHorizontalLayout()}
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
          return <ContentRow section={item.section} />;
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  horizontalScrollContent: {
    paddingLeft: 20,
  },
  contentItemWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  contentCard: {
    // width: screenWidth * 0.32, // Default width, overridden by section.cardSize
    // height: screenWidth * 0.48, // Default height, overridden by section.cardSize
    borderRadius: 8,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
  },
  rankedCard: {
    marginTop: 20,
  },
  rankBadge: {
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
  rankNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridCard: {
    marginBottom: 16,
    marginHorizontal: '1.5%',
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  featuredLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredCard: {
    width: '48%',
    marginBottom: 16,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainFeaturedCard: {
    width: '100%',
    height: 200,
  },
  mainFeaturedCardImage: {
    height: 200,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mainFeaturedTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredRatingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselCard: {
    width: width - 40,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: 180,
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#E50914',
  },
});