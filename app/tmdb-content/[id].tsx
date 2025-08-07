
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Image, View, Alert, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { tmdbService, TMDbCast, TMDbVideo } from '@/services/tmdbApi';

export default function TMDbContentDetailsScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'movie' | 'tv' }>();
  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [cast, setCast] = useState<TMDbCast[]>([]);
  const [videos, setVideos] = useState<TMDbVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentDetails();
  }, [id, type]);

  const loadContentDetails = async () => {
    try {
      setLoading(true);
      const contentId = parseInt(id);
      
      let details;
      if (type === 'movie') {
        details = await tmdbService.getMovieDetails(contentId);
      } else {
        details = await tmdbService.getTVShowDetails(contentId);
      }
      
      setContent(details);
      setCast(details.credits?.cast?.slice(0, 10) || []);
      setVideos(details.videos?.results?.filter((v: TMDbVideo) => v.site === 'YouTube') || []);
    } catch (error) {
      console.error('Error loading content details:', error);
      Alert.alert('Error', 'Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  const openTrailer = (videoKey: string) => {
    const url = tmdbService.getYouTubeUrl(videoKey);
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!content) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>Content not found</ThemedText>
      </ThemedView>
    );
  }

  const title = type === 'movie' ? content.title : content.name;
  const releaseDate = type === 'movie' ? content.release_date : content.first_air_date;
  const posterUrl = tmdbService.getImageUrl(content.poster_path);
  const backdropUrl = tmdbService.getImageUrl(content.backdrop_path, 'w780');

  return (
    <ScrollView style={styles.container}>
      {backdropUrl && (
        <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
      )}
      
      <ThemedView style={styles.content}>
        <View style={styles.posterSection}>
          {posterUrl && (
            <Image source={{ uri: posterUrl }} style={styles.poster} />
          )}
          
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedText style={styles.releaseDate}>
              {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
            </ThemedText>
            <View style={styles.ratingContainer}>
              <ThemedText style={styles.rating}>
                ⭐ {content.vote_average?.toFixed(1)} ({content.vote_count} votes)
              </ThemedText>
            </View>
            <View style={styles.genresContainer}>
              {content.genres?.map((genre: any) => (
                <View key={genre.id} style={styles.genreTag}>
                  <ThemedText style={styles.genreText}>{genre.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Overview
          </ThemedText>
          <ThemedText style={styles.overview}>
            {content.overview || 'No overview available.'}
          </ThemedText>
        </ThemedView>

        {videos.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Trailers & Videos
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoItem}
                  onPress={() => openTrailer(video.key)}
                >
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${video.key}/mqdefault.jpg` }}
                    style={styles.videoThumbnail}
                  />
                  <ThemedText style={styles.videoTitle} numberOfLines={2}>
                    {video.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        )}

        {cast.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Cast
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cast.map((actor) => (
                <View key={actor.id} style={styles.castItem}>
                  {actor.profile_path ? (
                    <Image
                      source={{ uri: tmdbService.getImageUrl(actor.profile_path, 'w185') }}
                      style={styles.castImage}
                    />
                  ) : (
                    <View style={[styles.castImage, styles.placeholderImage]}>
                      <ThemedText style={styles.placeholderText}>👤</ThemedText>
                    </View>
                  )}
                  <ThemedText style={styles.actorName} numberOfLines={2}>
                    {actor.name}
                  </ThemedText>
                  <ThemedText style={styles.characterName} numberOfLines={2}>
                    {actor.character}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Details
          </ThemedText>
          {type === 'movie' && content.runtime && (
            <ThemedText style={styles.detailText}>
              Runtime: {content.runtime} minutes
            </ThemedText>
          )}
          {content.production_countries?.length > 0 && (
            <ThemedText style={styles.detailText}>
              Country: {content.production_countries.map((c: any) => c.name).join(', ')}
            </ThemedText>
          )}
          {content.spoken_languages?.length > 0 && (
            <ThemedText style={styles.detailText}>
              Languages: {content.spoken_languages.map((l: any) => l.english_name).join(', ')}
            </ThemedText>
          )}
          {content.budget > 0 && (
            <ThemedText style={styles.detailText}>
              Budget: ${content.budget.toLocaleString()}
            </ThemedText>
          )}
          {content.revenue > 0 && (
            <ThemedText style={styles.detailText}>
              Revenue: ${content.revenue.toLocaleString()}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  posterSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 15,
  },
  titleSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  releaseDate: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 10,
  },
  ratingContainer: {
    marginBottom: 10,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  videoItem: {
    marginRight: 15,
    width: 200,
  },
  videoThumbnail: {
    width: 200,
    height: 112,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  castItem: {
    marginRight: 15,
    width: 100,
    alignItems: 'center',
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  placeholderImage: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  actorName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  characterName: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.8,
  },
});
