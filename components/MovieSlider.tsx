
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView
} from 'react-native';
import { TMDbContentCard } from './TMDbContentCard';
import { TMDbMovie, TMDbTVShow } from '../services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = 140;
const CARD_MARGIN = 10;

interface MovieSliderProps {
  title: string;
  data: (TMDbMovie | TMDbTVShow)[];
  onContentPress: (item: TMDbMovie | TMDbTVShow) => void;
  showRankings?: boolean;
  onViewAll?: () => void;
}

export function MovieSlider({ 
  title, 
  data, 
  onContentPress, 
  showRankings = false,
  onViewAll 
}: MovieSliderProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(data.length > 2);

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const maxScrollX = (data.length * (CARD_WIDTH + CARD_MARGIN * 2)) - screenWidth;
    
    setShowLeftArrow(scrollX > 20);
    setShowRightArrow(scrollX < maxScrollX - 20);
  };

  const scrollLeft = () => {
    scrollViewRef.current?.scrollTo({
      x: Math.max(0, -CARD_WIDTH * 2),
      animated: true
    });
  };

  const scrollRight = () => {
    scrollViewRef.current?.scrollTo({
      x: CARD_WIDTH * 2,
      animated: true
    });
  };

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF453A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Slider Container */}
      <View style={styles.sliderContainer}>
        {/* Left Arrow */}
        {showLeftArrow && (
          <TouchableOpacity style={[styles.arrow, styles.leftArrow]} onPress={scrollLeft}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Content Slider */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {data.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.cardContainer}>
              {showRankings && (
                <View style={styles.rankingContainer}>
                  <Text style={[
                    styles.rankingText,
                    index < 3 && styles.topThreeRanking
                  ]}>
                    {index + 1}
                  </Text>
                </View>
              )}
              <TMDbContentCard
                content={item}
                type={determineMediaType(item)}
                onPress={() => onContentPress(item)}
                style={[
                  styles.card,
                  showRankings && styles.rankedCard
                ]}
              />
            </View>
          ))}
        </ScrollView>

        {/* Right Arrow */}
        {showRightArrow && (
          <TouchableOpacity style={[styles.arrow, styles.rightArrow]} onPress={scrollRight}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
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
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF453A',
    fontWeight: '600',
    marginRight: 4,
  },
  sliderContainer: {
    position: 'relative',
    height: 220,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  cardContainer: {
    position: 'relative',
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    marginLeft: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
  },
  rankedCard: {
    marginLeft: 25,
  },
  rankingContainer: {
    position: 'absolute',
    left: -25,
    top: 0,
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  rankingText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF453A',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  topThreeRanking: {
    color: '#FFD700',
    fontSize: 40,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftArrow: {
    left: 0,
  },
  rightArrow: {
    right: 0,
  },
});
