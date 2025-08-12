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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { downloadService, DownloadItem } from '@/services/downloadService';
import { WebFileDownloader } from '@/components/WebFileDownloader';

// Conditional import for DownloadManager
let DownloadManager: any = null;
if (Platform.OS !== 'web') {
  try {
    DownloadManager = require('@/components/DownloadManager').default;
  } catch (error) {
    console.warn('DownloadManager not available:', error);
    // Fallback component for web
    DownloadManager = ({ visible, onClose }: any) => null;
  }
} else {
  // Fallback component for web
  DownloadManager = ({ visible, onClose }: any) => null;
}

// Conditional imports for mobile platforms
let fileDownloadService: any = null;
let DownloadProgress: any = null;

if (Platform.OS !== 'web') {
  try {
    const fileDownloadModule = require('@/services/fileDownloadService');
    fileDownloadService = fileDownloadModule.fileDownloadService || fileDownloadModule.default;
    DownloadProgress = fileDownloadModule.DownloadProgress;
  } catch (error) {
    console.warn('File download service not available on web platform:', error);
  }
}

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'all' | 'downloading' | 'completed' | 'pending';
type RealTabType = 'real' | 'legacy' | 'all';

export default function DownloadsScreen() {
  const testDownloadUrl = 'https://ia600100.us.archive.org/4/items/DrawnTogetherComplete/s04%2FThe%20Drawn%20Together%20Movie%20The%20Movie!%20(2010).ia.mp4?download=1';
  const testFileName = 'The Drawn Together Movie (2010).mp4';

  // Check if react-native-fs is available
  let RNFS: any = null;
  let isNativeDownloadSupported = false;

  if (Platform.OS !== 'web') {
    try {
      RNFS = require('react-native-fs');
      isNativeDownloadSupported = RNFS && typeof RNFS.downloadFile === 'function';
    } catch (error) {
      console.log('react-native-fs not available:', error);
    }
  }

  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [realDownloads, setRealDownloads] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<RealTabType>('real');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, available: 0 });
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [isWeb, setIsWeb] = useState(Platform.OS === 'web');

  useEffect(() => {
    loadDownloads();
    if (!isWeb) {
      loadStorageInfo();
    }

    // Set up interval to update progress for active downloads (mobile only)
    let interval: NodeJS.Timeout | null = null;
    if (!isWeb && fileDownloadService && typeof fileDownloadService.getActiveDownloads === 'function') {
      interval = setInterval(() => {
        const activeDownloads = downloadService.getActiveDownloads();
        const activeRealDownloads = fileDownloadService.getActiveDownloads();
        if (activeDownloads.length > 0 || activeRealDownloads.length > 0) {
          loadDownloads();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWeb]);

  const loadDownloads = async () => {
    try {
      const downloadItems = downloadService.getDownloads();
      setDownloads(downloadItems);

      // Load real file downloads (mobile only)
      if (!isWeb && fileDownloadService) {
        const realDownloadItems = fileDownloadService.getAllDownloads();
        setRealDownloads(realDownloadItems);
      } else {
        setRealDownloads([]);
      }
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
            if (fileDownloadService) {
              fileDownloadService.deleteDownload(downloadId);
            }
            loadDownloads();
            loadStorageInfo();
          }
        }
      ]
    );
  };

  const pauseDownload = (downloadId: string) => {
    downloadService.pauseDownload(downloadId);
    if (fileDownloadService) {
      fileDownloadService.pauseDownload(downloadId);
    }
    loadDownloads();
  };

  const resumeDownload = (downloadId: string) => {
    downloadService.resumeDownload(downloadId);
    if (fileDownloadService) {
      fileDownloadService.resumeDownload(downloadId);
    }
    loadDownloads();
  };

  const cancelDownload = (downloadId: string) => {
    downloadService.cancelDownload(downloadId);
    if (fileDownloadService) {
      fileDownloadService.cancelDownload(downloadId);
    }
    loadDownloads();
    loadStorageInfo();
  };

  const retryDownload = (downloadId: string) => {
    downloadService.retryDownload(downloadId);
    if (fileDownloadService) {
      fileDownloadService.retryDownload(downloadId);
    }
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
            if (fileDownloadService) {
              fileDownloadService.clearAllDownloads();
            }
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
      case 'downloading': return '#00D4AA';
      case 'completed': return '#4CAF50';
      case 'failed': return '#FF3131';
      case 'paused': return '#FFA500';
      case 'pending': return '#9CA3AF';
      default: return '#9CA3AF';
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
    const usedGB = used / (1024 * 1024 * 1024);
    const totalGB = total / (1024 * 1024 * 1024);
    const percentage = total > 0 ? (used / total) * 100 : 0;
    return {
      text: `${usedGB.toFixed(1)} GB / ${totalGB.toFixed(1)} GB`,
      percentage: Math.min(percentage, 100)
    };
  };

  const renderStorageInfo = () => {
    const storage = formatStorageUsage(storageInfo.used, storageInfo.total);

    return (
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(30, 30, 30, 0.6)']}
        style={styles.storageContainer}
      >
        <View style={styles.storageHeader}>
          <View style={styles.storageIconContainer}>
            <Ionicons name="folder-outline" size={20} color="#00D4AA" />
          </View>
          <View style={styles.storageTextContainer}>
            <Text style={styles.storageTitle}>Storage Usage</Text>
            <Text style={styles.storageText}>{storage.text}</Text>
          </View>
          <Text style={styles.storagePercentage}>{storage.percentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.storageBar}>
          <LinearGradient
            colors={['#00D4AA', '#007A88']}
            style={[styles.storageUsed, { width: `${storage.percentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.storageDetails}>
          Available: {formatFileSize(storageInfo.available)}
        </Text>
      </LinearGradient>
    );
  };

  const renderTabBar = () => {
    const tabCounts = {
      all: downloads.length + realDownloads.length,
      real: realDownloads.length,
      legacy: downloads.length,
    };

    const tabs: { key: RealTabType; label: string; icon: string }[] = [
      { key: 'real', label: 'Downloads', icon: 'download' },
      { key: 'legacy', label: 'Legacy', icon: 'archive' },
      { key: 'all', label: 'All Files', icon: 'folder' }
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={activeTab === tab.key ? ['#00D4AA', '#007A88'] : ['transparent', 'transparent']}
              style={styles.tabGradient}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.key ? '#FFFFFF' : '#9CA3AF'} 
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {tabCounts[tab.key] > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tabCounts[tab.key]}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem | DownloadProgress }) => (
    <TouchableOpacity style={styles.downloadItem} onPress={() => handleDownloadAction(item)} activeOpacity={0.9}>
      <LinearGradient
        colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.8)']}
        style={styles.downloadCard}
      >
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: item.posterPath
                ? `https://image.tmdb.org/t/p/w300${item.posterPath}`
                : 'https://via.placeholder.com/120x180?text=No+Image'
            }}
            style={styles.poster}
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons
              name={getStatusIcon(item.status)}
              size={12}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.downloadInfo}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

          <View style={styles.metaInfo}>
            <Text style={styles.fileSize}>
              {formatFileSize(item.size)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.quality}>
              {item.quality?.toUpperCase() || 'N/A'}
            </Text>
          </View>

          {(item.status === 'downloading' || item.status === 'paused') && (
            <View style={styles.progressSection}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <LinearGradient
                    colors={['#00D4AA', '#007A88']}
                    style={[styles.progressFill, { width: `${item.progress}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
              </View>
            </View>
          )}

          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status === 'completed' && `Downloaded ${new Date(item.downloadedAt).toLocaleDateString()}`}
              {item.status === 'downloading' && 'Downloading...'}
              {item.status === 'paused' && 'Paused'}
              {item.status === 'pending' && 'Waiting...'}
              {item.status === 'failed' && 'Failed - Tap to retry'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleDownloadAction(item)}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(0, 212, 170, 0.1)', 'rgba(0, 122, 136, 0.05)']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="download-outline" size={48} color="#00D4AA" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Downloads Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start downloading movies and shows to watch offline
      </Text>
      <LinearGradient
        colors={['#00D4AA', '#007A88']}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>Browse Movies</Text>
      </LinearGradient>
    </View>
  );

  const filteredDownloads = getFilteredDownloads();

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient 
        colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)', 'transparent']} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="download" size={24} color="#00D4AA" />
            </View>
            <Text style={styles.headerTitle}>My Downloads</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowDownloadManager(true)}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.dangerButton]}
              onPress={clearAllDownloads}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3131" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Storage Info */}
      {(downloads.length > 0 || realDownloads.length > 0) && renderStorageInfo()}

      {/* Tab Bar */}
      {(downloads.length > 0 || realDownloads.length > 0) && renderTabBar()}

      {/* Platform Warning */}
      {!isNativeDownloadSupported && (
        <LinearGradient
          colors={['rgba(255, 152, 0, 0.15)', 'rgba(255, 152, 0, 0.05)']}
          style={styles.platformWarning}
        >
          <View style={styles.warningHeader}>
            <Ionicons name="information-circle" size={20} color="#FFA500" />
            <Text style={styles.warningTitle}>Platform Notice</Text>
          </View>
          <Text style={styles.warningText}>
            File downloads require a development build to work properly.
          </Text>
          <View style={styles.commandContainer}>
            <Text style={styles.commandText}>
              npx expo run:android{'\n'}npx expo run:ios
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Web File Downloader */}
      {isWeb && (
        <View style={styles.webDownloaderSection}>
          <Text style={styles.sectionTitle}>Web Browser Download</Text>
          <WebFileDownloader
            url={testDownloadUrl}
            filename={testFileName}
            title="The Drawn Together Movie"
          />
        </View>
      )}

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
            tintColor="#00D4AA"
            colors={['#00D4AA']}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />

      {isWeb && filteredDownloads.length === 0 && (
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.1)', 'rgba(76, 175, 80, 0.05)']}
          style={styles.webNotice}
        >
          <Ionicons name="information-circle" size={16} color="#4CAF50" />
          <Text style={styles.webNoticeText}>
            Use the web downloader above to download files directly in your browser.
          </Text>
        </LinearGradient>
      )}

      {DownloadManager && (
        <DownloadManager
          visible={showDownloadManager}
          onClose={() => setShowDownloadManager(false)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 49, 49, 0.2)',
  },
  storageContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storageTextContainer: {
    flex: 1,
  },
  storageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storageText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  storagePercentage: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '700',
  },
  storageBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageUsed: {
    height: '100%',
    borderRadius: 3,
  },
  storageDetails: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeTab: {
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemSeparator: {
    height: 12,
  },
  downloadItem: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  downloadCard: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  posterContainer: {
    position: 'relative',
    marginRight: 16,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  downloadInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileSize: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  separator: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginHorizontal: 8,
  },
  quality: {
    color: '#00D4AA',
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#00D4AA',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 35,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  webDownloaderSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  webNoticeText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  platformWarning: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningText: {
    color: 'rgba(255, 152, 0, 0.9)',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  commandContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  commandText: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});