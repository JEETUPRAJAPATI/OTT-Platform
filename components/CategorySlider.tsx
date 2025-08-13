
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ImageBackground
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface Category {
  id: string;
  name: string;
  language?: string;
  country?: string;
  gradient: string[];
  image?: string;
}

interface CategorySliderProps {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
  selectedCategory: Category | null;
}

const categories: Category[] = [
  { 
    id: 'hindi', 
    name: 'Hindi', 
    language: 'hi', 
    gradient: ['#FF6B35', '#F7931E'],
    image: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg'
  },
  { 
    id: 'south', 
    name: 'South', 
    language: 'te|ta|ml|kn', 
    gradient: ['#667eea', '#764ba2'],
    image: 'https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg'
  },
  { 
    id: 'hollywood', 
    name: 'Hollywood', 
    country: 'US', 
    gradient: ['#f093fb', '#f5576c'],
    image: 'https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg'
  },
  { 
    id: 'tamil', 
    name: 'Tamil', 
    language: 'ta', 
    gradient: ['#4facfe', '#00f2fe'],
    image: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg'
  },
  { 
    id: 'telugu', 
    name: 'Telugu', 
    language: 'te', 
    gradient: ['#43e97b', '#38f9d7'],
    image: 'https://image.tmdb.org/t/p/w500/h8Rb9gBr48ODIwYUttZNYeMWeKs.jpg'
  },
  { 
    id: 'malayalam', 
    name: 'Malayalam', 
    language: 'ml', 
    gradient: ['#fa709a', '#fee140'],
    image: 'https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg'
  },
  { 
    id: 'kannada', 
    name: 'Kannada', 
    language: 'kn', 
    gradient: ['#a8edea', '#fed6e3'],
    image: 'https://image.tmdb.org/t/p/w500/xJHokMbljvjADYdit5fK5VQsXEG.jpg'
  },
  { 
    id: 'english', 
    name: 'English', 
    language: 'en', 
    gradient: ['#ff9a9e', '#fecfef'],
    image: 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg'
  },
];

export function CategorySlider({ onCategorySelect, selectedCategory }: Omit<CategorySliderProps, 'categories'>) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto scroll functionality
  useEffect(() => {
    const categoryPairsLength = Math.ceil(categories.length / 2);
    
    if (categoryPairsLength <= 1) return; // Don't auto-scroll if only one pair or less
    
    const interval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentIndex + 1) % categoryPairsLength;
        setCurrentIndex(nextIndex);
        
        // Use scrollToOffset instead of scrollToIndex for better reliability
        const offset = nextIndex * (screenWidth - 40);
        flatListRef.current.scrollToOffset({ 
          offset, 
          animated: true 
        });
      }
    }, 4000); // Auto scroll every 4 seconds

    return () => clearInterval(interval);
  }, [currentIndex, categories.length]);

  const renderCategoryPair = ({ item, index }: { item: Category, index: number }) => {
    const nextCategory = categories[index + 1];
    
    return (
      <View style={styles.categoryRow}>
        <CategoryCard 
          category={item} 
          onPress={() => onCategorySelect(item)}
          isSelected={selectedCategory?.id === item.id}
        />
        {nextCategory && (
          <CategoryCard 
            category={nextCategory} 
            onPress={() => onCategorySelect(nextCategory)}
            isSelected={selectedCategory?.id === nextCategory.id}
          />
        )}
      </View>
    );
  };

  const CategoryCard = ({ category, onPress, isSelected }: { 
    category: Category, 
    onPress: () => void,
    isSelected: boolean 
  }) => (
    <TouchableOpacity 
      style={[styles.categoryCard, isSelected && styles.selectedCard]} 
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: category.image }}
        style={styles.categoryBackground}
        imageStyle={styles.backgroundImage}
      >
        <View style={[styles.gradientOverlay, { 
          backgroundColor: `${category.gradient[0]}80` 
        }]}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  // Create pairs for 2-column layout
  const categoryPairs = categories.filter((_, index) => index % 2 === 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionIcon}>🎬</Text>
        <Text style={styles.title}>Browse by Category</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={categoryPairs}
        renderItem={renderCategoryPair}
        keyExtractor={(item, index) => `pair-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        snapToInterval={screenWidth - 40}
        decelerationRate="fast"
        pagingEnabled
        getItemLayout={(data, index) => ({
          length: screenWidth - 40,
          offset: (screenWidth - 40) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            try {
              if (flatListRef.current && info.index < categoryPairs.length) {
                flatListRef.current.scrollToIndex({ 
                  index: info.index, 
                  animated: true 
                });
              }
            } catch (error) {
              // Fallback to scrollToOffset
              const offset = info.index * (screenWidth - 40);
              flatListRef.current?.scrollToOffset({ 
                offset, 
                animated: true 
              });
            }
          });
        }}
        onMomentumScrollEnd={(event) => {
          const scrollX = event.nativeEvent.contentOffset.x;
          const index = Math.round(scrollX / (screenWidth - 40));
          setCurrentIndex(index);
        }}
      />
      
      {/* Page indicators */}
      <View style={styles.indicators}>
        {categoryPairs.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  sectionIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  categoryRow: {
    width: screenWidth - 40,
    flexDirection: 'column',
    gap: 12,
    paddingVertical: 5,
  },
  categoryCard: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#E50914',
    transform: [{ scale: 1.02 }],
  },
  categoryBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    borderRadius: 16,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeIndicator: {
    backgroundColor: '#E50914',
    width: 24,
  },
});
