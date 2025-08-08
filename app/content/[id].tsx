
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  View, 
  Text, 
  Dimensions,
  FlatList,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tmdbService } from '@/services/tmdbApi';
import { userService } from '@/services/userService';
import { downloadService } from '@/services/downloadService';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { Footer } from '@/components/Footer';

const { width, height } = Dimensions.get('window');

export default function ContentDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'movie' | 'tv' }>();
  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [similarContent, setSimilarContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  useEffect(() => {
    if (id && type) {
      loadContentDetails();
    }
  }, [id, type]);

  const loadContentDetails = async () => {
    try {
      setIsLoading(true);
      const contentData = type === 'movie' 
        ? await tmdbService.getMovieDetails(parseInt(id))
        : await tmdbService.getTVShowDetails(parseInt(id));
      
      setContent(contentData);

      // Load similar content
      const similar = type === 'movie'
        ? await tmdbService.getSimilarMovies(parseInt(id))
        : await tmdbService.getSimilarTVShows(parseInt(id));
      
      setSimilarContent(similar.slice(0, 10));

      // Add to viewing history
      userService.addToHistory(
        parseInt(id),
        type,
        contentData.title || contentData.name,
        contentData.poster_path
      );
    } catch (error) {
      console.error('Error loading content details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchlistToggle = () => {
    const isInWatchlist = userService.isInWatchlist(parseInt(id), type);
    
    if (isInWatchlist) {
      userService.removeFromWatchlist(parseInt(id), type);
    } else {
      userService.addToWatchlist(
        parseInt(id),
        type,
        content.title || content.name,
        content.poster_path
      );
    }
  };

  const handleFavoriteToggle = () => {
    const isFavorite = userService.isFavorite(parseInt(id), type);
    
    if (isFavorite) {
      userService.removeFromFavorites(parseInt(id), type);
    } else {
      userService.addToFavorites(
        parseInt(id),
        type,
        content.title || content.name,
        content.poster_path
      );
    }
  };

  const handleDownload = (quality: 'low' | 'medium' | 'high') => {
    if (type === 'movie') {
      downloadService.addToDownloadQueue(
        parseInt(id),
        type,
        content.title,
        content.poster_path,
        quality
      );
      setShowDownloadModal(false);
      Alert.alert('Download Started', 'Your download has been added to the queue.');
    } else {
      // For TV shows, user needs to select season/episode
      Alert.alert(
        'Select Episode',
        'Please select a specific episode to download from the episodes list.'
      );
      setShowDownloadModal(false);
    }
  };

  const handleEpisodeDownload = (episodeId: number, seasonNumber: number, episodeNumber: number, episodeTitle: string) => {
    setShowDownloadModal(true);
    setSelectedEpisode({ episodeId, seasonNumber, episodeNumber, episodeTitle });
  };

  const confirmEpisodeDownload = (quality: 'low' | 'medium' | 'high') => {
    if (selectedEpisode) {
      downloadService.addToDownloadQueue(
        parseInt(id),
        'tv',
        `${content.name} - S${selectedEpisode.seasonNumber}E${selectedEpisode.episodeNumber}`,
        content.poster_path,
        quality,
        selectedEpisode.episodeId,
        selectedEpisode.seasonNumber,
        selectedEpisode.episodeNumber
      );
      setShowDownloadModal(false);
      setSelectedEpisode(null);
      Alert.alert('Download Started', 'Episode download has been added to the queue.');
    }
  };

  const handlePlay = () => {
    setShowPlayer(true);
    
    // Update continue watching
    userService.updateContinueWatching(
      parseInt(id),
      type,
      content.title || content.name,
      content.poster_path,
      Math.random() * 90 + 5 // Random progress between 5-95%
    );
  };

  const renderGenres = () => {
    if (!content?.genres) return null;
    
    return (
      <View style={styles.genresContainer}>
        {content.genres.map((genre: any) => (
          <View key={genre.id} style={styles.genreTag}>
            <Text style={styles.genreText}>{genre.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCast = () => {
    if (!content?.credits?.cast) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cast</Text>
        <FlatList
          horizontal
          data={content.credits.cast.slice(0, 10)}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.castItem}>
              <Image
                source={{
                  uri: tmdbService.getImageUrl(item.profile_path) || 'https://via.placeholder.com/100x150/333/fff?text=No+Image'
                }}
                style={styles.castImage}
              />
              <Text style={styles.castName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.castCharacter} numberOfLines={2}>{item.character}</Text>
            </View>
          )}
        />
      </View>
    );
  };

  const renderSeasons = () => {
    if (type !== 'tv' || !content?.seasons) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seasons</Text>
        <FlatList
          horizontal
          data={content.seasons}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.seasonItem}
              onPress={() => setSelectedSeason(item.season_number)}
            >
              <Image
                source={{
                  uri: tmdbService.getImageUrl(item.poster_path) || tmdbService.getImageUrl(content.poster_path) || 'https://via.placeholder.com/100x150/333/fff?text=Season'
                }}
                style={styles.seasonImage}
              />
              <Text style={styles.seasonTitle}>{item.name}</Text>
              <Text style={styles.seasonEpisodes}>{item.episode_count} episodes</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderSimilarContent = () => {
    if (!similarContent.length) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Similar {type === 'movie' ? 'Movies' : 'TV Shows'}</Text>
        <FlatList
          horizontal
          data={similarContent}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TMDbContentCard
              content={item}
              type={type}
              onPress={() => router.push(`/content/${item.id}?type=${type}`)}
              style={styles.similarItem}
            />
          )}
        />
      </View>
    );
  };

  const renderDownloadModal = () => (
    <Modal
      visible={showDownloadModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDownloadModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Quality</Text>
          <Text style={styles.modalSubtitle}>
            {selectedEpisode 
              ? `Download: ${selectedEpisode.episodeTitle}`
              : `Download: ${content?.title || content?.name}`
            }
          </Text>
          
          {downloadService.getQualityOptions().map((quality) => (
            <TouchableOpacity
              key={quality.value}
              style={styles.qualityOption}
              onPress={() => selectedEpisode ? confirmEpisodeDownload(quality.value) : handleDownload(quality.value)}
            >
              <View>
                <Text style={styles.qualityLabel}>{quality.label}</Text>
                <Text style={styles.qualityDetails}>{quality.resolution} • {quality.estimatedSize}</Text>
              </View>
              <Ionicons name="download-outline" size={24} color="#E50914" />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              setShowDownloadModal(false);
              setSelectedEpisode(null);
            }}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Content not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: tmdbService.getImageUrl(content.backdrop_path, 'w1280') || tmdbService.getImageUrl(content.poster_path, 'w500') || 'https://via.placeholder.com/400x600/333/fff?text=No+Image'
            }}
            style={styles.backdropImage}
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
            style={styles.gradient}
          >
            <View style={styles.heroContent}>
              <Image
                source={{
                  uri: tmdbService.getImageUrl(content.poster_path) || 'https://via.placeholder.com/200x300/333/fff?text=No+Image'
                }}
                style={styles.posterImage}
              />
              
              <View style={styles.contentInfo}>
                <Text style={styles.title}>{content.title || content.name}</Text>
                <Text style={styles.releaseDate}>
                  {new Date(content.release_date || content.first_air_date).getFullYear()}
                </Text>
                <Text style={styles.rating}>
                  ⭐ {content.vote_average.toFixed(1)}/10
                </Text>
                {renderGenres()}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowDownloadModal(true)}
          >
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleWatchlistToggle}>
            <Ionicons 
              name={userService.isInWatchlist(parseInt(id), type) ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleFavoriteToggle}>
            <Ionicons 
              name={userService.isFavorite(parseInt(id), type) ? "heart" : "heart-outline"} 
              size={24} 
              color="#E50914" 
            />
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{content.overview}</Text>
        </View>

        {renderCast()}
        {renderSeasons()}
        {renderSimilarContent()}
      </ScrollView>

      {showPlayer && (
        <VideoPlayer
          contentId={parseInt(id)}
          contentType={type}
          title={content.title || content.name}
          onClose={() => setShowPlayer(false)}
        />
      )}

      {renderDownloadModal()}

      <Footer
        onFavoritePress={() => {
          const favorites = userService.getFavorites();
          if (favorites.length > 0) {
            Alert.alert(
              `My Favorites (${favorites.length})`,
              'Your favorite movies and shows are saved in your profile.',
              [
                { text: 'View Profile', onPress: () => router.push('/(tabs)/profile') },
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert('No Favorites', 'You haven\'t added any favorites yet. Tap the heart icon on any content to add it to your favorites!');
          }
        }}
        onWatchlistPress={() => {
          const watchlist = userService.getWatchlist();
          if (watchlist.length > 0) {
            Alert.alert(
              `My Watchlist (${watchlist.length})`,
              'Your watchlist items are saved in your profile.',
              [
                { text: 'View Profile', onPress: () => router.push('/(tabs)/profile') },
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert('No Watchlist Items', 'You haven\'t added any items to your watchlist yet. Tap the bookmark icon on any content to add it!');
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  heroContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  contentInfo: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  releaseDate: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  genreText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  playButton: {
    flex: 1,
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  overview: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  castItem: {
    width: 80,
    marginRight: 12,
  },
  castImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  castName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  castCharacter: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  seasonItem: {
    width: 100,
    marginRight: 12,
  },
  seasonImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  seasonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  seasonEpisodes: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  similarItem: {
    marginRight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 12,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  qualityDetails: {
    fontSize: 14,
    color: '#999',
  },
  modalCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#999',
  },
});
