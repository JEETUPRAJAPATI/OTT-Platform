
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TMDbMovie, TMDbTVShow, tmdbService } from '../services/tmdbApi';
import { LinearGradient } from 'expo-linear-gradient';

interface TMDbContentCardProps {
  content: TMDbMovie | TMDbTVShow;
  type: 'movie' | 'tv';
  onPress: () => void;
  style?: any;
}

export function TMDbContentCard({ content, onPress, type, style }: TMDbContentCardProps) {
  const title = type === 'movie' ? (content as TMDbMovie).title : (content as TMDbTVShow).name;
  const releaseDate = type === 'movie' 
    ? (content as TMDbMovie).release_date 
    : (content as TMDbTVShow).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const posterUrl = tmdbService.getImageUrl(content.poster_path);

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        {/* Overlay with gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {content.vote_average.toFixed(1)}</Text>
          </View>
        </LinearGradient>
        
        {/* Quality badge */}
        <View style={styles.qualityBadge}>
          <Text style={styles.qualityText}>HD</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.year}>{year}</Text>
          <View style={styles.dot} />
          <Text style={styles.type}>{type === 'movie' ? 'Movie' : 'Series'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
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
  ratingContainer: {
    alignSelf: 'flex-start',
  },
  rating: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  qualityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  year: {
    color: '#999',
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666',
    marginHorizontal: 6,
  },
  type: {
    color: '#999',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
