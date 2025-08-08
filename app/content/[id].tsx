import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { contentData, platforms } from '@/data/ottPlatforms';
import { Ionicons } from '@expo/vector-icons';

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showTrailer, setShowTrailer] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  const content = contentData.find(c => c.id === id);
  const platform = platforms.find(p => p.id === content?.platform);

  if (!content || !platform) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Content not found</ThemedText>
      </ThemedView>
    );
  }

  const handleDownload = () => {
    Alert.alert(
      'Download',
      `Download ${content.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => Linking.openURL(content.downloadUrl) }
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Sharing.shareAsync(`Check out ${content.title} on ${platform.name}!`, {
        dialogTitle: `Share ${content.title}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share content');
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const toggleSeason = (seasonNumber: number) => {
    setExpandedSeason(expandedSeason === seasonNumber ? null : seasonNumber);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {content.type === 'movie' ? 'Movie Details' : 'TV Show Details'}
        </ThemedText>
      </View>

      <ThemedView style={styles.content}>
        <View style={styles.posterContainer}>
          <Image source={{ uri: content.poster }} style={styles.poster} />
        </View>

        <ThemedView style={styles.info}>
          <ThemedText type="title" style={styles.title}>
            {content.title}
          </ThemedText>

          <View style={styles.metaInfo}>
            <ThemedText style={styles.year}>{content.releaseYear}</ThemedText>
            <ThemedText style={styles.rating}>⭐ {content.imdbRating}</ThemedText>
            <View style={[styles.typeBadge, { backgroundColor: platform.color }]}>
              <ThemedText style={styles.typeText}>{content.type.toUpperCase()}</ThemedText>
            </View>
          </View>

          <View style={styles.genreContainer}>
            {content.genre.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <ThemedText style={styles.genreText}>{genre}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedText style={styles.description}>
            {content.description}
          </ThemedText>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.downloadButton]} 
              onPress={handleDownload}
            >
              <ThemedText style={styles.buttonText}>📥 Download</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.shareButton]} 
              onPress={handleShare}
            >
              <ThemedText style={styles.buttonText}>🔗 Share</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.trailerButton, { backgroundColor: platform.color }]} 
              onPress={() => setShowTrailer(!showTrailer)}
            >
              <ThemedText style={styles.buttonText}>
                {showTrailer ? '❌ Close Trailer' : '▶️ Watch Trailer'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {showTrailer && (
            <View style={styles.trailerContainer}>
              <WebView
                source={{ uri: getYouTubeEmbedUrl(content.trailerUrl) }}
                style={styles.trailer}
                allowsFullscreenVideo
              />
            </View>
          )}

          {content.type === 'series' && content.seasons && (
            <ThemedView style={styles.seasonsContainer}>
              <ThemedText type="subtitle" style={styles.seasonsTitle}>
                Seasons & Episodes
              </ThemedText>
              {content.seasons.map((season) => (
                <View key={season.seasonNumber} style={styles.seasonContainer}>
                  <TouchableOpacity 
                    style={styles.seasonHeader}
                    onPress={() => toggleSeason(season.seasonNumber)}
                  >
                    <ThemedText style={styles.seasonTitle}>
                      Season {season.seasonNumber}
                    </ThemedText>
                    <ThemedText style={styles.episodeCount}>
                      {season.episodes.length} episodes
                    </ThemedText>
                    <ThemedText style={styles.expandIcon}>
                      {expandedSeason === season.seasonNumber ? '▼' : '▶'}
                    </ThemedText>
                  </TouchableOpacity>

                  {expandedSeason === season.seasonNumber && (
                    <View style={styles.episodesList}>
                      {season.episodes.map((episode) => (
                        <View key={episode.id} style={styles.episodeItem}>
                          <ThemedText style={styles.episodeNumber}>
                            {episode.episodeNumber}.
                          </ThemedText>
                          <View style={styles.episodeInfo}>
                            <ThemedText style={styles.episodeTitle}>
                              {episode.title}
                            </ThemedText>
                            <ThemedText style={styles.episodeDescription}>
                              {episode.description}
                            </ThemedText>
                            <ThemedText style={styles.episodeDuration}>
                              {episode.duration}
                            </ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/favorite`)}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>Favorite</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/watchlist`)}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>Watchlist</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/settings`)}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>Settings</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/about`)}>
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>About</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/privacy`)}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>Privacy Policy</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/rating`)}>
          <Ionicons name="star-half-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>Rating</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/content/${id}/review`)}>
          <Ionicons name="create-outline" size={24} color="#fff" />
          <ThemedText style={styles.footerButtonText}>Review</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#000',
    height: 60,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  posterContainer: {
    width: '100%',
    height: 400,
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  info: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  year: {
    fontSize: 16,
    opacity: 0.7,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  genreText: {
    fontSize: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#28a745',
  },
  shareButton: {
    backgroundColor: '#007bff',
  },
  trailerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  trailerContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trailer: {
    height: 200,
  },
  seasonsContainer: {
    marginTop: 20,
  },
  seasonsTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
  },
  seasonContainer: {
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e9ecef',
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  episodeCount: {
    fontSize: 14,
    opacity: 0.7,
    marginRight: 10,
  },
  expandIcon: {
    fontSize: 16,
    color: '#007bff',
  },
  episodesList: {
    padding: 15,
  },
  episodeItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  episodeNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
    minWidth: 25,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  episodeDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
    lineHeight: 20,
  },
  episodeDuration: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerButton: {
    alignItems: 'center',
    padding: 5,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});