
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
  Animated,
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
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    loadContent();
    startAnimations();
  }, [id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Fetch content details
      const contentData = await tmdbService.getMovieDetails(Number(id));
      setContent(contentData);
      
      // Fetch cast
      const creditsData = await tmdbService.getMovieCredits(Number(id));
      setCast(creditsData.cast.slice(0, 10));
      
      // Fetch videos
      const videosData = await tmdbService.getMovieVideos(Number(id));
      setVideos(videosData.results.filter((video: Video) => 
        video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      ).slice(0, 3));
      
      // Check if downloaded
      const downloaded = await downloadService.isDownloaded(Number(id));
      setIsDownloaded(downloaded);
      
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

  const toggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    Alert.alert(
      'Watchlist',
      isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist'
    );
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
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000']}
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
                <Text style={styles.headerTitle}>Details</Text>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Content Info */}
              <Animated.View 
                style={[
                  styles.heroContent,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.posterContainer}>
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Image source={{ uri: posterUrl }} style={styles.posterImage} />
                  </Animated.View>
                  
                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.playButton]}
                      onPress={() => videos.length > 0 && playTrailer(videos[0].key)}
                    >
                      <Ionicons name="play" size={20} color="#fff" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={toggleWatchlist}
                    >
                      <Ionicons 
                        name={isWatchlisted ? "bookmark" : "bookmark-outline"} 
                        size={20} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={handleDownload}
                    >
                      <Ionicons 
                        name={isDownloaded ? "cloud-done" : "cloud-download-outline"} 
                        size={20} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{title}</Text>
                  
                  <View style={styles.metaInfo}>
                    <Text style={styles.year}>
                      {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
                    </Text>
                    <View style={styles.dot} />
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.rating}>
                        {content.vote_average.toFixed(1)} ({content.vote_count} votes)
                      </Text>
                    </View>
                  </View>

                  {/* Genres */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.genresContainer}
                  >
                    {content.genres?.map((genre) => (
                      <TouchableOpacity
                        key={genre.id}
                        style={[
                          styles.genreChip,
                          selectedGenre === genre.id && styles.genreChipSelected
                        ]}
                        onPress={() => setSelectedGenre(
                          selectedGenre === genre.id ? null : genre.id
                        )}
                      >
                        <Text style={[
                          styles.genreText,
                          selectedGenre === genre.id && styles.genreTextSelected
                        ]}>
                          {genre.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Main Action Buttons */}
        <Animated.View 
          style={[
            styles.actionButtonsContainer,
            { opacity: fadeAnim }
          ]}
        >
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
        </Animated.View>

        {/* Overview Section */}
        <Animated.View 
          style={[
            styles.section,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{content.overview}</Text>
        </Animated.View>

        {/* Cast Section */}
        {cast.length > 0 && (
          <Animated.View 
            style={[
              styles.section,
              { opacity: fadeAnim }
            ]}
          >
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
                  <Text style={styles.castName}>{person.name}</Text>
                  <Text style={styles.castCharacter}>{person.character}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <Animated.View 
            style={[
              styles.section,
              { opacity: fadeAnim }
            ]}
          >
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
                  <Text style={styles.videoTitle}>{video.name}</Text>
                  <Text style={styles.videoType}>{video.type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  heroContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  posterContainer: {
    alignItems: 'center',
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 12,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  playButton: {
    backgroundColor: '#E50914',
  },
  contentInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'flex-end',
  },
  contentTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 34,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  year: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  genresContainer: {
    marginTop: 8,
  },
  genreChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genreChipSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  genreText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  genreTextSelected: {
    color: '#fff',
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  downloadedButtonText: {
    color: '#4CAF50',
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
});
