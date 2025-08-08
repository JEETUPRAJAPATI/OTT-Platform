
import React, { useRef, useState } from 'react';
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
}

export function MovieSlider({ 
  title, 
  icon, 
  data, 
  onContentPress, 
  onViewAll, 
  showRanking = false 
}: MovieSliderProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(data.length > 3);

  const scrollLeft = () => {
    if (currentIndex > 0) {
      const newIndex = Math.max(0, currentIndex - 2);
      flatListRef.current?.scrollToIndex({ 
        index: newIndex, 
        animated: true 
      });
      setCurrentIndex(newIndex);
    }
  };

  const scrollRight = () => {
    if (currentIndex < data.length - 3) {
      const newIndex = Math.min(data.length - 3, currentIndex + 2);
      flatListRef.current?.scrollToIndex({ 
        index: newIndex, 
        animated: true 
      });
      setCurrentIndex(newIndex);
    }
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / (CARD_WIDTH + CARD_MARGIN));
    setCurrentIndex(index);
    setCanScrollLeft(index > 0);
    setCanScrollRight(index < data.length - 3);
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
              <View style={styles.itemWrapper}>
                {showRanking && (
                  <View style={styles.rankingBadge}>
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
            );
          }}
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
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
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
    marginTop: 20,
  },
  rankingBadge: {
    position: 'absolute',
    top: -15,
    left: -8,
    zIndex: 10,
    width: 32,
    height: 32,
    backgroundColor: '#E50914',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  rankingNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
