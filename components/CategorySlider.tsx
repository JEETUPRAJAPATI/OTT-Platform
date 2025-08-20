
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
  native?: string;
  language?: string;
  country?: string;
  gradient?: string[];
  image: string;
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
    native: 'हिंदी',
    language: 'hi',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/6661/1526661-a-00b818b5bc0e'
  },
  {
    id: 'english',
    name: 'English',
    native: 'English',
    language: 'en',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1080/sources/r1/cms/prod/6660/1526660-a-afdd1ecfd8ae'
  },
  {
    id: 'tamil',
    name: 'Tamil',
    native: 'தமிழ்',
    language: 'ta',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1080/sources/r1/cms/prod/6682/1526682-a-fd4e220ba563'
  },
  {
    id: 'marathi',
    name: 'Marathi',
    native: 'मराठी',
    language: 'mr',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1200/sources/r1/cms/prod/6674/1526674-a-fdd5233a7699'
  },
  {
    id: 'kannada',
    name: 'Kannada',
    native: 'ಕನ್ನಡ',
    language: 'kn',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1080/sources/r1/cms/prod/8124/1714043448124-a'
  },
  {
    id: 'japanese',
    name: 'Japanese',
    native: '日本語',
    language: 'ja',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1200/sources/r1/cms/prod/9896/1750233039896-a'
  },
  {
    id: 'odia',
    name: 'Odia',
    native: 'ଓଡ଼ିଆ',
    language: 'or',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90,w_1080/sources/r1/cms/prod/8137/1498137-a-86c0b069edb0'
  },
  {
    id: 'telugu',
    name: 'Telugu',
    native: 'తెలుగు',
    language: 'te',
    image: 'https://img.hotstar.com/image/upload/f_auto,q_90/sources/r1/cms/prod/6685/1526685-a-5f5995a53f61'
  }
];

export function CategorySlider({ onCategorySelect, selectedCategory }: Omit<CategorySliderProps, 'categories'>) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto scroll functionality
  useEffect(() => {
    if (categories.length <= 1) return;
    
    const interval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentIndex + 1) % categories.length;
        setCurrentIndex(nextIndex);
        
        try {
          flatListRef.current.scrollToIndex({ 
            index: nextIndex, 
            animated: true,
            viewPosition: 0.5
          });
        } catch (error) {
          const offset = nextIndex * (screenWidth - 40);
          flatListRef.current.scrollToOffset({ 
            offset, 
            animated: true 
          });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, categories.length]);

  const renderCategory = ({ item, index }: { item: Category, index: number }) => (
    <CategoryCard 
      category={item} 
      onPress={() => onCategorySelect(item)}
      isSelected={selectedCategory?.id === item.id}
      index={index}
    />
  );

  const CategoryCard = ({ category, onPress, isSelected, index }: { 
    category: Category, 
    onPress: () => void,
    isSelected: boolean,
    index: number
  }) => (
    <TouchableOpacity 
      style={[
        styles.categoryCard,
        isSelected && styles.selectedCard,
        { marginLeft: index === 0 ? 20 : 12, marginRight: index === categories.length - 1 ? 20 : 0 }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: category.image }}
        style={styles.categoryBackground}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionIcon}>🎬</Text>
        <Text style={styles.title}>Browse by Category</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        snapToInterval={screenWidth}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            try {
              if (flatListRef.current && info.index < categories.length) {
                flatListRef.current.scrollToIndex({ 
                  index: info.index, 
                  animated: true 
                });
              }
            } catch (error) {
              const offset = info.index * (screenWidth * 0.7);
              flatListRef.current?.scrollToOffset({ 
                offset, 
                animated: true 
              });
            }
          });
        }}
        onMomentumScrollEnd={(event) => {
          const scrollX = event.nativeEvent.contentOffset.x;
          const index = Math.round(scrollX / (screenWidth * 0.7));
          setCurrentIndex(Math.max(0, Math.min(index, categories.length - 1)));
        }}
      />
      
      {/* Page indicators */}
      <View style={styles.indicators}>
        {categories.map((_, index) => (
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
    marginBottom: 15,
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
  contentContainer: {
    paddingVertical: 10,
  },
  categoryCard: {
    width: screenWidth * 0.9,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#E50914',
    transform: [{ scale: 1.05 }],
  },
  categoryBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    borderRadius: 16,
  },
  
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeIndicator: {
    backgroundColor: '#E50914',
    width: 20,
    height: 6,
    borderRadius: 3,
  },
});
