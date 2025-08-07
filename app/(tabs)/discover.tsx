
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

export default function DiscoverScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [content, setContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'trending', name: 'Trending', icon: '🔥' },
    { id: 'hindi', name: 'Hindi Movies', icon: '🇮🇳' },
    { id: 'south', name: 'South Indian', icon: '🎬' },
    { id: 'marvel', name: 'Marvel', icon: '🦸' },
    { id: 'thriller2025', name: 'Thrillers 2025', icon: '😱' },
    { id: 'toprated', name: 'Top Rated', icon: '⭐' },
    { id: 'popular', name: 'Popular', icon: '👥' },
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
        return 'What\'s hot right now';
      case 'hindi':
        return 'Best of Bollywood';
      case 'south':
        return 'Tamil, Telugu, Malayalam & Kannada cinema';
      case 'marvel':
        return 'Marvel Cinematic Universe';
      case 'thriller2025':
        return 'Latest thriller releases';
      case 'toprated':
        return 'Highest rated content';
      case 'popular':
        return 'Most popular movies';
      default:
        return 'Discover amazing content';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Discover
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Explore content by category
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.activeCategoryChip
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <ThemedText style={styles.categoryIcon}>{category.icon}</ThemedText>
                <ThemedText style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText
                ]}>
                  {category.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {categories.find(c => c.id === selectedCategory)?.name}
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            {getCategoryDescription(selectedCategory)}
          </ThemedText>
          
          {loading ? (
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          ) : (
            <FlatList
              data={content}
              renderItem={({ item }) => {
                const mediaType = determineMediaType(item);
                return (
                  <TMDbContentCard
                    content={item}
                    type={mediaType}
                    onPress={() => handleContentPress(item)}
                  />
                );
              }}
              keyExtractor={(item) => `${item.id}-${determineMediaType(item)}`}
              numColumns={2}
              contentContainerStyle={styles.contentGrid}
              scrollEnabled={false}
            />
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesScroll: {
    marginBottom: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
  },
  activeCategoryChip: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  contentGrid: {
    paddingBottom: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
});
