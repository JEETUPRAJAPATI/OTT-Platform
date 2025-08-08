import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity, Alert, View, Text, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TMDbContentCard } from '@/components/TMDbContentCard';
import { downloadService, DownloadItem, DownloadQuality } from '@/services/downloadService';
import { tmdbService } from '@/services/tmdbApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DownloadsScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'downloading' | 'completed'>('all');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, available: 0 });
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);

  useEffect(() => {
    loadDownloads();
    const interval = setInterval(loadDownloads, 1000); // Update every second for progress
    return () => clearInterval(interval);
  }, []);

  const loadDownloads = () => {
    setDownloads(downloadService.getDownloads());
    setStorageInfo(downloadService.getStorageInfo());
  };

  const getFilteredDownloads = () => {
    switch (selectedTab) {
      case 'downloading':
        return downloads.filter(item => ['pending', 'downloading', 'paused'].includes(item.status));
      case 'completed':
        return downloads.filter(item => item.status === 'completed');
      default:
        return downloads;
    }
  };

  const handleContentPress = async (item: DownloadItem) => {
    if (item.status === 'completed') {
      // Navigate to content detail or player
      router.push(`/tmdb-content/${item.contentId}?type=${item.contentType}`);
    } else {
      // Show download progress or options
      Alert.alert(
        'Download in Progress',
        `This content is currently ${item.status}. Progress: ${item.progress.toFixed(1)}%`,
        [
          { text: 'OK', style: 'default' },
          item.status === 'downloading' ? 
            { text: 'Pause', onPress: () => pauseDownload(item.id) } :
            { text: 'Resume', onPress: () => resumeDownload(item.id) }
        ]
      );
    }
  };

  const pauseDownload = (downloadId: string) => {
    downloadService.pauseDownload(downloadId);
    loadDownloads();
  };

  const resumeDownload = (downloadId: string) => {
    downloadService.resumeDownload(downloadId);
    loadDownloads();
  };

  const cancelDownload = (downloadId: string) => {
    Alert.alert(
      'Cancel Download',
      'Are you sure you want to cancel this download?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            downloadService.cancelDownload(downloadId);
            loadDownloads();
          }
        }
      ]
    );
  };

  const deleteDownload = (downloadId: string) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this download? This will free up storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            downloadService.deleteDownload(downloadId);
            loadDownloads();
          }
        }
      ]
    );
  };

  const clearAllDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      'This will remove all downloaded content. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            downloadService.clearAllDownloads();
            loadDownloads();
          }
        }
      ]
    );
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(0)} MB`;
  };

  const formatStorageUsed = () => {
    const usedGB = storageInfo.used / 1024;
    const totalGB = storageInfo.total / 1024;
    return `${usedGB.toFixed(1)} GB of ${totalGB.toFixed(0)} GB used`;
  };

  const getStoragePercentage = () => {
    return (storageInfo.used / storageInfo.total) * 100;
  };

  const getStatusColor = (status: DownloadItem['status']) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'downloading': return '#2196F3';
      case 'paused': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'downloading': return 'download';
      case 'paused': return 'pause-circle';
      case 'failed': return 'close-circle';
      default: return 'time';
    }
  };

  const renderTabButton = (tab: 'all' | 'downloading' | 'completed', label: string, count: number) => (
    <TouchableOpacity
      style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
        {label}
      </Text>
      <View style={[styles.tabBadge, selectedTab === tab && styles.activeTabBadge]}>
        <Text style={[styles.tabBadgeText, selectedTab === tab && styles.activeTabBadgeText]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
    <TouchableOpacity 
      style={styles.downloadItem}
      onPress={() => handleContentPress(item)}
    >
      <View style={styles.downloadPoster}>
        <TMDbContentCard
          content={{
            id: item.contentId,
            poster_path: item.posterPath,
            title: item.title,
            name: item.title,
            vote_average: 0,
            overview: '',
            release_date: '',
            first_air_date: '',
            backdrop_path: '',
            genre_ids: [],
            original_language: '',
            popularity: 0
          }}
          type={item.contentType}
          onPress={() => handleContentPress(item)}
          style={styles.posterCard}
        />
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color="#fff" />
        </View>
      </View>

      <View style={styles.downloadInfo}>
        <Text style={styles.downloadTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.episodeId && (
          <Text style={styles.episodeInfo}>
            S{item.seasonNumber}E{item.episodeNumber}
          </Text>
        )}

        <Text style={styles.downloadMeta}>
          {item.contentType === 'movie' ? 'Movie' : 'Series'} • {item.quality.toUpperCase()} • {formatFileSize(item.size)}
        </Text>

        {item.status === 'downloading' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress.toFixed(1)}%</Text>
          </View>
        )}

        <View style={styles.downloadActions}>
          {item.status === 'completed' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleContentPress(item)}
            >
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.actionText}>Play</Text>
            </TouchableOpacity>
          )}

          {item.status === 'downloading' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => pauseDownload(item.id)}
            >
              <Ionicons name="pause" size={16} color="#fff" />
              <Text style={styles.actionText}>Pause</Text>
            </TouchableOpacity>
          )}

          {item.status === 'paused' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => resumeDownload(item.id)}
            >
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.actionText}>Resume</Text>
            </TouchableOpacity>
          )}

          {['pending', 'downloading', 'paused'].includes(item.status) && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => cancelDownload(item.id)}
            >
              <Ionicons name="close" size={16} color="#ff4444" />
              <Text style={[styles.actionText, { color: '#ff4444' }]}>Cancel</Text>
            </TouchableOpacity>
          )}

          {item.status === 'completed' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteDownload(item.id)}
            >
              <Ionicons name="trash" size={16} color="#ff4444" />
              <Text style={[styles.actionText, { color: '#ff4444' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredDownloads = getFilteredDownloads();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        {downloads.length > 0 && (
          <TouchableOpacity onPress={clearAllDownloads}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Storage Info */}
      {downloads.length > 0 && (
        <View style={styles.storageContainer}>
          <View style={styles.storageHeader}>
            <Ionicons name="phone-portrait" size={16} color="#fff" />
            <Text style={styles.storageText}>{formatStorageUsed()}</Text>
          </View>
          <View style={styles.storageBar}>
            <View style={[styles.storageProgress, { width: `${getStoragePercentage()}%` }]} />
          </View>
        </View>
      )}

      {downloads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="download-outline" size={80} color="#333" />
          <Text style={styles.emptyTitle}>No Downloads Yet</Text>
          <Text style={styles.emptyDescription}>
            Download movies and TV shows to watch offline{'\n'}
            Look for the download icon on content pages
          </Text>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            {renderTabButton('all', 'All', downloads.length)}
            {renderTabButton('downloading', 'Active', downloads.filter(d => ['pending', 'downloading', 'paused'].includes(d.status)).length)}
            {renderTabButton('completed', 'Completed', downloads.filter(d => d.status === 'completed').length)}
          </View>

          {/* Downloads List */}
          <FlatList
            data={filteredDownloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.downloadsList}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  storageContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  storageText: {
    fontSize: 14,
    color: '#999',
  },
  storageBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  storageProgress: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#E50914',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabBadgeText: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
    lineHeight: 24,
  },
  downloadsList: {
    padding: 20,
  },
  downloadItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
  },
  downloadPoster: {
    position: 'relative',
  },
  posterCard: {
    width: 80,
    height: 120,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'space-between',
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  episodeInfo: {
    fontSize: 12,
    color: '#E50914',
    fontWeight: '600',
    marginBottom: 4,
  },
  downloadMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  downloadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});