
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
import { OTTPlatformCard } from './OTTPlatformCard';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.25;
const CARD_MARGIN = 16;

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
      }, 4000); // Auto-slide every 4 seconds

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
        <View style={styles.header}>
          <Text style={styles.title}>🎬 {title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading platforms...</Text>
        </View>
      </View>
    );
  }

  if (!providers || providers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 {title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sliderContainer}>
        {/* Left Arrow */}
        {canScrollLeft && (
          <TouchableOpacity 
            style={[styles.arrow, styles.leftArrow]} 
            onPress={scrollLeft}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
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
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAll: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
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
    paddingVertical: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
  },
  leftArrow: {
    left: 5,
  },
  rightArrow: {
    right: 5,
  },
});
