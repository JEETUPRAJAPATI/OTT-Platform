import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { downloadService, DownloadItem } from '@/services/downloadService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DownloadsScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // In real app, get from context/storage

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = () => {
    if (isLoggedIn) {
      const downloadList = downloadService.getDownloads();
      setDownloads(downloadList);
    }
  };

  const handleDeleteDownload = (id: string, title: string) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            downloadService.removeDownload(id);
            setDownloads(downloadService.getDownloads());
          }
        }
      ]
    );
  };

  const clearCompletedDownloads = () => {
    Alert.alert(
      'Clear Completed',
      'Remove all completed downloads?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            downloadService.clearCompleted();
            setDownloads(downloadService.getDownloads());
          }
        }
      ]
    );
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => {
    const posterUrl = tmdbService.getImageUrl(item.poster_path);

    return (
      <TouchableOpacity
        style={styles.downloadItem}
        onPress={() => {
          if (item.status === 'completed') {
            router.push(`/tmdb-content/${item.id}?type=${item.type}`);
          }
        }}
      >
        <View style={styles.itemContent}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.placeholderPoster]}>
              <ThemedText style={styles.placeholderText}>📱</ThemedText>
            </View>
          )}

          <View style={styles.itemInfo}>
            <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
              {item.title}
            </ThemedText>

            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, getStatusColor(item.status)]}>
                <ThemedText style={styles.statusText}>
                  {getStatusText(item.status)}
                </ThemedText>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: item.type === 'movie' ? '#FF6B6B' : '#4ECDC4' }]}>
                <ThemedText style={styles.typeText}>{item.type.toUpperCase()}</ThemedText>
              </View>
            </View>

            {item.status === 'downloading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>
                <ThemedText style={styles.progressText}>{Math.round(item.progress)}%</ThemedText>
              </View>
            )}

            {item.downloadedAt && (
              <ThemedText style={styles.downloadDate}>
                Downloaded: {item.downloadedAt.toLocaleDateString()}
              </ThemedText>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDownload(item.id, item.title)}
          >
            <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { backgroundColor: '#28a745' };
      case 'downloading': return { backgroundColor: '#007bff' };
      case 'pending': return { backgroundColor: '#ffc107' };
      case 'failed': return { backgroundColor: '#dc3545' };
      default: return { backgroundColor: '#6c757d' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Downloaded';
      case 'downloading': return 'Downloading';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (!isLoggedIn) {
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a1a']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="download-outline" size={80} color="rgba(255,255,255,0.3)" />
            <ThemedText style={styles.welcomeText}>Downloads</ThemedText>
            <ThemedText style={styles.subtitleText}>Sign in to download content</ThemedText>
          </View>
        </LinearGradient>

        <ThemedView style={styles.content}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/profile')}
          >
            <LinearGradient
              colors={['#E50914', '#B8070F']}
              style={styles.gradientButton}
            >
              <Ionicons name="log-in" size={24} color="#fff" />
              <ThemedText style={styles.loginButtonText}>Sign In to Download</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.featuresSection}>
            <ThemedText style={styles.featuresTitle}>Download Benefits</ThemedText>
            <View style={styles.feature}>
              <Ionicons name="wifi-off" size={24} color="#E50914" />
              <ThemedText style={styles.featureText}>Watch offline without internet</ThemedText>
            </View>
            <View style={styles.feature}>
              <Ionicons name="save" size={24} color="#E50914" />
              <ThemedText style={styles.featureText}>Save data while traveling</ThemedText>
            </View>
            <View style={styles.feature}>
              <Ionicons name="time" size={24} color="#E50914" />
              <ThemedText style={styles.featureText}>Watch anytime, anywhere</ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Downloads
        </ThemedText>

        {downloads.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="download-outline" size={64} color="#666" />
            <ThemedText style={styles.emptyText}>
              No downloads yet
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Download content to watch offline
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={downloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loginButton: {
    marginVertical: 30,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  featuresSection: {
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#0a0a0a',
  },
  headerTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    color: '#007bff',
    fontSize: 16,
  },
  downloadItem: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderPoster: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    minWidth: 35,
    color: '#fff',
  },
  downloadDate: {
    fontSize: 12,
    opacity: 0.7,
    color: '#eee',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
});