
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, View, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function DiscoverScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [content, setContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'trending', name: 'Trending', icon: '🔥', color: '#FF6B6B' },
    { id: 'hindi', name: 'Hindi Movies', icon: '🇮🇳', color: '#4ECDC4' },
    { id: 'south', name: 'South Indian', icon: '🎬', color: '#45B7D1' },
    { id: 'marvel', name: 'Marvel', icon: '🦸', color: '#96CEB4' },
    { id: 'thriller2025', name: 'Thrillers 2025', icon: '😱', color: '#FFEAA7' },
    { id: 'toprated', name: 'Top Rated', icon: '⭐', color: '#DDA0DD' },
    { id: 'popular', name: 'Popular', icon: '👥', color: '#98D8C8' },
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
        return 'Best of Bollywood cinema';
      case 'south':
        return 'Tamil, Telugu, Malayalam & Kannada cinema';
      case 'marvel':
        return 'Marvel Cinematic Universe collection';
      case 'thriller2025':
        return 'Latest spine-chilling thrillers';
      case 'toprated':
        return 'Highest rated movies and shows';
      case 'popular':
        return 'Most popular content worldwide';
      default:
        return 'Discover amazing content';
    }
  };

  const getSelectedCategory = () => {
    return categories.find(c => c.id === selectedCategory);
  };

  const renderContentItem = ({ item, index }: { item: any, index: number }) => {
    const mediaType = determineMediaType(item);
    return (
      <View style={[styles.contentItem, { width: cardWidth }]}>
        <TMDbContentCard
          content={item}
          type={mediaType}
          onPress={() => handleContentPress(item)}
          style={styles.card}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Discover
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Explore content by category
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && [
                    styles.activeCategoryCard,
                    { backgroundColor: category.color }
                  ]
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <ThemedText style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText
                ]}>
                  {category.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Category Info */}
        <View style={styles.categoryInfoSection}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryTitleContainer}>
              <Text style={styles.categoryDisplayIcon}>
                {getSelectedCategory()?.icon}
              </Text>
              <View>
                <ThemedText style={styles.categoryTitle}>
                  {getSelectedCategory()?.name}
                </ThemedText>
                <ThemedText style={styles.categoryDescription}>
                  {getCategoryDescription(selectedCategory)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.contentCount}>
              <ThemedText style={styles.contentCountText}>
                {content.length}
              </ThemedText>
              <ThemedText style={styles.contentCountLabel}>
                items
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Content Grid */}
        <View style={styles.contentSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <Ionicons name="refresh" size={32} color="#E50914" />
              </View>
              <ThemedText style={styles.loadingText}>
                Loading {getSelectedCategory()?.name.toLowerCase()}...
              </ThemedText>
            </View>
          ) : content.length > 0 ? (
            <FlatList
              data={content}
              renderItem={renderContentItem}
              keyExtractor={(item) => `${item.id}-${determineMediaType(item)}`}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={48} color="#666" />
              <ThemedText style={styles.emptyText}>
                No content available
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Try selecting a different category
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#111',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  categoriesSection: {
    paddingVertical: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 100,
  },
  activeCategoryCard: {
    borderColor: 'transparent',
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  activeCategoryText: {
    color: '#000',
  },
  categoryInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDisplayIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#999',
    maxWidth: 200,
  },
  contentCount: {
    alignItems: 'center',
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  contentCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentCountLabel: {
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  contentGrid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  contentItem: {
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
