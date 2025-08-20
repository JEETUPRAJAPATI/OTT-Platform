
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { TMDbMovie, TMDbTVShow, tmdbService } from '../services/tmdbApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ShareService } from '../services/shareService';
import { apiService } from '@/services/apiService';

interface TMDbContentCardProps {
  content: TMDbMovie | TMDbTVShow;
  type: 'movie' | 'tv';
  onPress: () => void;
  style?: any;
  showShareButton?: boolean;
}

// Helper function to get rating color based on score
const getRatingColor = (rating: number): string => {
  if (rating >= 8) return '#4CAF50'; // Green for excellent
  if (rating >= 7) return '#8BC34A'; // Light green for very good
  if (rating >= 6) return '#FFC107'; // Yellow for good
  if (rating >= 5) return '#FF9800'; // Orange for average
  return '#F44336'; // Red for poor
};

export const TMDbContentCard = React.memo(({ 
  content, 
  type, 
  onPress, 
  style, 
  showShareButton = false 
}: TMDbContentCardProps) => {
  // Add null checks to prevent undefined access
  if (!content || !content.id) {
    return (
      <View style={[styles.container, styles.errorCard, style]}>
        <Text style={styles.errorText}>Content unavailable</Text>
      </View>
    );
  }

  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { title, year, rating, posterUrl } = useMemo(() => {
    const titleValue = (content as any).title || (content as any).name || 'Unknown Title';
    const releaseDate = (content as any).release_date || (content as any).first_air_date;
    const yearValue = releaseDate ? new Date(releaseDate).getFullYear().toString() : 'N/A';
    const ratingValue = content.vote_average || 0;
    const posterUrlValue = content.poster_path
      ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
      : 'https://via.placeholder.com/300x450?text=No+Image';

    return {
      title: String(titleValue),
      year: String(yearValue),
      rating: ratingValue,
      posterUrl: posterUrlValue
    };
  }, [content]);

  useEffect(() => {
    const loadStatus = async (retryCount = 0) => {
      try {
        if (!content?.id) {
          console.error('No content ID available');
          return;
        }

        const contentId = String(content.id);
        const [favoriteStatus, watchlistStatus, savedStatus] = await Promise.all([
          apiService.isFavorite(contentId),
          apiService.isInWatchlist(contentId),
          apiService.isSaved(contentId)
        ]);
        
        setIsFavorite(favoriteStatus);
        setIsInWatchlist(watchlistStatus);
        setIsSaved(savedStatus);
      } catch (error) {
        console.error('Error loading status:', error);
        
        // Retry mechanism for loading status
        if (retryCount < 2) {
          console.log(`Retrying status load (attempt ${retryCount + 1})`);
          setTimeout(() => loadStatus(retryCount + 1), 1000);
        }
      }
    };
    
    loadStatus();
  }, [content.id]);

  const handleShare = useCallback(async (e: any) => {
    e.stopPropagation(); // Prevent triggering the onPress

    console.log('Share button clicked for:', title);

    try {
      const shareContent = ShareService.generateTMDbShareContent(content, type);
      console.log('Generated share content:', shareContent);
      ShareService.showShareOptions(shareContent);
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Could not share content');
    }
  }, [content, type, title]);

  const handleActionPress = async (action: 'favorite' | 'watchlist' | 'save', event?: any) => {
    if (event) {
      event.stopPropagation();
    }

    // Comprehensive validation
    if (!content || !content.id || !title || !type) {
      console.error('Invalid content data:', { content: !!content, id: content?.id, title, type });
      Alert.alert('Error', 'Invalid content data. Please try again.');
      return;
    }

    // Ensure we have valid data with proper type checking
    const contentId = String(content.id || '').trim();
    const contentTitle = String(title || '').trim();
    const posterPath = String(content.poster_path || '');
    const contentType = type as 'movie' | 'tv';
    
    if (!contentId || !contentTitle || contentId === 'undefined' || contentTitle === 'undefined') {
      console.error('Invalid content ID or title:', { contentId, contentTitle });
      Alert.alert('Error', 'Content ID and title are required. Please try again.');
      return;
    }

    if (!['movie', 'tv'].includes(contentType)) {
      console.error('Invalid content type:', contentType);
      Alert.alert('Error', 'Invalid content type. Please try again.');
      return;
    }

    const contentData = {
      contentId,
      title: contentTitle,
      posterPath,
      contentType,
    };

    console.log(`Attempting ${action} for content:`, contentData);

    // Prevent rapid consecutive clicks
    const currentTime = Date.now();
    const lastActionTime = (handleActionPress as any).lastActionTime || 0;
    if (currentTime - lastActionTime < 1000) {
      console.log('Action throttled - too frequent');
      return;
    }
    (handleActionPress as any).lastActionTime = currentTime;

    try {
      switch (action) {
        case 'favorite':
          if (isFavorite) {
            await apiService.removeFromFavorites(contentId);
            setIsFavorite(false);
            Alert.alert('✓ Removed', 'Removed from favorites', [{ text: 'OK' }]);
          } else {
            await apiService.addToFavorites(contentData);
            setIsFavorite(true);
            Alert.alert('✓ Added', 'Added to favorites', [{ text: 'OK' }]);
          }
          break;

        case 'watchlist':
          if (isInWatchlist) {
            await apiService.removeFromWatchlist(contentId);
            setIsInWatchlist(false);
            Alert.alert('✓ Removed', 'Removed from watchlist', [{ text: 'OK' }]);
          } else {
            await apiService.addToWatchlist(contentData);
            setIsInWatchlist(true);
            Alert.alert('✓ Added', 'Added to watchlist', [{ text: 'OK' }]);
          }
          break;

        case 'save':
          if (isSaved) {
            await apiService.removeFromSaved(contentId);
            setIsSaved(false);
            Alert.alert('✓ Removed', 'Removed from saved', [{ text: 'OK' }]);
          } else {
            await apiService.addToSaved(contentData);
            setIsSaved(true);
            Alert.alert('✓ Added', 'Added to saved', [{ text: 'OK' }]);
          }
          break;
      }
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
      
      // Reset the state in case of error
      switch (action) {
        case 'favorite':
          try {
            const actualState = await apiService.isFavorite(contentId);
            setIsFavorite(actualState);
          } catch (e) {
            console.error('Error checking favorite state:', e);
          }
          break;
        case 'watchlist':
          try {
            const actualState = await apiService.isInWatchlist(contentId);
            setIsInWatchlist(actualState);
          } catch (e) {
            console.error('Error checking watchlist state:', e);
          }
          break;
        case 'save':
          try {
            const actualState = await apiService.isSaved(contentId);
            setIsSaved(actualState);
          } catch (e) {
            console.error('Error checking saved state:', e);
          }
          break;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to ${action} item: ${errorMessage}`, [{ text: 'OK' }]);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={false}
      delayPressIn={0}
    >
      <View style={styles.imageContainer}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={32} color="#666" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Top badges */}
        <View style={styles.topBadges}>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>HD</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: type === 'movie' ? '#E50914' : '#4ECDC4' }]}>
            <Text style={styles.typeText}>{type === 'movie' ? 'MOVIE' : 'SERIES'}</Text>
          </View>
        </View>

        {/* Share button only if enabled */}
        {showShareButton && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom overlay with gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.overlay}
        >
          <View style={styles.bottomInfo}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: getRatingColor(rating) }]}>
                {Number(rating).toFixed(1)}
              </Text>
            </View>
            <View style={styles.yearContainer}>
              <Text style={styles.year}>{String(year)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Play button overlay */}
        <View style={styles.playButtonContainer}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {String(title)}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>{String(year)}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{type === 'movie' ? 'Movie' : 'Series'}</Text>
          {rating > 0 && (
            <>
              <View style={styles.dot} />
              <Text style={[styles.metaText, { color: getRatingColor(rating) }]}>
                ⭐ {Number(rating).toFixed(1)}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 2/3,
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 10,
    marginTop: 8,
  },
  topBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 6,
  },
  qualityBadge: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  qualityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 11,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  typeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  actionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
    gap: 6,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  rating: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  yearContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  year: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    opacity: 0.8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#999',
    fontSize: 11,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666',
    marginHorizontal: 6,
  },
  errorCard: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});
