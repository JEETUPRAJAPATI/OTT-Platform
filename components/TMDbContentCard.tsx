import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TMDbMovie, TMDbTVShow, tmdbService } from '../services/tmdbApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface TMDbContentCardProps {
  content: TMDbMovie | TMDbTVShow;
  onPress: () => void;
  style?: any;
}

export const TMDbContentCard = React.memo(function TMDbContentCard({ content, onPress, style }: TMDbContentCardProps) {
  const title = (content as any).title || (content as any).name || 'Unknown Title';
  const releaseDate = (content as any).release_date || (content as any).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const posterUrl = tmdbService.getImageUrl(content.poster_path);
  const rating = content.vote_average || 0;

  // Determine content type based on TMDb data structure
  const type = (content as any).title ? 'movie' : 'tv';

  // Get rating color based on score
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return '#4CAF50'; // Green for excellent
    if (rating >= 7) return '#8BC34A'; // Light green for very good
    if (rating >= 6) return '#FFC107'; // Yellow for good
    if (rating >= 5) return '#FF9800'; // Orange for average
    return '#F44336'; // Red for poor
  };

  const handlePress = () => {
    // Determine content type based on TMDb data structure
    const contentType = (content as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${content.id}?type=${contentType}`);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      activeOpacity={0.8}
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

        {/* Bottom overlay with gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.overlay}
        >
          <View style={styles.bottomInfo}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.rating, { color: getRatingColor(rating) }]}>
                {rating.toFixed(1)}
              </Text>
            </View>
            <View style={styles.yearContainer}>
              <Text style={styles.year}>{year}</Text>
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
          {title}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>{year}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{type === 'movie' ? 'Movie' : 'Series'}</Text>
          {rating > 0 && (
            <>
              <View style={styles.dot} />
              <Text style={[styles.metaText, { color: getRatingColor(rating) }]}>
                ⭐ {rating.toFixed(1)}
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
    right: 8,
    gap: 6,
  },
  qualityBadge: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  qualityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
});