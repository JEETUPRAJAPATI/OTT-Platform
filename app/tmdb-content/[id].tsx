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
  Modal,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';
import { downloadService } from '@/services/downloadService';
import { userService } from '@/services/userService';
import { apiService } from '@/services/apiService';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { VideoPlayer } from '@/components/VideoPlayer';
import { MovieDownloader } from '@/components/MovieDownloader';

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
  const { id, type } = useLocalSearchParams(); // Assuming type is passed or inferred
  const router = useRouter();
  const [content, setContent] = useState<TMDbContent | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [recommendations, setRecommendations] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [internetArchiveUrl, setInternetArchiveUrl] = useState<string | null>(null);
  const [isCheckingArchive, setIsCheckingArchive] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [downloadError, setDownloadError] = useState<string>('');
  const [showMovieDownloader, setShowMovieDownloader] = useState(false);

  useEffect(() => {
    if (id && type) {
      loadContent();
      checkFavoriteStatus();
      checkWatchlistStatus();
      checkDownloadStatus();
      checkInternetArchiveAvailability();
    }
  }, [id, type]);

  const loadContent = async () => {
    try {
      setLoading(true);
      let contentData;
      let creditsData;
      let videosData;

      if (type === 'movie') {
        contentData = await tmdbService.getMovieDetails(Number(id));
        creditsData = await tmdbService.getMovieCredits(Number(id));
        videosData = await tmdbService.getMovieVideos(Number(id));
      } else if (type === 'tv') {
        contentData = await tmdbService.getTVShowDetails(Number(id));
        creditsData = await tmdbService.getTVCredits(Number(id));
        videosData = await tmdbService.getTVVideos(Number(id));
      } else {
        throw new Error('Invalid content type');
      }

      console.log('Content loaded:', contentData);
      setContent(contentData);
      setCast(creditsData.cast.slice(0, 10));
      setVideos(videosData.results.filter((video: Video) =>
        video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      ).slice(0, 3));

    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  const checkDownloadStatus = async () => {
    if (id) {
      const downloaded = downloadService.isDownloaded(Number(id), type as 'movie' | 'tv');
      setIsDownloaded(downloaded);
      
      // Check if there's an active download for this content
      const downloadInfo = downloadService.getDownloadInfo(Number(id), type as 'movie' | 'tv');
      if (downloadInfo && (downloadInfo.status === 'downloading' || downloadInfo.status === 'pending')) {
        setActiveDownloadId(downloadInfo.id);
        setDownloadProgress(downloadInfo.progress);
        
        // Set up progress callback
        downloadService.setProgressCallback(downloadInfo.id, (progress) => {
          setDownloadProgress(progress);
          if (progress >= 100) {
            setIsDownloaded(true);
            setActiveDownloadId(null);
            setDownloadError('');
            Alert.alert('Success', `${(content as any).title || (content as any).name} downloaded successfully!`);
          }
        });
      }
    }
  };

  const checkInternetArchiveAvailability = async () => {
    if (!content || !id) return;
    
    setIsCheckingArchive(true);
    try {
      const title = (content as any).title || (content as any).name;
      const year = content.release_date ? new Date(content.release_date).getFullYear() : 
                  (content as any).first_air_date ? new Date((content as any).first_air_date).getFullYear() : '';
      
      // Common Internet Archive URL patterns
      const searchQueries = [
        `${title} ${year}`,
        title.replace(/[^a-zA-Z0-9 ]/g, ''),
        `${title} ${year} movie`,
        title.toLowerCase().replace(/\s+/g, '-')
      ];
      
      // Try different archive.org patterns
      const archivePatterns = [
        `https://archive.org/download/${title.toLowerCase().replace(/\s+/g, '-')}-${year}/${title.toLowerCase().replace(/\s+/g, '-')}-${year}.mp4`,
        `https://archive.org/download/${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}-${year}/${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}.mp4`,
        `https://archive.org/download/${title.toLowerCase().replace(/\s+/g, '.')}.${year}/${title.toLowerCase().replace(/\s+/g, '.')}.${year}.mp4`,
        `https://archive.org/download/movies-${year}/${title.toLowerCase().replace(/\s+/g, '-')}.mp4`
      ];
      
      // Check if any of these URLs exist
      for (const url of archivePatterns) {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok && response.headers.get('content-type')?.includes('video')) {
            setInternetArchiveUrl(url);
            break;
          }
        } catch (error) {
          // Continue to next URL
        }
      }
    } catch (error) {
      console.error('Error checking Internet Archive:', error);
    } finally {
      setIsCheckingArchive(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (id) {
      const favorited = await apiService.isFavorite(id as string);
      setIsFavorited(favorited);
    }
  };

  const checkWatchlistStatus = async () => {
    if (id) {
      const watchlisted = await apiService.isInWatchlist(id as string);
      setIsWatchlisted(watchlisted);
    }
  };

  const handleDownload = async () => {
    if (!content || !id) return;

    try {
      if (isDownloaded) {
        const downloadInfo = downloadService.getDownloadInfo(Number(id), type as 'movie' | 'tv');
        if (downloadInfo) {
          downloadService.deleteDownload(downloadInfo.id);
          setIsDownloaded(false);
          Alert.alert('Success', 'Removed from downloads');
        }
      } else if (activeDownloadId) {
        // Handle pause/resume/cancel for active download
        const downloadInfo = downloadService.getDownloadInfo(Number(id), type as 'movie' | 'tv');
        if (downloadInfo) {
          Alert.alert(
            'Download in Progress',
            'What would you like to do with this download?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Pause', 
                onPress: () => {
                  downloadService.pauseDownload(downloadInfo.id);
                  setActiveDownloadId(null);
                }
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  downloadService.cancelDownload(downloadInfo.id);
                  setActiveDownloadId(null);
                  setDownloadProgress(0);
                }
              }
            ]
          );
        }
      } else {
        // Open MovieDownloader component for Internet Archive search and download
        setShowMovieDownloader(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to start download');
    }
  };

  const handleRetryDownload = () => {
    if (activeDownloadId) {
      downloadService.retryDownload(activeDownloadId);
      Alert.alert('Retry Started', 'Download has been restarted');
    }
  };

  const handleShare = async () => {
    if (!content) return;

    try {
      const title = (content as any).title || (content as any).name;
      const url = `https://www.themoviedb.org/${type}/${content.id}`;
      await Share.share({
        message: `Check out "${title}" on TMDb!`,
        url: url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!content || !id || !type) return;

    try {
      const title = (content as any).title || (content as any).name;
      if (isFavorited) {
        await apiService.removeFromFavorites(id as string);
        setIsFavorited(false);
        Alert.alert('Removed', 'Removed from your favorites');
      } else {
        await apiService.addToFavorites(
          id as string,
          title,
          content.poster_path,
          type as 'movie' | 'tv'
        );
        setIsFavorited(true);
        Alert.alert('Added', 'Added to your favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const toggleWatchlist = async () => {
    if (!content || !id || !type) return;

    try {
      const title = (content as any).title || (content as any).name;
      if (isWatchlisted) {
        await apiService.removeFromWatchlist(id as string);
        setIsWatchlisted(false);
        Alert.alert('Removed', 'Removed from your watchlist');
      } else {
        await apiService.addToWatchlist(
          id as string,
          title,
          content.poster_path,
          type as 'movie' | 'tv'
        );
        setIsWatchlisted(true);
        Alert.alert('Added', 'Added to your watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist');
    }
  };

  const playTrailer = (videoKey: string) => {
    setShowPlayer(true); // Trigger the modal to show the player
    // You might want to pass the videoKey to the VideoPlayer component
    // For now, we'll just open the modal
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

  const title = (content as any).title || (content as any).name;
  const releaseDate = (content as any).release_date || (content as any).first_air_date;
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
                    {(content as any).number_of_seasons && (
                      <Text style={styles.seasons}>
                        {(content as any).number_of_seasons} Season{((content as any).number_of_seasons) > 1 ? 's' : ''}
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
            style={[
              styles.secondaryButton, 
              isDownloaded && styles.downloadedButton,
              activeDownloadId && styles.downloadingButton
            ]}
            onPress={handleDownload}
          >
            {activeDownloadId ? (
              <>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
                </View>
                <Text style={styles.downloadProgressText}>
                  {downloadProgress}%
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={isDownloaded ? "checkmark-circle" : internetArchiveUrl ? "cloud-download" : "download"}
                  size={24}
                  color={isDownloaded ? "#4CAF50" : "#fff"}
                />
                <Text style={[
                  styles.secondaryButtonText,
                  isDownloaded && styles.downloadedButtonText
                ]}>
                  {isDownloaded ? 'Downloaded' : internetArchiveUrl ? 'Download HD' : 'Download'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {internetArchiveUrl && !isDownloaded && !activeDownloadId && (
            <View style={styles.archiveNotice}>
              <Ionicons name="information-circle" size={16} color="#4CAF50" />
              <Text style={styles.archiveNoticeText}>HD version available from Internet Archive</Text>
            </View>
          )}

          {isCheckingArchive && (
            <View style={styles.checkingArchive}>
              <Text style={styles.checkingArchiveText}>Checking for HD version...</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, isFavorited && styles.favoriteButtonActive]}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? "#E50914" : "#fff"}
            />
            <Text style={[styles.secondaryButtonText, isFavorited && styles.favoriteButtonTextActive]}>
              {isFavorited ? 'Favorited' : 'Favorite'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isWatchlisted && styles.watchlistButtonActive]}
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

            {(content as any).networks && (content as any).networks.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Network</Text>
                <Text style={styles.detailValue}>
                  {(content as any).networks.map(network => network.name).join(', ')}
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

        <Modal
          visible={showPlayer}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPlayer(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowPlayer(false)}>
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
              {/* Placeholder for VideoPlayer component */}
              <VideoPlayer videoKey={videos.length > 0 ? videos[0].key : ''} />
            </View>
          </SafeAreaView>
        </Modal>

        <MovieDownloader
          visible={showMovieDownloader}
          onClose={() => {
            setShowMovieDownloader(false);
            // Refresh download status after closing
            checkDownloadStatus();
          }}
          movieTitle={(content as any).title || (content as any).name}
          contentId={Number(id)}
          contentType={type as 'movie' | 'tv'}
          posterPath={content.poster_path || ''}
        />

        {/* Download Error and Retry */}
        {activeDownloadId && downloadService.getDownloadInfo(Number(id), type as 'movie' | 'tv')?.status === 'failed' && (
          <View style={styles.retryContainer}>
            <Text style={styles.errorMessage}>
              Download failed. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetryDownload}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.retryButtonText}>Retry Download</Text>
            </TouchableOpacity>
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
    flexWrap: 'wrap', // Allow wrapping for smaller screens
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1, // Occupy available space
    minWidth: 150, // Ensure a minimum width
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
    flex: 1, // Occupy available space
    minWidth: 120, // Ensure a minimum width
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
  favoriteButtonActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
  },
  favoriteButtonTextActive: {
    color: '#E50914',
  },
  watchlistButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Changed to green for consistency with download
  },
  watchlistButtonTextActive: {
    color: '#4CAF50', // Changed to green
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
  downloadingButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: '#4CAF50',
  },
  progressContainer: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  downloadProgressText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  archiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    alignSelf: 'center',
  },
  archiveNoticeText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
  },
  checkingArchive: {
    alignItems: 'center',
    marginTop: 8,
  },
  checkingArchiveText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  retryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorMessage: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
  },
});