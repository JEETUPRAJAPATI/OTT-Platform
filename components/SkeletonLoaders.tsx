
import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Shimmer animation component
const ShimmerView: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => {
  const shimmerAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

// Hero Section Skeleton
export const HeroSkeleton: React.FC = () => {
  return (
    <View style={styles.heroContainer}>
      <ShimmerView style={styles.heroBackground}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)', '#000']}
          locations={[0, 0.6, 0.8, 1]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTopSection}>
              <ShimmerView style={styles.logoSkeleton} />
              <ShimmerView style={styles.profileSkeleton} />
            </View>

            <View style={styles.heroBottomSection}>
              <ShimmerView style={styles.badgeSkeleton} />
              <ShimmerView style={styles.titleSkeleton} />
              <View style={styles.heroMeta}>
                <ShimmerView style={styles.metaItemSkeleton} />
                <View style={styles.heroDot} />
                <ShimmerView style={styles.metaItemSkeleton} />
                <View style={styles.heroDot} />
                <ShimmerView style={styles.metaItemSkeleton} />
              </View>
              <View style={styles.descriptionContainer}>
                <ShimmerView style={styles.descriptionLine1} />
                <ShimmerView style={styles.descriptionLine2} />
                <ShimmerView style={styles.descriptionLine3} />
              </View>
              <View style={styles.heroButtons}>
                <ShimmerView style={styles.playButtonSkeleton} />
                <ShimmerView style={styles.infoButtonSkeleton} />
              </View>
              <View style={styles.heroIndicators}>
                {[...Array(5)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.heroIndicator,
                      index === 0 && styles.heroIndicatorActive
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </LinearGradient>
      </ShimmerView>
    </View>
  );
};

// Movie Card Skeleton
export const MovieCardSkeleton: React.FC = () => {
  return (
    <View style={styles.movieCard}>
      <ShimmerView style={styles.moviePoster} />
    </View>
  );
};

// Movie Slider Skeleton
export const MovieSliderSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderTitleContainer}>
          <ShimmerView style={styles.iconSkeleton} />
          {title ? (
            <View style={styles.titleSkeleton}>
              <ShimmerView style={styles.titleTextSkeleton} />
            </View>
          ) : (
            <ShimmerView style={styles.titleTextSkeleton} />
          )}
        </View>
        <ShimmerView style={styles.viewAllSkeleton} />
      </View>
      <View style={styles.moviesList}>
        {[...Array(5)].map((_, index) => (
          <MovieCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

// Platform Card Skeleton
export const PlatformCardSkeleton: React.FC = () => {
  return (
    <View style={styles.platformCard}>
      <ShimmerView style={styles.platformLogo} />
      <ShimmerView style={styles.platformName} />
    </View>
  );
};

// Platform Slider Skeleton
export const PlatformSliderSkeleton: React.FC = () => {
  return (
    <View style={styles.platformSliderContainer}>
      <View style={styles.platformHeader}>
        <ShimmerView style={styles.platformIconSkeleton} />
        <ShimmerView style={styles.platformTitleSkeleton} />
      </View>
      <View style={styles.platformsList}>
        {[...Array(6)].map((_, index) => (
          <PlatformCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

// Content Section Skeleton
export const ContentSectionSkeleton: React.FC = () => {
  return (
    <View style={styles.contentSection}>
      {/* Hero Skeleton */}
      <HeroSkeleton />
      
      {/* Platform Slider Skeleton */}
      <PlatformSliderSkeleton />
      
      {/* Movie Sliders Skeleton */}
      {[...Array(8)].map((_, index) => (
        <MovieSliderSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Hero Skeleton Styles
  heroContainer: {
    height: screenHeight * 0.75,
  },
  heroBackground: {
    flex: 1,
    backgroundColor: '#222',
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
    paddingTop: 70,
  },
  logoSkeleton: {
    width: 100,
    height: 24,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  profileSkeleton: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  heroBottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  badgeSkeleton: {
    width: 100,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 12,
  },
  titleSkeleton: {
    width: '80%',
    height: 32,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItemSkeleton: {
    width: 60,
    height: 14,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLine1: {
    width: '100%',
    height: 14,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 6,
  },
  descriptionLine2: {
    width: '90%',
    height: 14,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 6,
  },
  descriptionLine3: {
    width: '70%',
    height: 14,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  heroButtons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  playButtonSkeleton: {
    width: 120,
    height: 44,
    backgroundColor: '#333',
    borderRadius: 6,
    marginRight: 12,
  },
  infoButtonSkeleton: {
    width: 100,
    height: 44,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  heroIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  heroIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
    marginHorizontal: 3,
  },
  heroIndicatorActive: {
    backgroundColor: '#555',
    width: 20,
  },

  // Movie Slider Skeleton Styles
  sliderContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    backgroundColor: '#333',
    borderRadius: 4,
    marginRight: 12,
  },
  titleTextSkeleton: {
    width: 150,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  viewAllSkeleton: {
    width: 60,
    height: 16,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  moviesList: {
    flexDirection: 'row',
    gap: 12,
  },
  movieCard: {
    width: 120,
    height: 180,
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
  },

  // Platform Slider Skeleton Styles
  platformSliderContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformIconSkeleton: {
    width: 24,
    height: 24,
    backgroundColor: '#333',
    borderRadius: 4,
    marginRight: 12,
  },
  platformTitleSkeleton: {
    width: 200,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  platformsList: {
    flexDirection: 'row',
    gap: 16,
  },
  platformCard: {
    alignItems: 'center',
    width: 80,
  },
  platformLogo: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 30,
    marginBottom: 8,
  },
  platformName: {
    width: 50,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 2,
  },

  // Content Section Skeleton Styles
  contentSection: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default {
  HeroSkeleton,
  MovieCardSkeleton,
  MovieSliderSkeleton,
  PlatformCardSkeleton,
  PlatformSliderSkeleton,
  ContentSectionSkeleton,
};
