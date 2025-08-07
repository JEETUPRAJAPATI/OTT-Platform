
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { downloadService, DownloadItem } from '@/services/downloadService';
import { tmdbService } from '@/services/tmdbApi';
import { Image } from 'react-native';

export default function DownloadsScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    // Refresh downloads every second to show progress
    const interval = setInterval(() => {
      setDownloads(downloadService.getDownloads());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Downloads</ThemedText>
          {downloads.some(d => d.status === 'completed') && (
            <TouchableOpacity onPress={clearCompletedDownloads}>
              <ThemedText style={styles.clearButton}>Clear Completed</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {downloads.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>📥</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>No Downloads</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Download movies and TV shows to watch offline
            </ThemedText>
          </View>
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
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
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
    backgroundColor: '#f8f9fa',
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderPoster: {
    backgroundColor: '#ddd',
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
    backgroundColor: '#e0e0e0',
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
  },
  downloadDate: {
    fontSize: 12,
    opacity: 0.7,
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
