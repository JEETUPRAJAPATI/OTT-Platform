import React, { useState, useEffect } from 'react';
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
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { downloadService, DownloadItem } from '@/services/downloadService';
import { fileDownloadService, DownloadProgress } from '@/services/fileDownloadService'; // Assuming fileDownloadService is in '@/services/fileDownloadService'
import DownloadManager from '@/components/DownloadManager'; // Assuming DownloadManager is in '@/components/DownloadManager'

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'all' | 'downloading' | 'completed' | 'pending';
type RealTabType = 'real' | 'legacy' | 'all';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [realDownloads, setRealDownloads] = useState<DownloadProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<RealTabType>('real');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, available: 0 });
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    // Check if the platform is web
    setIsWeb(Platform.OS === 'web');

    loadDownloads();
    loadStorageInfo();

    // Set up interval to update progress for active downloads
    const interval = setInterval(() => {
      const activeDownloads = downloadService.getActiveDownloads();
      const activeRealDownloads = fileDownloadService.getActiveDownloads();
      if (activeDownloads.length > 0 || activeRealDownloads.length > 0) {
        loadDownloads();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDownloads = async () => {
    try {
      const downloadItems = downloadService.getDownloads();
      setDownloads(downloadItems);

      // Load real file downloads
      const realDownloadItems = fileDownloadService.getAllDownloads();
      setRealDownloads(realDownloadItems);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await downloadService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDownloads();
    await loadStorageInfo();
    setRefreshing(false);
  };

  const getFilteredDownloads = () => {
    switch (activeTab) {
      case 'real':
        return realDownloads;
      case 'legacy':
        return downloads;
      case 'all':
      default:
        return [...realDownloads, ...downloads];
    }
  };

  const handleDownloadAction = (item: DownloadItem | DownloadProgress) => {
    if ('id' in item) {
      if (item.status === 'completed') {
        Alert.alert(
          'Download Options',
          `What would you like to do with "${item.title}"?`,
          [
            { text: 'Delete', onPress: () => deleteDownload(item.id), style: 'destructive' as const },
            { text: 'Cancel', style: 'cancel' as const },
          ]
        );
      } else if (item.status === 'downloading' || item.status === 'pending') {
        Alert.alert(
          'Download Options',
          `What would you like to do with "${item.title}"?`,
          [
            { text: 'Pause', onPress: () => pauseDownload(item.id) },
            { text: 'Cancel', onPress: () => cancelDownload(item.id), style: 'destructive' as const },
            { text: 'Cancel', style: 'cancel' as const },
          ]
        );
      } else if (item.status === 'paused') {
        Alert.alert(
          'Download Options',
          `What would you like to do with "${item.title}"?`,
          [
            { text: 'Resume', onPress: () => resumeDownload(item.id) },
            { text: 'Cancel', onPress: () => cancelDownload(item.id), style: 'destructive' as const },
            { text: 'Cancel', style: 'cancel' as const },
          ]
        );
      } else if (item.status === 'failed') {
        Alert.alert(
          'Download Options',
          `What would you like to do with "${item.title}"?`,
          [
            { text: 'Retry', onPress: () => retryDownload(item.id) },
            { text: 'Delete', onPress: () => deleteDownload(item.id), style: 'destructive' as const },
            { text: 'Cancel', style: 'cancel' as const },
          ]
        );
      }
    }
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
            fileDownloadService.deleteDownload(downloadId); // Assuming fileDownloadService has deleteDownload
            loadDownloads();
            loadStorageInfo();
          }
        }
      ]
    );
  };

  const pauseDownload = (downloadId: string) => {
    downloadService.pauseDownload(downloadId);
    fileDownloadService.pauseDownload(downloadId); // Assuming fileDownloadService has pauseDownload
    loadDownloads();
  };

  const resumeDownload = (downloadId: string) => {
    downloadService.resumeDownload(downloadId);
    fileDownloadService.resumeDownload(downloadId); // Assuming fileDownloadService has resumeDownload
    loadDownloads();
  };

  const cancelDownload = (downloadId: string) => {
    downloadService.cancelDownload(downloadId);
    fileDownloadService.cancelDownload(downloadId); // Assuming fileDownloadService has cancelDownload
    loadDownloads();
    loadStorageInfo();
  };

  const retryDownload = (downloadId: string) => {
    downloadService.retryDownload(downloadId);
    fileDownloadService.retryDownload(downloadId); // Assuming fileDownloadService has retryDownload
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
            fileDownloadService.clearAllDownloads(); // Assuming fileDownloadService has clearAllDownloads
            loadDownloads();
            loadStorageInfo();
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: DownloadItem['status'] | DownloadProgress['status']) => {
    switch (status) {
      case 'downloading': return 'download';
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'alert-circle';
      case 'paused': return 'pause-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: DownloadItem['status'] | DownloadProgress['status']) => {
    switch (status) {
      case 'downloading': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'paused': return '#FF9800';
      case 'pending': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatStorageUsage = (used: number, total: number) => {
    const usedGB = used / (1024 * 1024 * 1024); // Convert bytes to GB
    const totalGB = total / (1024 * 1024 * 1024); // Convert bytes to GB
    const percentage = total > 0 ? (used / total) * 100 : 0;
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
      all: downloads.length + realDownloads.length,
      downloading: downloads.filter(item => item.status === 'downloading').length + realDownloads.filter(item => item.status === 'downloading').length,
      completed: downloads.filter(item => item.status === 'completed').length + realDownloads.filter(item => item.status === 'completed').length,
      pending: downloads.filter(item => item.status === 'pending' || item.status === 'paused').length + realDownloads.filter(item => item.status === 'pending' || item.status === 'paused').length,
    };

    const tabs: { key: RealTabType; label: string }[] = [
      { key: 'real', label: 'File Downloads' },
      { key: 'legacy', label: 'Legacy' },
      { key: 'all', label: 'All' }
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

  const renderDownloadItem = ({ item }: { item: DownloadItem | DownloadProgress }) => (
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
          {formatFileSize(item.size)} • {item.quality?.toUpperCase() || 'N/A'}
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
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.managerButton}
            onPress={() => setShowDownloadManager(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={clearAllDownloads}
          >
            <Ionicons name="trash-outline" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Storage Info */}
      {downloads.length > 0 || realDownloads.length > 0 && renderStorageInfo()}

      {/* Tab Bar */}
      {downloads.length > 0 || realDownloads.length > 0 && renderTabBar()}

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

      {isWeb && (
        <View style={styles.webNotice}>
          <Text style={styles.webNoticeText}>
            Download functionality is not available on the web. Please use the mobile app.
          </Text>
        </View>
      )}

      <DownloadManager
        visible={showDownloadManager}
        onClose={() => setShowDownloadManager(false)}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  clearAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
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
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  webNotice: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  webNoticeText: {
    color: '#E50914',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});