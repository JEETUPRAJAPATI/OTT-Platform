
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoviePlatform, legitimateMoviePlatforms, movieCategories, externalMoviePlatforms } from '@/data/legitimateMoviePlatforms';
import { MoviePlatformCard } from './MoviePlatformCard';
import { downloadService } from '@/services/downloadService';

interface MoviePlatformBrowserProps {
  visible: boolean;
  onClose: () => void;
}

export function MoviePlatformBrowser({ visible, onClose }: MoviePlatformBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<MoviePlatform | null>(null);

  const filteredLegitimate = legitimateMoviePlatforms.filter(platform => {
    const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
    const matchesSearch = platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         platform.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredExternal = externalMoviePlatforms.filter(platform => {
    const matchesCategory = selectedCategory === 'all' || platform.category === selectedCategory;
    const matchesSearch = platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         platform.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlatformPress = async (platform: MoviePlatform) => {
    try {
      if (platform.id === 'internet-archive') {
        // Use existing Internet Archive integration
        setSelectedPlatform(platform);
        Alert.alert(
          'Search Movies',
          'Enter a movie title to search on Internet Archive',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Search',
              onPress: () => searchMovieOnPlatform(platform, 'default search')
            }
          ]
        );
      } else {
        // For external platforms, open directly in browser
        const { openBrowserAsync } = await import('expo-web-browser');
        await openBrowserAsync(platform.baseUrl, {
          presentationStyle: 'pageSheet',
          showTitle: true,
          showInRecents: true,
          dismissButtonStyle: 'done',
          toolbarColor: '#1a1a1a',
          controlsColor: '#fff',
          enableBarCollapsing: false
        });

        // Close the modal after opening browser
        onClose();
      }
    } catch (error) {
      console.error('Error opening platform:', error);
      Alert.alert('Error', 'Failed to open platform. Please try again.');
    }
  };

  const searchMovieOnPlatform = async (platform: MoviePlatform, movieTitle: string) => {
    if (platform.id === 'internet-archive') {
      setIsSearching(true);
      try {
        const result = await downloadService.searchInternetArchive(movieTitle);

        if (result.found && result.identifier) {
          const filesResult = await downloadService.getInternetArchiveFiles(result.identifier);

          if (filesResult.success && filesResult.files.length > 0) {
            Alert.alert(
              'Movie Found!',
              `Found "${result.title}" with ${filesResult.files.length} video file(s)`,
              [
                {
                  text: 'Stream',
                  onPress: () => streamMovie(filesResult.files[0].downloadUrl.replace('?download=1', ''))
                },
                {
                  text: 'Download',
                  onPress: () => downloadMovie(filesResult.files[0].downloadUrl)
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        } else {
          Alert.alert('Not Found', 'Movie not found on Internet Archive. Try a different title.');
        }
      } catch (error) {
        Alert.alert('Search Error', 'Failed to search for movie. Please try again.');
      } finally {
        setIsSearching(false);
      }
    } else {
      try {
        const searchUrl = `${platform.searchUrl}${encodeURIComponent(movieTitle)}`;
        const { openBrowserAsync } = await import('expo-web-browser');
        await openBrowserAsync(searchUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to open search page.');
      }
    }
  };

  const streamMovie = async (url: string) => {
    try {
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(url, {
        presentationStyle: 'fullScreen',
        enableBarCollapsing: false,
        dismissButtonStyle: 'done'
      });
      onClose();
    } catch (error) {
      Alert.alert('Stream Error', 'Failed to open movie for streaming.');
    }
  };

  const downloadMovie = async (url: string) => {
    try {
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(url);
      Alert.alert('Download Started', 'Movie download opened in browser.');
      onClose();
    } catch (error) {
      Alert.alert('Download Error', 'Failed to start download.');
    }
  };

  const handleQuickSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a movie title to search.');
      return;
    }

    Alert.alert(
      'Search Movie',
      `Search for "${searchQuery}" on which platform?`,
      [
        {
          text: 'Internet Archive',
          onPress: () => searchMovieOnPlatform(legitimateMoviePlatforms[0], searchQuery)
        },
        {
          text: 'All Platforms',
          onPress: () => searchOnAllPlatforms(searchQuery)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const searchOnAllPlatforms = async (movieTitle: string) => {
    Alert.alert(
      'Multi-Platform Search',
      'This will open search pages for the movie on multiple platforms in your browser.',
      [
        {
          text: 'Continue',
          onPress: async () => {
            const allPlatforms = [...filteredLegitimate, ...filteredExternal];
            const platformsToSearch = allPlatforms.slice(0, 3);
            for (const platform of platformsToSearch) {
              try {
                const searchUrl = `${platform.searchUrl}${encodeURIComponent(movieTitle)}`;
                const { openBrowserAsync } = await import('expo-web-browser');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await openBrowserAsync(searchUrl);
              } catch (error) {
                console.error(`Failed to open ${platform.name}`);
              }
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="film" size={24} color="#E50914" />
            </View>
            <View>
              <Text style={styles.title}>Movie Platforms</Text>
              <Text style={styles.subtitle}>Discover & Download Movies</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for movies..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleQuickSearch}>
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {movieCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.activeCategoryButton
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.activeCategoryText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.platformsList} showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerIcon}>
              <Ionicons name="information-circle" size={24} color="#4CAF50" />
            </View>
            <View style={styles.infoBannerContent}>
              <Text style={styles.infoBannerTitle}>Free Movie Access</Text>
              <Text style={styles.infoBannerText}>
                Access free, legal movies from archives and external platforms. Always respect copyright laws.
              </Text>
            </View>
          </View>

          {/* Archive Platforms Section */}
          {filteredLegitimate.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="library" size={24} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Archive Platforms</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>Legal</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Public domain movies and documentaries from digital archives
              </Text>
              
              <View style={styles.platformsGrid}>
                {filteredLegitimate.map((platform) => (
                  <MoviePlatformCard
                    key={platform.id}
                    platform={platform}
                    onPress={handlePlatformPress}
                  />
                ))}
              </View>
            </View>
          )}

          {/* External Platforms Section */}
          {filteredExternal.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="globe" size={24} color="#FF6B35" />
                  <Text style={styles.sectionTitle}>External Platforms</Text>
                </View>
                <View style={[styles.sectionBadge, styles.externalBadge]}>
                  <Text style={styles.sectionBadgeText}>External</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Browse movies directly on these external streaming platforms
              </Text>
              
              <View style={styles.platformsGrid}>
                {filteredExternal.map((platform) => (
                  <MoviePlatformCard
                    key={platform.id}
                    platform={platform}
                    onPress={handlePlatformPress}
                  />
                ))}
              </View>
            </View>
          )}

          {/* No Results */}
          {filteredLegitimate.length === 0 && filteredExternal.length === 0 && (
            <View style={styles.noResults}>
              <View style={styles.noResultsIcon}>
                <Ionicons name="film-outline" size={64} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.noResultsTitle}>No platforms found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search or category filter to find more platforms
              </Text>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <Ionicons name="refresh" size={20} color="#E50914" />
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(229,9,20,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(229,9,20,0.3)',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  categoriesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  activeCategoryButton: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
    fontWeight: '700',
  },
  platformsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)',
  },
  infoBannerIcon: {
    marginRight: 16,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoBannerText: {
    color: '#4CAF50',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sectionBadge: {
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.4)',
  },
  externalBadge: {
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderColor: 'rgba(255,107,53,0.4)',
  },
  sectionBadgeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  platformsGrid: {
    gap: 12,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsIcon: {
    marginBottom: 24,
  },
  noResultsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229,9,20,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.3)',
  },
  resetButtonText: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
