
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OTTPlatformCard } from './OTTPlatformCard';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.22;
const CARD_MARGIN = 14;

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface OTTPlatformSliderProps {
  title: string;
  providers: WatchProvider[];
  loading?: boolean;
  onProviderPress: (provider: WatchProvider) => void;
  onViewAll?: () => void;
  autoSlide?: boolean;
}

export function OTTPlatformSlider({ 
  title, 
  providers, 
  loading = false,
  onProviderPress, 
  onViewAll, 
  autoSlide = true
}: OTTPlatformSliderProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(providers.length > 4);

  // Auto-slide functionality
  useEffect(() => {
    if (autoSlide && providers.length > 4) {
      const interval = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          const maxIndex = Math.max(0, providers.length - 4);
          
          // If we've reached the end, go back to start
          const finalIndex = nextIndex > maxIndex ? 0 : nextIndex;
          
          try {
            flatListRef.current?.scrollToIndex({ 
              index: finalIndex, 
              animated: true 
            });
          } catch (error) {
            // Fallback to scrollToOffset if scrollToIndex fails
            const offset = finalIndex * (CARD_WIDTH + CARD_MARGIN);
            flatListRef.current?.scrollToOffset({ 
              offset, 
              animated: true 
            });
          }
          
          return finalIndex;
        });
      }, 5000); // Auto-slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoSlide, providers.length]);

  // Update scroll indicators based on current index
  useEffect(() => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < providers.length - 4);
  }, [currentIndex, providers.length]);

  const scrollLeft = () => {
    if (currentIndex > 0) {
      const newIndex = Math.max(0, currentIndex - 2);
      try {
        flatListRef.current?.scrollToIndex({ 
          index: newIndex, 
          animated: true 
        });
      } catch (error) {
        const offset = newIndex * (CARD_WIDTH + CARD_MARGIN);
        flatListRef.current?.scrollToOffset({ 
          offset, 
          animated: true 
        });
      }
      setCurrentIndex(newIndex);
    }
  };

  const scrollRight = () => {
    const maxIndex = Math.max(0, providers.length - 4);
    if (currentIndex < maxIndex) {
      const newIndex = Math.min(maxIndex, currentIndex + 2);
      try {
        flatListRef.current?.scrollToIndex({ 
          index: newIndex, 
          animated: true 
        });
      } catch (error) {
        const offset = newIndex * (CARD_WIDTH + CARD_MARGIN);
        flatListRef.current?.scrollToOffset({ 
          offset, 
          animated: true 
        });
      }
      setCurrentIndex(newIndex);
    }
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / (CARD_WIDTH + CARD_MARGIN));
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(229, 9, 20, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>🎬 {title}</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading streaming platforms...</Text>
          <Text style={styles.loadingSubtext}>Discovering the best content for you</Text>
        </View>
      </View>
    );
  }

  if (!providers || providers.length === 0) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(229, 9, 20, 0.15)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>🎬 {title}</Text>
            <Text style={styles.subtitle}>{providers.length} platforms available</Text>
          </View>
          {onViewAll && (
            <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#E50914" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.sliderContainer}>
        {/* Left Arrow */}
        {canScrollLeft && (
          <TouchableOpacity 
            style={[styles.arrow, styles.leftArrow]} 
            onPress={scrollLeft}
          >
            <LinearGradient
              colors={['#E50914', '#B00710']}
              style={styles.arrowGradient}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {/* Platform Slider */}
        <FlatList
          ref={flatListRef}
          data={providers}
          renderItem={({ item }) => (
            <OTTPlatformCard
              provider={item}
              onPress={onProviderPress}
            />
          )}
          keyExtractor={(item) => `provider-${item.provider_id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              try {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              } catch (error) {
                // Fallback to scrollToOffset
                const offset = info.index * (CARD_WIDTH + CARD_MARGIN);
                flatListRef.current?.scrollToOffset({ offset, animated: true });
              }
            });
          }}
        />
        
        {/* Right Arrow */}
        {canScrollRight && (
          <TouchableOpacity 
            style={[styles.arrow, styles.rightArrow]} 
            onPress={scrollRight}
          >
            <LinearGradient
              colors={['#E50914', '#B00710']}
              style={styles.arrowGradient}
            >
              <Ionicons name="chevron-forward" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Indicators */}
      {providers.length > 4 && (
        <View style={styles.indicatorContainer}>
          {Array.from({ length: Math.ceil(providers.length / 4) }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                Math.floor(currentIndex / 4) === index && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  viewAll: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  sliderContainer: {
    position: 'relative',
  },
  contentContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 5,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: 44,
    height: 44,
    marginTop: -22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  arrowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  leftArrow: {
    left: 8,
  },
  rightArrow: {
    right: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
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
    width: 24,
  },
});
