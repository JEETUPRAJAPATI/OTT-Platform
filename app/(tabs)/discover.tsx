
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, View, Dimensions, Text } from 'react-native';
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
    { id: 'trending', name: 'Trending', icon: '🔥', color: '#FF453A', description: 'What\'s hot right now' },
    { id: 'hindi', name: 'Hindi', icon: '🇮🇳', color: '#34C759', description: 'Bollywood cinema' },
    { id: 'south', name: 'South Indian', icon: '🎬', color: '#007AFF', description: 'Regional cinema' },
    { id: 'marvel', name: 'Marvel', icon: '🦸', color: '#FF9500', description: 'Superhero universe' },
    { id: 'thriller2025', name: 'Thriller', icon: '😱', color: '#AF52DE', description: 'Spine-chilling' },
    { id: 'toprated', name: 'Top Rated', icon: '⭐', color: '#FFD60A', description: 'Highest rated' },
    { id: 'popular', name: 'Popular', icon: '👥', color: '#32D74B', description: 'Most popular' },
    { id: 'action', name: 'Action', icon: '💥', color: '#FF6B35', description: 'High-octane' },
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
        case 'action':
          results = await tmdbService.getPopularMovies(); // Use popular as fallback for action
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
        <ThemedText style={styles.title}>
          Discover
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
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
                <View style={styles.categoryIconContainer}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                <ThemedText style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.activeCategoryName
                ]}>
                  {category.name}
                </ThemedText>
                <ThemedText style={[
                  styles.categoryDescription,
                  selectedCategory === category.id && styles.activeCategoryDescription
                ]}>
                  {category.description}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Category Header */}
        <View style={styles.categoryHeaderSection}>
          <View style={[styles.categoryHeaderCard, { borderLeftColor: getSelectedCategory()?.color }]}>
            <View style={styles.categoryHeaderContent}>
              <Text style={styles.categoryHeaderIcon}>
                {getSelectedCategory()?.icon}
              </Text>
              <View style={styles.categoryHeaderText}>
                <ThemedText style={styles.categoryHeaderTitle}>
                  {getSelectedCategory()?.name}
                </ThemedText>
                <ThemedText style={styles.categoryHeaderSubtitle}>
                  {getSelectedCategory()?.description}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.contentCountBadge, { backgroundColor: getSelectedCategory()?.color }]}>
              <ThemedText style={styles.contentCountText}>
                {content.length}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Content Grid */}
        <View style={styles.contentSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <Ionicons name="refresh" size={32} color="#FF453A" />
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
              <Ionicons name="library-outline" size={48} color="#8E8E93" />
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
    backgroundColor: '#1C1C1E',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: (width - 68) / 2,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  activeCategoryCard: {
    borderColor: 'transparent',
    transform: [{ scale: 1.02 }],
  },
  categoryIconContainer: {
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  activeCategoryName: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
  },
  activeCategoryDescription: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  categoryHeaderSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  categoryHeaderCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryHeaderIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryHeaderSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  contentCountBadge: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  contentCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderRadius: 12,
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
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
