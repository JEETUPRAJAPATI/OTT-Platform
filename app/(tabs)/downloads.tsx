
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadService, DownloadItem } from '@/services/downloadService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'downloading' | 'completed' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, available: 0 });

  useEffect(() => {
    loadDownloads();
    loadStorageInfo();
    
    const interval = setInterval(() => {
      loadDownloads();
    }, 1000); // Update every second for progress
    
    return () => clearInterval(interval);
  }, []);

  const loadDownloads = () => {
    const allDownloads = downloadService.getDownloads();
    setDownloads(allDownloads);
  };

  const loadStorageInfo = async () => {
    const info = await downloadService.getStorageInfo();
    setStorageInfo(info);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadDownloads();
    await loadStorageInfo();
    setRefreshing(false);
  };

  const getFilteredDownloads = () => {
    switch (activeTab) {
      case 'downloading':
        return downloads.filter(item => item.status === 'downloading');
      case 'completed':
        return downloads.filter(item => item.status === 'completed');
      case 'pending':
        return downloads.filter(item => item.status === 'pending');
      default:
        return downloads;
    }
  };

  const handleDownloadAction = (item: DownloadItem) => {
    switch (item.status) {
      case 'downloading':
        Alert.alert(
          'Download Actions',
          `What would you like to do with "${item.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Pause', 
              onPress: () => downloadService.pauseDownload(item.id)
            },
            {
              text: 'Cancel Download',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Cancel Download',
                  'Are you sure you want to cancel this download?',
                  [
                    { text: 'No', style: 'cancel' },
                    { 
                      text: 'Yes', 
                      style: 'destructive',
                      onPress: () => downloadService.cancelDownload(item.id)
                    }
                  ]
                );
              }
            }
          ]
        );
        break;
      case 'paused':
        downloadService.resumeDownload(item.id);
        break;
      case 'failed':
        Alert.alert(
          'Download Failed',
          `"${item.title}" failed to download. Would you like to retry?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => downloadService.deleteDownload(item.id)
            },
            { 
              text: 'Retry', 
              onPress: () => downloadService.retryDownload(item.id)
            }
          ]
        );
        break;
      case 'completed':
        Alert.alert(
          'Downloaded Movie',
          `"${item.title}" is downloaded and ready to watch.`,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Delete Download',
                  'Are you sure you want to delete this downloaded movie?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => downloadService.deleteDownload(item.id)
                    }
                  ]
                );
              }
            }
          ]
        );
        break;
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(0)} MB`;
    }
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  };

  const getStatusColor = (status: DownloadItem['status']) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'downloading':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      case 'paused':
        return '#FF9800';
      case 'pending':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'downloading':
        return 'download';
      case 'failed':
        return 'alert-circle';
      case 'paused':
        return 'pause-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
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

        {item.status === 'downloading' && (
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

  const tabCounts = {
    all: downloads.length,
    downloading: downloads.filter(item => item.status === 'downloading').length,
    completed: downloads.filter(item => item.status === 'completed').length,
    pending: downloads.filter(item => item.status === 'pending').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#000', 'rgba(0,0,0,0.9)']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Downloads</Text>
        
        {/* Storage Info */}
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>
            {formatFileSize(storageInfo.used)} used of {formatFileSize(storageInfo.available)} available
          </Text>
          <View style={styles.storageBar}>
            <View 
              style={[
                styles.storageBarFill, 
                { width: `${Math.min((storageInfo.used / storageInfo.available) * 100, 100)}%` }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'downloading', 'completed', 'pending'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {tabCounts[tab] > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tabCounts[tab]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Downloads List */}
      <FlatList
        data={getFilteredDownloads()}
        keyExtractor={(item) => item.id}
        renderItem={renderDownloadItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#fff']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Clear All Button */}
      {downloads.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              Alert.alert(
                'Clear All Downloads',
                'This will delete all downloaded files and cancel any active downloads. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                      downloadService.clearAllDownloads();
                      setDownloads([]);
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
            <Text style={styles.clearAllText}>Clear All Downloads</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  storageInfo: {
    marginBottom: 8,
  },
  storageText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  storageBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#E50914',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
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
    paddingHorizontal: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  clearAllText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
