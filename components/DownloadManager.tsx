
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fileDownloadService, DownloadProgress } from '@/services/fileDownloadService';

interface DownloadManagerProps {
  visible: boolean;
  onClose: () => void;
}

export function DownloadManager({ visible, onClose }: DownloadManagerProps) {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'all'>('active');

  useEffect(() => {
    if (visible) {
      loadDownloads();
      // Set up periodic refresh for active downloads
      const interval = setInterval(() => {
        loadDownloads();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadDownloads = () => {
    const allDownloads = fileDownloadService.getAllDownloads();
    setDownloads(allDownloads);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadDownloads();
    setRefreshing(false);
  };

  const getFilteredDownloads = (): DownloadProgress[] => {
    switch (selectedTab) {
      case 'active':
        return downloads.filter(d => ['pending', 'downloading', 'paused'].includes(d.status));
      case 'completed':
        return downloads.filter(d => ['completed', 'failed', 'cancelled'].includes(d.status));
      case 'all':
      default:
        return downloads;
    }
  };

  const handlePauseResume = (download: DownloadProgress) => {
    if (download.status === 'downloading') {
      fileDownloadService.pauseDownload(download.id);
    } else if (download.status === 'paused') {
      fileDownloadService.resumeDownload(download.id);
    }
  };

  const handleCancel = (download: DownloadProgress) => {
    Alert.alert(
      'Cancel Download',
      `Are you sure you want to cancel "${download.filename}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            fileDownloadService.cancelDownload(download.id);
            loadDownloads();
          }
        }
      ]
    );
  };

  const handleDelete = (download: DownloadProgress) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${download.filename}"? This will remove the downloaded file.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            fileDownloadService.deleteDownload(download.id);
            loadDownloads();
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Downloads',
      'This will cancel all active downloads and remove all download history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            fileDownloadService.clearAllDownloads();
            loadDownloads();
          }
        }
      ]
    );
  };

  const getStatusColor = (status: DownloadProgress['status']): string => {
    switch (status) {
      case 'downloading':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'paused':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#FFC107';
    }
  };

  const getStatusIcon = (status: DownloadProgress['status']): string => {
    switch (status) {
      case 'downloading':
        return 'download';
      case 'completed':
        return 'checkmark-circle';
      case 'paused':
        return 'pause-circle';
      case 'failed':
        return 'alert-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const renderDownloadItem = (download: DownloadProgress) => (
    <View key={download.id} style={styles.downloadItem}>
      <View style={styles.downloadHeader}>
        <View style={styles.downloadInfo}>
          <Text style={styles.filename} numberOfLines={1}>
            {download.filename}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons 
              name={getStatusIcon(download.status)} 
              size={16} 
              color={getStatusColor(download.status)} 
            />
            <Text style={[styles.status, { color: getStatusColor(download.status) }]}>
              {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {download.status === 'downloading' || download.status === 'paused' ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePauseResume(download)}
              >
                <Ionicons 
                  name={download.status === 'downloading' ? 'pause' : 'play'} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancel(download)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          ) : download.status === 'completed' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(download)}
            >
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(download)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {download.status === 'downloading' || download.status === 'paused' ? (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${download.progress}%`,
                  backgroundColor: getStatusColor(download.status)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {download.progress.toFixed(1)}%
          </Text>
        </View>
      ) : null}

      <View style={styles.downloadDetails}>
        {download.contentLength > 0 && (
          <Text style={styles.detailText}>
            {fileDownloadService.formatFileSize(download.bytesWritten)} / {fileDownloadService.formatFileSize(download.contentLength)}
          </Text>
        )}
        
        {download.status === 'downloading' && download.speed > 0 && (
          <Text style={styles.detailText}>
            {fileDownloadService.formatSpeed(download.speed)} • {fileDownloadService.formatTimeRemaining(download.estimatedTime)}
          </Text>
        )}
        
        {download.error && (
          <Text style={styles.errorText}>
            Error: {download.error}
          </Text>
        )}
        
        {download.filePath && download.status === 'completed' && (
          <Text style={styles.pathText} numberOfLines={1}>
            {download.filePath}
          </Text>
        )}
      </View>
    </View>
  );

  const filteredDownloads = getFilteredDownloads();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#000', '#1a1a1a']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Downloads</Text>
            <View style={styles.headerActions}>
              {downloads.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearAll}
                >
                  <Ionicons name="trash-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabs}>
            {[
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
              { key: 'all', label: 'All' }
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  selectedTab === tab.key && styles.activeTab
                ]}
                onPress={() => setSelectedTab(tab.key as any)}
              >
                <Text style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredDownloads.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="download-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyTitle}>No Downloads</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedTab === 'active' 
                    ? 'No active downloads at the moment'
                    : selectedTab === 'completed'
                    ? 'No completed downloads'
                    : 'Start downloading movies to see them here'
                  }
                </Text>
              </View>
            ) : (
              filteredDownloads.map(renderDownloadItem)
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Total Downloads: {downloads.length} • Active: {downloads.filter(d => d.status === 'downloading').length}
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  downloadItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  downloadInfo: {
    flex: 1,
    marginRight: 12,
  },
  filename: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
  },
  downloadDetails: {
    marginTop: 8,
  },
  detailText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  pathText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyState: {
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
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});
