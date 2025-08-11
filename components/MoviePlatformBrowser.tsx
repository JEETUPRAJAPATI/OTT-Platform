
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
import { MoviePlatform, legitimateMoviePlatforms, movieCategories } from '@/data/legitimateMoviePlatforms';
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

  const filteredPlatforms = legitimateMoviePlatforms.filter(platform => {
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
        // For external platforms, open directly in browser without confirmation
        const { openBrowserAsync } = await import('expo-web-browser');
        await openBrowserAsync(platform.baseUrl, {
          presentationStyle: 'pageSheet',
          showTitle: true,
          showInRecents: true,
          dismissButtonStyle: 'done',
          toolbarColor: '#000000',
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
        // Use existing downloadService to search Internet Archive
        const result = await downloadService.searchInternetArchive(movieTitle);
        
        if (result.found && result.identifier) {
          const filesResult = await downloadService.getInternetArchiveFiles(result.identifier);
          
          if (filesResult.success && filesResult.files.length > 0) {
            // Show options to play or download
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
      // For other platforms, open their search page
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
    // This would search across multiple platforms
    // For now, just open search pages in sequence
    Alert.alert(
      'Multi-Platform Search',
      'This will open search pages for the movie on multiple platforms in your browser.',
      [
        {
          text: 'Continue',
          onPress: async () => {
            for (const platform of legitimateMoviePlatforms.slice(0, 3)) {
              try {
                const searchUrl = `${platform.searchUrl}${encodeURIComponent(movieTitle)}`;
                const { openBrowserAsync } = await import('expo-web-browser');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between opens
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
        <View style={styles.header}>
          <Text style={styles.title}>Movie Platforms</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for movies..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleQuickSearch}>
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoriesSection}>
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

        <ScrollView style={styles.platformsList}>
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.disclaimerText}>
              These platforms provide free, legal movie content. Always respect copyright and terms of service.
            </Text>
          </View>

          {filteredPlatforms.map((platform) => (
            <MoviePlatformCard
              key={platform.id}
              platform={platform}
              onPress={handlePlatformPress}
            />
          ))}

          {filteredPlatforms.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.noResultsText}>No platforms found</Text>
              <Text style={styles.noResultsSubtext}>Try adjusting your search or category filter</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 14,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  activeCategoryButton: {
    backgroundColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  platformsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  disclaimerText: {
    color: '#FF9800',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
