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
const CARD_WIDTH = screenWidth * 0.16;
const CARD_MARGIN = 12;

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

        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  viewAll: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderContainer: {
    position: 'relative',
  },
  contentContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingVertical: 5,
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
  
});