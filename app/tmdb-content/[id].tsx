import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { downloadService } from '@/services/downloadService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type TMDbContent = TMDbMovie | TMDbTVShow;

interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface Video {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}

export default function TMDbContentDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [content, setContent] = useState<TMDbContent | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // Added state for favorite

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Determine if it's a movie or TV show and fetch accordingly
      const isMovie = !id.toString().includes('tv-');
      let contentData;
      let creditsData;
      let videosData;

      if (isMovie) {
        contentData = await tmdbService.getMovieDetails(Number(id));
        creditsData = await tmdbService.getMovieCredits(Number(id));
        videosData = await tmdbService.getMovieVideos(Number(id));
      } else {
        const tvId = id.toString().replace('tv-', '');
        contentData = await tmdbService.getTVShowDetails(Number(tvId));
        creditsData = await tmdbService.getTVCredits(Number(tvId));
        videosData = await tmdbService.getTVVideos(Number(tvId));
      }

      console.log('Content loaded:', contentData);
      setContent(contentData);
      setCast(creditsData.cast.slice(0, 10));
      setVideos(videosData.results.filter((video: Video) => 
        video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      ).slice(0, 3));

      // Check if downloaded
      const downloaded = await downloadService.isDownloaded(Number(id));
      setIsDownloaded(downloaded);

      // Check if favorited and watchlisted (Placeholder - actual API calls would go here)
      // For now, we'll just set them to false or default values
      setIsFavorite(false); // Replace with actual check
      setIsWatchlisted(false); // Replace with actual check

    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!content) return;

    try {
      if (isDownloaded) {
        await downloadService.removeDownload(content.id);
        setIsDownloaded(false);
        Alert.alert('Success', 'Removed from downloads');
      } else {
        await downloadService.addDownload({
          id: content.id,
          title: 'title' in content ? content.title : content.name,
          poster_path: content.poster_path,
          overview: content.overview,
          vote_average: content.vote_average,
          release_date: 'release_date' in content ? content.release_date : content.first_air_date,
          downloadedAt: new Date().toISOString(),
        });
        setIsDownloaded(true);
        Alert.alert('Success', 'Added to downloads');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update downloads');
    }
  };

  const handleShare = async () => {
    if (!content) return;

    try {
      const title = 'title' in content ? content.title : content.name;
      await Share.share({
        message: `Check out "${title}" on TMDb!`,
        url: `https://www.themoviedb.org/${'title' in content ? 'movie' : 'tv'}/${content.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!content) return;
    
    const accountId = 22206352; // Replace with actual account ID if available
    const sessionId = 'YOUR_SESSION_ID'; // Replace with actual session ID if available
    const isMovie = !id.toString().includes('tv-');

    try {
      if (isFavorite) {
        // Remove from favorites
        await tmdbService.removeFromFavorites(accountId, sessionId, content.id, isMovie ? 'movie' : 'tv');
        setIsFavorite(false);
        Alert.alert('Success', 'Removed from favorites');
      } else {
        // Add to favorites
        await tmdbService.addToFavorites(accountId, sessionId, content.id, isMovie ? 'movie' : 'tv');
        setIsFavorite(true);
        Alert.alert('Success', 'Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleWatchlist = async () => {
    if (!content) return;

    const accountId = 22206352; // Replace with actual account ID if available
    const sessionId = 'YOUR_SESSION_ID'; // Replace with actual session ID if available
    const isMovie = !id.toString().includes('tv-');

    try {
      if (isWatchlisted) {
        // Remove from watchlist
        await tmdbService.removeFromWatchlist(accountId, sessionId, content.id, isMovie ? 'movie' : 'tv');
        setIsWatchlisted(false);
        Alert.alert('Success', 'Removed from watchlist');
      } else {
        // Add to watchlist
        await tmdbService.addToWatchlist(accountId, sessionId, content.id, isMovie ? 'movie' : 'tv');
        setIsWatchlisted(true);
        Alert.alert('Success', 'Added to watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  const playTrailer = (videoKey: string) => {
    Alert.alert('Play Trailer', `Playing trailer: ${videoKey}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Content not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = 'title' in content ? content.title : content.name;
  const releaseDate = 'release_date' in content ? content.release_date : content.first_air_date;
  const posterUrl = content.poster_path 
    ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';
  const backdropUrl = content.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`
    : posterUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: backdropUrl }}
            style={styles.backdropImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)', '#000']}
              style={styles.heroGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Movie/TV Details</Text>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Content Info */}
              <View style={styles.heroContent}>
                <View style={styles.posterContainer}>
                  <Image source={{ uri: posterUrl }} style={styles.posterImage} />
                </View>

                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle} numberOfLines={2}>{title}</Text>

                  <View style={styles.metaInfo}>
                    <Text style={styles.year}>
                      {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
                    </Text>
                    <View style={styles.dot} />
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.rating}>
                        {content.vote_average ? content.vote_average.toFixed(1) : 'N/A'}
                      </Text>
                      <Text style={styles.voteCount}>
                        ({content.vote_count || 0} votes)
                      </Text>
                    </View>
                  </View>

                  {/* Runtime/Seasons info */}
                  <View style={styles.additionalInfo}>
                    {content.runtime && (
                      <Text style={styles.runtime}>
                        {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
                      </Text>
                    )}
                    {content.number_of_seasons && (
                      <Text style={styles.seasons}>
                        {content.number_of_seasons} Season{content.number_of_seasons > 1 ? 's' : ''}
                      </Text>
                    )}
                    {content.status && (
                      <Text style={styles.status}>{content.status}</Text>
                    )}
                  </View>

                  {/* Genres */}
                  {content.genres && content.genres.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.genresContainer}
                    >
                      {content.genres.map((genre) => (
                        <View key={genre.id} style={styles.genreChip}>
                          <Text style={styles.genreText}>{genre.name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, isDownloaded && styles.downloadedButton]}
            onPress={handleDownload}
          >
            <Ionicons 
              name={isDownloaded ? "checkmark-circle" : "download"} 
              size={24} 
              color={isDownloaded ? "#4CAF50" : "#fff"} 
            />
            <Text style={[
              styles.secondaryButtonText,
              isDownloaded && styles.downloadedButtonText
            ]}>
              {isDownloaded ? 'Downloaded' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, isWatchlisted && styles.watchlistButtonActive]} // Changed style to be conditional
            onPress={toggleWatchlist}
          >
            <Ionicons 
              name={isWatchlisted ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color="#fff" 
            />
            <Text style={[styles.secondaryButtonText, isWatchlisted && styles.watchlistButtonTextActive]}>
              {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{content.overview || 'No overview available.'}</Text>
        </View>

        {/* Movie Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            {content.budget && content.budget > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>
                  ${content.budget.toLocaleString()}
                </Text>
              </View>
            )}

            {content.revenue && content.revenue > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Revenue</Text>
                <Text style={styles.detailValue}>
                  ${content.revenue.toLocaleString()}
                </Text>
              </View>
            )}

            {content.original_language && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Original Language</Text>
                <Text style={styles.detailValue}>
                  {content.original_language.toUpperCase()}
                </Text>
              </View>
            )}

            {content.production_countries && content.production_countries.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Country</Text>
                <Text style={styles.detailValue}>
                  {content.production_countries.map(country => country.name).join(', ')}
                </Text>
              </View>
            )}

            {content.production_companies && content.production_companies.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Production</Text>
                <Text style={styles.detailValue}>
                  {content.production_companies.slice(0, 2).map(company => company.name).join(', ')}
                </Text>
              </View>
            )}

            {content.networks && content.networks.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Network</Text>
                <Text style={styles.detailValue}>
                  {content.networks.map(network => network.name).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Cast Section */}
        {cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.castContainer}
            >
              {cast.map((person) => (
                <TouchableOpacity key={person.id} style={styles.castMember}>
                  <Image
                    source={{
                      uri: person.profile_path
                        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                        : 'https://via.placeholder.com/100x150?text=No+Photo'
                    }}
                    style={styles.castImage}
                  />
                  <Text style={styles.castName} numberOfLines={2}>{person.name}</Text>
                  <Text style={styles.castCharacter} numberOfLines={2}>{person.character}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trailers & Videos</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.videosContainer}
            >
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoItem}
                  onPress={() => playTrailer(video.key)}
                >
                  <View style={styles.videoThumbnail}>
                    <Image
                      source={{
                        uri: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`
                      }}
                      style={styles.thumbnailImage}
                    />
                    <View style={styles.playOverlay}>
                      <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                    </View>
                  </View>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.name}</Text>
                  <Text style={styles.videoType}>{video.type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
    fontSize: 16,
    marginTop: 16,
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
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: screenHeight * 0.7,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  heroContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'flex-end',
    minHeight: 200,
  },
  posterContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  posterImage: {
    width: 130,
    height: 195,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  year: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  voteCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 4,
  },
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  runtime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seasons: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  status: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genresContainer: {
    marginTop: 8,
    maxHeight: 35,
  },
  genreChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  genreText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  downloadedButton: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  downloadedButtonText: {
    color: '#4CAF50',
  },
  favoriteButton: { // Added style for favorite button
    backgroundColor: '#333', // Default background
  },
  favoriteButtonActive: { // Style when favorited
    backgroundColor: '#E50914',
  },
  favoriteButtonTextActive: { // Style for text when favorited
    color: '#fff',
  },
  watchlistButton: { // Added style for watchlist button
    backgroundColor: '#333', // Default background
  },
  watchlistButtonActive: { // Style when watchlisted
    backgroundColor: '#4ECDC4',
  },
  watchlistButtonTextActive: { // Style for text when watchlisted
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  overview: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  castContainer: {
    paddingVertical: 8,
  },
  castMember: {
    width: 100,
    marginRight: 16,
    alignItems: 'center',
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  castName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  castCharacter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  videosContainer: {
    paddingVertical: 8,
  },
  videoItem: {
    width: 200,
    marginRight: 16,
  },
  videoThumbnail: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: 112,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  videoType: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});