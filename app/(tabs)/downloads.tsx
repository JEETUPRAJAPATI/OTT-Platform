import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { downloadService, DownloadItem } from '@/services/downloadService';
import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'all' | 'downloading' | 'completed' | 'pending';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, available: 0 });

  useEffect(() => {
    loadDownloads();
    loadStorageInfo();

    // Set up interval to update progress for active downloads
    const interval = setInterval(() => {
      const activeDownloads = downloadService.getActiveDownloads();
      if (activeDownloads.length > 0) {
        loadDownloads();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDownloads = () => {
    const allDownloads = downloadService.getDownloads();
    setDownloads(allDownloads);
  };

  const loadStorageInfo = async () => {
    try {
      const info = await downloadService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDownloads();
    await loadStorageInfo();
    setRefreshing(false);
  };

  const getFilteredDownloads = (): DownloadItem[] => {
    switch (activeTab) {
      case 'downloading':
        return downloads.filter(item => item.status === 'downloading');
      case 'completed':
        return downloads.filter(item => item.status === 'completed');
      case 'pending':
        return downloads.filter(item => item.status === 'pending' || item.status === 'paused');
      default:
        return downloads;
    }
  };

  const handleDownloadAction = (item: DownloadItem) => {
    const actions = [];

    if (item.status === 'completed') {
      actions.push({ text: 'Delete', onPress: () => deleteDownload(item.id), style: 'destructive' as const });
    } else if (item.status === 'downloading') {
      actions.push({ text: 'Pause', onPress: () => pauseDownload(item.id) });
      actions.push({ text: 'Cancel', onPress: () => cancelDownload(item.id), style: 'destructive' as const });
    } else if (item.status === 'paused') {
      actions.push({ text: 'Resume', onPress: () => resumeDownload(item.id) });
      actions.push({ text: 'Cancel', onPress: () => cancelDownload(item.id), style: 'destructive' as const });
    } else if (item.status === 'failed') {
      actions.push({ text: 'Retry', onPress: () => retryDownload(item.id) });
      actions.push({ text: 'Delete', onPress: () => deleteDownload(item.id), style: 'destructive' as const });
    } else if (item.status === 'pending') {
      actions.push({ text: 'Cancel', onPress: () => cancelDownload(item.id), style: 'destructive' as const });
    }

    actions.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert('Download Options', `What would you like to do with "${item.title}"?`, actions);
  };

  const deleteDownload = (downloadId: string) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this download?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            downloadService.deleteDownload(downloadId);
            loadDownloads();
            loadStorageInfo();
          }
        }
      ]
    );
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
    downloadService.cancelDownload(downloadId);
    loadDownloads();
    loadStorageInfo();
  };

  const retryDownload = (downloadId: string) => {
    downloadService.retryDownload(downloadId);
    loadDownloads();
  };

  const clearAllDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to clear all downloads? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            downloadService.clearAllDownloads();
            loadDownloads();
            loadStorageInfo();
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'downloading': return 'download';
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'alert-circle';
      case 'paused': return 'pause-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: DownloadItem['status']) => {
    switch (status) {
      case 'downloading': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'paused': return '#FF9800';
      case 'pending': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(0)} MB`;
  };

  const formatStorageUsage = (used: number, total: number) => {
    const usedGB = used / 1024;
    const totalGB = total / 1024;
    const percentage = (used / total) * 100;
    return {
      text: `${usedGB.toFixed(1)} GB / ${totalGB.toFixed(1)} GB`,
      percentage: Math.min(percentage, 100)
    };
  };

  const renderStorageInfo = () => {
    const storage = formatStorageUsage(storageInfo.used, storageInfo.total);

    return (
      <View style={styles.storageContainer}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageTitle}>Storage Usage</Text>
          <Text style={styles.storageText}>{storage.text}</Text>
        </View>
        <View style={styles.storageBar}>
          <View style={[styles.storageUsed, { width: `${storage.percentage}%` }]} />
        </View>
        <Text style={styles.storageDetails}>
          Downloads: {formatFileSize(storageInfo.used)} • Available: {formatFileSize(storageInfo.available)}
        </Text>
      </View>
    );
  };

  const renderTabBar = () => {
    const tabCounts = {
      all: downloads.length,
      downloading: downloads.filter(item => item.status === 'downloading').length,
      completed: downloads.filter(item => item.status === 'completed').length,
      pending: downloads.filter(item => item.status === 'pending' || item.status === 'paused').length,
    };

    const tabs: { key: TabType; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'downloading', label: 'Active' },
      { key: 'completed', label: 'Done' },
      { key: 'pending', label: 'Queue' },
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label} {tabCounts[tab.key] > 0 && `(${tabCounts[tab.key]})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
    <TouchableOpacity style={styles.downloadItem} onPress={() => handleDownloadAction(item)}>
      <Image
        source={{
          uri: item.posterPath 
            ? `https://image.tmdb.org/t/p/w300${item.posterPath}`
            : 'https://via.placeholder.com/120x180?text=No+Image'
        }}
        style={styles.poster}
      />

      <View style={styles.downloadInfo}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

        <View style={styles.statusRow}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>

        <Text style={styles.size}>
          {formatFileSize(item.size)} • {item.quality.toUpperCase()}
        </Text>

        {(item.status === 'downloading' || item.status === 'paused') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
          </View>
        )}

        {item.status === 'completed' && (
          <Text style={styles.downloadDate}>
            Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
          </Text>
        )}

        {item.status === 'failed' && (
          <Text style={styles.errorText}>
            Download failed - Tap to retry
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={() => handleDownloadAction(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="download-outline" size={64} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyTitle}>No Downloads</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all' 
          ? 'Start downloading movies to watch offline'
          : `No ${activeTab} downloads`}
      </Text>
    </View>
  );

  const filteredDownloads = getFilteredDownloads();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <LinearGradient colors={['#E50914', '#B81D1D']} style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        {downloads.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllDownloads}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Storage Info */}
      {downloads.length > 0 && renderStorageInfo()}

      {/* Tab Bar */}
      {downloads.length > 0 && renderTabBar()}

      {/* Downloads List */}
      <FlatList
        data={filteredDownloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredDownloads.length === 0 ? styles.emptyListContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
            colors={['#E50914']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  storageContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storageText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  storageBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageUsed: {
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 4,
  },
  storageDetails: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#E50914',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  downloadItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  poster: {
    width: 80,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  downloadInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  size: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  progressText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  downloadDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
  },
});