
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Content } from '../data/ottPlatforms';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ContentCardProps {
  content: Content;
  onPress: () => void;
}

export function ContentCard({ content, onPress }: ContentCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <ThemedView style={styles.card}>
        <Image source={{ uri: content.poster }} style={styles.poster} />
        <View style={styles.info}>
          <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
            {content.title}
          </ThemedText>
          <ThemedText style={styles.year}>{content.releaseYear}</ThemedText>
          <View style={styles.ratingContainer}>
            <ThemedText style={styles.rating}>⭐ {content.imdbRating}</ThemedText>
            <View style={[styles.typeBadge, { backgroundColor: content.type === 'movie' ? '#FF6B6B' : '#4ECDC4' }]}>
              <Text style={styles.typeText}>{content.type.toUpperCase()}</Text>
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
