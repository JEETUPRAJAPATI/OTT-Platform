
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { TMDbContentCard } from './TMDbContentCard';
import { TMDbMovie, TMDbTVShow } from '../services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.32;
const CARD_MARGIN = 12;

interface MovieSliderProps {
  title: string;
  icon: string;
  data: (TMDbMovie | TMDbTVShow)[];
  onContentPress: (item: TMDbMovie | TMDbTVShow) => void;
  onViewAll?: () => void;
  showRanking?: boolean;
  autoSlide?: boolean;
}

// Function to get badge color based on ranking
const getRankingBadgeColor = (rank: number) => {
  switch (rank) {
    case 1: return '#FFD700'; // Gold for #1
    case 2: return '#C0C0C0'; // Silver for #2
    case 3: return '#CD7F32'; // Bronze for #3
    default: return '#FF0000'; // Bright red for 4-10
  }
};

// Optimized item component to prevent re-renders
const MovieSliderItem = React.memo(({ 
  item, 
  index, 
  mediaType, 
  showRanking, 
  onContentPress 
}: {
  item: TMDbMovie | TMDbTVShow;
  index: number;
  mediaType: 'movie' | 'tv';
  showRanking: boolean;
  onContentPress: (item: TMDbMovie | TMDbTVShow) => void;
}) => (
  <View style={styles.itemWrapper}>
    {showRanking && (
      <View style={[
        styles.rankingBadge,
        { backgroundColor: getRankingBadgeColor(index + 1) }
      ]}>
        <Text style={styles.rankingNumber}>{index + 1}</Text>
      </View>
    )}
    <TMDbContentCard
      content={item}
      type={mediaType}
      onPress={() => onContentPress(item)}
      style={[
        styles.card,
        showRanking && styles.cardWithRank
      ]}
    />
  </View>
));

export function MovieSlider({ 
  title, 
  icon, 
  data, 
  onContentPress, 
  onViewAll, 
  showRanking = false,
  autoSlide = true
}: MovieSliderProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(data.length > 3);

  // Auto-slide functionality
  useEffect(() => {
    if (autoSlide && data.length > 3) {
      const interval = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          const maxIndex = Math.max(0, data.length - 3);
          
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
      }, 3000); // Auto-slide every 3 seconds

      return () => clearInterval(interval);
    }
  }, [autoSlide, data.length]);

  // Update scroll indicators based on current index
  useEffect(() => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < data.length - 3);
  }, [currentIndex, data.length]);

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
    const maxIndex = Math.max(0, data.length - 3);
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

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {icon} {title}
        </Text>
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
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Movie Slider */}
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={({ item, index }) => {
            const mediaType = (item as any).title ? 'movie' : 'tv';
            return (
              <MovieSliderItem 
                item={item}
                index={index}
                mediaType={mediaType}
                showRanking={showRanking}
                onContentPress={onContentPress}
              />
            );
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={5}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + CARD_MARGIN,
            offset: (CARD_WIDTH + CARD_MARGIN) * index,
            index,
          })}
          keyExtractor={(item, index) => `${title}-${item.id}-${index}`}
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
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
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
  itemWrapper: {
    marginRight: CARD_MARGIN,
    position: 'relative',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
  },
  cardWithRank: {
    // No margin adjustments to maintain proper ranking badge positioning
  },
  rankingBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 1)',
    elevation: 10,
  },
  rankingNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 1)',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  leftArrow: {
    left: 5,
  },
  rightArrow: {
    right: 5,
  },
});
