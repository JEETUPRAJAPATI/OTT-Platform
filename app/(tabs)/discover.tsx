
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, View, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [content, setContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'trending', name: 'Trending', icon: '🔥', color: '#E50914' },
    { id: 'hindi', name: 'Hindi Movies', icon: '🇮🇳', color: '#FF6B35' },
    { id: 'south', name: 'South Indian', icon: '🎭', color: '#4ECDC4' },
    { id: 'marvel', name: 'Marvel', icon: '🦸', color: '#FF4757' },
    { id: 'thriller2025', name: 'Thrillers 2025', icon: '😱', color: '#5F27CD' },
    { id: 'toprated', name: 'Top Rated', icon: '⭐', color: '#FFA502' },
    { id: 'popular', name: 'Popular', icon: '👥', color: '#3742FA' },
  ];

  useEffect(() => {
    loadCategoryContent(selectedCategory);
  }, [selectedCategory]);

  const loadCategoryContent = async (category: string) => {
    try {
      setLoading(true);
      let results: (TMDbMovie | TMDbTVShow)[] = [];

      switch (category) {
        case 'trending':
          results = await tmdbService.getTrending();
          break;
        case 'hindi':
          results = await tmdbService.getHindiMovies();
          break;
        case 'south':
          results = await tmdbService.getSouthIndianMovies();
          break;
        case 'marvel':
          results = await tmdbService.getMarvelMovies();
          break;
        case 'thriller2025':
          results = await tmdbService.getThrillerMovies2025();
          break;
        case 'toprated':
          results = await tmdbService.getTopRatedMovies();
          break;
        case 'popular':
          results = await tmdbService.getPopularMovies();
          break;
        default:
          results = await tmdbService.getTrending();
      }

      setContent(results);
    } catch (error) {
      console.error('Error loading category content:', error);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (contentItem: TMDbMovie | TMDbTVShow) => {
    const type = (contentItem as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${contentItem.id}?type=${type}`);
  };

  const determineMediaType = (item: any): 'movie' | 'tv' => {
    return item.title ? 'movie' : 'tv';
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'trending':
        return 'What\'s hot right now across all platforms';
      case 'hindi':
        return 'Latest and greatest from Bollywood';
      case 'south':
        return 'Tamil, Telugu, Malayalam & Kannada cinema';
      case 'marvel':
        return 'Marvel Cinematic Universe collection';
      case 'thriller2025':
        return 'Edge-of-your-seat thrillers from 2025';
      case 'toprated':
        return 'Highest rated content by critics and audiences';
      case 'popular':
        return 'Most watched movies worldwide';
      default:
        return 'Discover amazing content';
    }
  };

  const activeCategory = categories.find(c => c.id === selectedCategory);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.title}>
            Discover
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Explore content by category
          </ThemedText>
        </View>
      </LinearGradient>

      <ThemedView style={styles.content}>
        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && {
                    backgroundColor: category.color,
                    transform: [{ scale: 1.05 }],
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedCategory === category.id 
                    ? [category.color, `${category.color}DD`] 
                    : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.categoryGradient}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <ThemedText style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.activeCategoryText
                  ]}>
                    {category.name}
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Category Info */}
        <View style={styles.categoryInfoSection}>
          <LinearGradient
            colors={[`${activeCategory?.color}20`, 'transparent']}
            style={styles.categoryInfoCard}
          >
            <View style={styles.categoryInfoHeader}>
              <Text style={styles.categoryInfoIcon}>{activeCategory?.icon}</Text>
              <View style={styles.categoryInfoText}>
                <ThemedText style={styles.categoryInfoTitle}>
                  {activeCategory?.name}
                </ThemedText>
                <ThemedText style={styles.categoryInfoDescription}>
                  {getCategoryDescription(selectedCategory)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.categoryStats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{content.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Items</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>4.2</ThemedText>
                <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content Grid */}
        <View style={styles.contentSection}>
          <View style={styles.contentHeader}>
            <ThemedText style={styles.contentTitle}>
              {activeCategory?.name} Collection
            </ThemedText>
            <TouchableOpacity style={styles.shuffleButton}>
              <Ionicons name="shuffle" size={16} color="#fff" />
              <ThemedText style={styles.shuffleText}>Shuffle</ThemedText>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <LinearGradient
                colors={['#333', '#555', '#333']}
                style={styles.loadingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <ThemedText style={styles.loadingText}>Loading amazing content...</ThemedText>
            </View>
          ) : (
            <FlatList
              data={content}
              renderItem={({ item, index }) => {
                const mediaType = determineMediaType(item);
                return (
                  <View style={[styles.cardContainer, { 
                    opacity: 0,
                    transform: [{ translateY: 20 }],
                    // Simple fade-in animation would be added here
                  }]}>
                    <TMDbContentCard
                      content={item}
                      type={mediaType}
                      onPress={() => handleContentPress(item)}
                    />
                  </View>
                );
              }}
              keyExtractor={(item) => `${item.id}-${determineMediaType(item)}`}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoriesSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  categoriesScroll: {
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryCard: {
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  categoryGradient: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    minWidth: 120,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  activeCategoryText: {
    color: '#fff',
  },
  categoryInfoSection: {
    marginBottom: 25,
  },
  categoryInfoCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryInfoIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  categoryInfoText: {
    flex: 1,
  },
  categoryInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categoryInfoDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
  },
  contentSection: {
    marginBottom: 30,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  shuffleText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
  },
  cardContainer: {
    flex: 1,
    margin: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingGradient: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
});
