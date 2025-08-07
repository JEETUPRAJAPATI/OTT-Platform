import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TMDbMovie, TMDbTVShow, tmdbService } from '../services/tmdbApi';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

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
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <ThemedView style={[styles.card, style]}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.placeholderPoster]}>
            <ThemedText style={styles.placeholderText}>No Image</ThemedText>
          </View>
        )}
        <View style={styles.info}>
          <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.year}>{year}</ThemedText>
          <View style={styles.ratingContainer}>
            <ThemedText style={styles.rating}>⭐ {content.vote_average.toFixed(1)}</ThemedText>
            <View style={[styles.typeBadge, { backgroundColor: type === 'movie' ? '#FF6B6B' : '#4ECDC4' }]}>
              <Text style={styles.typeText}>{type.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  poster: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholderPoster: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    opacity: 0.6,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});