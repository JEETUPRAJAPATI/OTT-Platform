
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  ImageBackground,
  ScrollView 
} from 'react-native';
import { ThemedText } from './ThemedText';
import { TMDbMovie, TMDbTVShow } from '../services/tmdbApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SliderBannerProps {
  content: (TMDbMovie | TMDbTVShow)[];
  onContentPress: (item: TMDbMovie | TMDbTVShow) => void;
  onWatchNow?: (item: TMDbMovie | TMDbTVShow) => void;
}

export function SliderBanner({ content, onContentPress, onWatchNow }: SliderBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (content.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % content.length;
          flatListRef.current?.scrollToIndex({ 
            index: nextIndex, 
            animated: true 
          });
          return nextIndex;
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [content.length]);

  if (!content || content.length === 0) {
    return null;
  }

  const renderSliderItem = ({ item, index }: { item: TMDbMovie | TMDbTVShow, index: number }) => {
    const title = (item as any).title || (item as any).name;
    const backdropUrl = `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`;
    const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    return (
      <View style={styles.slideItem}>
        <ImageBackground
          source={{ uri: backdropUrl }}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
        >
          <View style={styles.overlay} />
          <View style={styles.contentContainer}>
            <View style={styles.leftContent}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badge}>NEW RELEASE</Text>
              </View>
              <ThemedText style={styles.slideTitle} numberOfLines={2}>
                {title}
              </ThemedText>
              <ThemedText style={styles.slideDescription} numberOfLines={3}>
                {item.overview}
              </ThemedText>
              <View style={styles.metadata}>
                <Text style={styles.year}>
                  {new Date((item as any).release_date || (item as any).first_air_date).getFullYear()}
                </Text>
                <Text style={styles.rating}>⭐ {item.vote_average.toFixed(1)}</Text>
                <Text style={styles.type}>
                  {(item as any).title ? 'Movie' : 'TV Series'}
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.watchButton}
                  onPress={() => onWatchNow?.(item)}
                >
                  <Text style={styles.watchButtonText}>▶ Watch Now</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => onContentPress(item)}
                >
                  <Text style={styles.infoButtonText}>+ More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.rightContent}>
              <Image source={{ uri: posterUrl }} style={styles.posterImage} />
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={content}
        renderItem={renderSliderItem}
        keyExtractor={(item, index) => `slider-${item.id}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
      />
      
      {/* Pagination Indicators */}
      <View style={styles.pagination}>
        {content.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: screenHeight * 0.6,
    position: 'relative',
  },
  slideItem: {
    width: screenWidth,
    height: '100%',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    alignItems: 'flex-end',
  },
  leftContent: {
    flex: 1,
    paddingRight: 20,
  },
  rightContent: {
    width: 120,
  },
  badgeContainer: {
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#E50914',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  slideDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  year: {
    color: '#fff',
    fontSize: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rating: {
    color: '#fff',
    fontSize: 12,
    marginRight: 12,
  },
  type: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  watchButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#E50914',
    width: 20,
  },
});
