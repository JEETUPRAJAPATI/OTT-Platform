
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Content } from '../data/ottPlatforms';

interface SliderBannerProps {
  content: Content[];
  onContentPress: (content: Content) => void;
}

export function SliderBanner({ content, onContentPress }: SliderBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const nextIndex = (currentIndex + 1) % content.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, content.length, screenWidth, fadeAnim]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        🔥 New Releases
      </ThemedText>
      
      <Animated.View style={[styles.sliderContainer, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.slider}
        >
          {content.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.slide, { width: screenWidth - 40 }]}
              onPress={() => onContentPress(item)}
            >
              <Image 
                source={{ uri: item.poster }} 
                style={styles.posterImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.overlay}
              >
                <View style={styles.contentInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.slideTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.slideYear}>
                    {item.releaseYear}
                  </ThemedText>
                  <View style={styles.slideMetadata}>
                    <ThemedText style={styles.slideRating}>
                      ⭐ {item.imdbRating}
                    </ThemedText>
                    <View style={[
                      styles.typeBadge, 
                      { backgroundColor: item.type === 'movie' ? '#FF6B6B' : '#4ECDC4' }
                    ]}>
                      <ThemedText style={styles.typeText}>
                        {item.type.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.slideDescription} numberOfLines={3}>
                    {item.description}
                  </ThemedText>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.pagination}>
        {content.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { 
                backgroundColor: index === currentIndex ? '#E50914' : '#ccc',
                width: index === currentIndex ? 20 : 8,
              }
            ]}
          />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
    marginLeft: 20,
    color: '#E50914',
  },
  sliderContainer: {
    height: 300,
    marginHorizontal: 10,
  },
  slider: {
    height: 300,
  },
  slide: {
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  slideYear: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  slideMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  slideRating: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  slideDescription: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
});
