import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fileDownloadService, DownloadProgress } from '@/services/fileDownloadService';
import { DownloadManager } from '@/components/DownloadManager';
import { DownloadSettings } from '@/components/DownloadSettings';

interface DownloadItem extends DownloadProgress {
  title?: string;
  posterPath?: string;
  quality?: string;
  contentType?: 'movie' | 'tv';
  contentId?: number;
  fileName?: string; // Added for clarity in logs and alerts
}

export default function DownloadsScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [showDownloadSettings, setShowDownloadSettings] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState<DownloadItem | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [notification, setNotification] = useState<{message: string, visible: boolean}>({message: '', visible: false});

  useEffect(() => {
    loadDownloads();
    // Set up periodic refresh for active downloads
    const interval = setInterval(loadDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible]);

  // Check for new downloads and show notification
  useEffect(() => {
    const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'pending');
    if (activeDownloads.length > 0 && !notification.visible) {
      // setNotification({
      //   message: `Download started! Check your downloads below. You can access download settings by tapping the settings icon above.`,
      //   visible: true
      // });
    }
  }, [downloads]);

  const loadDownloads = () => {
    try {
      const allDownloads = fileDownloadService.getAllDownloads();
      // Map the downloads to include proper display data
      const mappedDownloads: DownloadItem[] = allDownloads.map(download => {
        // Use stored movie title or extract from filename
        let displayTitle = download.movieTitle || 'Unknown Movie';
        if (!displayTitle || displayTitle === 'Unknown Movie') {
          if (download.filename) {
            // Remove file extension and replace underscores with spaces
            displayTitle = download.filename
              .replace(/\.[^/.]+$/, '') // Remove extension
              .replace(/_/g, ' ') // Replace underscores with spaces
              .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
          }
        }

        // Use stored posterPath or fallback
        let posterPath = download.posterPath || '/placeholder-movie.jpg';

        return {
          ...download,
          title: displayTitle,
          posterPath: posterPath,
          quality: getQualityFromFilename(download.filename || ''),
          contentType: download.contentType || 'movie',
          contentId: download.contentId,
          size: download.contentLength || download.bytesWritten || 0,
          fileName: download.filename || '' // Ensure fileName is available
        };
      });
      setDownloads(mappedDownloads);
    } catch (error) {
      console.error('Error loading downloads:', error);
      setDownloads([]);
    }
  };

  const getQualityFromFilename = (filename: string): string => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('4k') || lowerName.includes('2160p')) return '4K';
    if (lowerName.includes('1080p')) return 'HD';
    if (lowerName.includes('720p')) return 'HD';
    if (lowerName.includes('480p')) return 'SD';
    return 'SD';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadDownloads();
    setRefreshing(false);
  };

  const getFilteredDownloads = (): DownloadItem[] => {
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'downloading':
        return '#00D4AA';
      case 'completed':
        return '#4CAF50';
      case 'paused':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#FFC107'; // Pending or unknown
    }
  };

  const getStatusIcon = (status: string): string => {
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
        return 'time'; // Pending
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 MB/s';
    const mbps = bytesPerSecond / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return 'Calculating...';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleDownloadPress = (item: DownloadItem) => {
    if (item.status === 'completed' && item.filePath) {
      Alert.alert('File Location', `File saved at: ${item.filePath}`);
    } else {
      // Open the action modal for other statuses
      setSelectedDownload(item);
      setShowActionModal(true);
    }
  };

  const handleDownloadAction = async (action: string, downloadItem: DownloadItem) => {
    console.log('Download action requested:', action, 'for item:', downloadItem.id);

    // Close modal first
    setShowActionModal(false);

    if (!downloadItem.id) {
      console.error('No download ID found for action:', action);
      Alert.alert('Error', 'Unable to perform action: Invalid download ID');
      return;
    }

    try {
      switch (action) {
        case 'pause':
          console.log('Pausing download:', downloadItem.id);
          fileDownloadService.pauseDownload(downloadItem.id);
          showToast('Download Paused', `"${downloadItem.fileName || downloadItem.title}" has been paused`);
          break;

        case 'resume':
          console.log('Resuming download:', downloadItem.id);
          await fileDownloadService.resumeDownload(downloadItem.id);
          showToast('Download Resumed', `"${downloadItem.fileName || downloadItem.title}" has been resumed`);
          break;

        case 'cancel':
          Alert.alert(
            'Cancel Download',
            `Are you sure you want to cancel "${downloadItem.fileName || downloadItem.title}"?`,
            [
              { text: 'NO', style: 'cancel' },
              {
                text: 'YES, CANCEL',
                style: 'destructive',
                onPress: () => {
                  console.log('Cancelling download:', downloadItem.id);
                  fileDownloadService.cancelDownload(downloadItem.id!);
                  showToast('Download Cancelled', `"${downloadItem.fileName || downloadItem.title}" has been cancelled`);
                  setTimeout(() => loadDownloads(), 500); // Refresh after short delay
                }
              }
            ]
          );
          return; // Don't refresh downloads here, it will be done in the alert callback

        case 'retry':
          console.log('Retrying download:', downloadItem.id);
          await fileDownloadService.retryDownload(downloadItem.id);
          showToast('Download Restarted', `"${downloadItem.fileName || downloadItem.title}" is being retried`);
          break;

        case 'delete':
          Alert.alert(
            'Delete Download',
            `Are you sure you want to delete "${downloadItem.fileName || downloadItem.title}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  console.log('Deleting download:', downloadItem.id);
                  await fileDownloadService.deleteDownload(downloadItem.id!);
                  showToast('Download Deleted', `"${downloadItem.fileName || downloadItem.title}" has been deleted`);
                  setTimeout(() => loadDownloads(), 500); // Refresh after short delay
                }
              }
            ]
          );
          return; // Don't refresh downloads here, it will be done in the alert callback
      }

      // Refresh downloads for immediate actions that don't involve an alert
      setTimeout(() => loadDownloads(), 200);

    } catch (error) {
      console.error('Error performing download action:', error);
      Alert.alert('Error', `Failed to ${action} download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showToast = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const getTotalDownloads = () => downloads.length;
  const getActiveDownloads = () => downloads.filter(d => d.status === 'downloading').length;
  const getTotalSize = () => {
    return downloads.reduce((total, download) => total + (download.contentLength || download.size || 0), 0);
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => {
    const progress = item.progress || 0;
    const isCompleted = item.status === 'completed';
    const isActive = item.status === 'downloading' || item.status === 'pending';
    const isPaused = item.status === 'paused';
    const isFailed = item.status === 'failed';

    const getStatusColor = () => {
      if (isCompleted) return '#4CAF50';
      if (isFailed) return '#F44336';
      if (isPaused) return '#FF9800';
      if (item.status === 'downloading') return '#00D4AA'; // Downloading color
      return '#FFC107'; // Pending color
    };

    // Generate movie poster URL if available
    const getPosterUrl = () => {
      if (item.posterPath && item.posterPath !== '/placeholder-movie.jpg' && item.posterPath.trim() !== '') {
        // If it's a full URL, use it directly
        if (item.posterPath.startsWith('http')) {
          return item.posterPath;
        }
        // If it's a TMDb path, construct the full URL
        if (item.posterPath.startsWith('/')) {
          return `https://image.tmdb.org/t/p/w300${item.posterPath}`;
        }
      }

      return null;
    };

    const posterUrl = getPosterUrl();
    console.log('Poster URL for', item.title, ':', posterUrl);

    return (
      <TouchableOpacity
        style={styles.downloadItem}
        onPress={() => handleDownloadPress(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.8)']}
          style={styles.downloadCard}
        >
          <View style={styles.posterContainer}>
            <View style={styles.posterPlaceholder}>
              <Ionicons
                name="film"
                size={28}
                color="#00D4AA"
              />
              <Text style={styles.posterPlaceholderText}>
                {item.quality || 'HD'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Ionicons
                name={getStatusIcon(item.status)}
                size={12}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.downloadInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.movieTitle} numberOfLines={1}>
                {item.title || 'Unknown Movie'}
              </Text>
              {(item.status === 'downloading' || item.status === 'pending') && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeIndicatorText}>•</Text>
                </View>
              )}
            </View>
            <View style={styles.downloadMeta}>
              <Text style={styles.downloadSize}>
                {formatFileSize(item.contentLength || item.size || 0)}
              </Text>
              <Text style={[styles.downloadStatus, { color: getStatusColor() }]}>
                {item.status === 'downloading' ? 'Downloading' : 
                 item.status === 'completed' ? 'Completed' : 
                 item.status === 'paused' ? 'Paused' : 
                 item.status === 'failed' ? 'Failed' : 'Pending'}
              </Text>
            </View>

            {item.status === 'downloading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: getStatusColor()
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress.toFixed(1)}%
                </Text>
              </View>
            )}

            {item.status === 'downloading' && (
              <View style={styles.downloadStats}>
                <Text style={styles.statText}>
                  Downloaded: {formatFileSize(item.bytesWritten)} / {formatFileSize(item.contentLength)}
                </Text>
                {item.speed > 0 && (
                  <Text style={styles.statText}>
                    Speed: {formatSpeed(item.speed)} • Time: {formatTimeRemaining(item.estimatedTime)}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.statusRow}>
              <Ionicons
                name={getStatusIcon(item.status)}
                size={16}
                color={getStatusColor()}
              />
              <Text style={[styles.status, { color: getStatusColor() }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                {item.status === 'downloading' && ` • ${progress.toFixed(1)}%`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedDownload(item);
              setShowActionModal(true);
            }}
            activeOpacity={0.9}
          >
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
  };

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
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/movies')}
      >
        <LinearGradient
          colors={['#00D4AA', '#007A88']}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonText}>Browse Movies</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowActionModal(false);
        setSelectedDownload(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.actionModalContainer}>
          <Text style={styles.actionModalTitle}>Download Options</Text>
          <Text style={styles.actionModalSubtitle}>
            What would you like to do with "{selectedDownload?.title}"?
          </Text>

          <View style={styles.actionModalButtons}>
            {selectedDownload?.status === 'downloading' && (
              <TouchableOpacity
                style={styles.actionModalButton}
                onPress={() => handleDownloadAction('pause', selectedDownload)}
                activeOpacity={0.7}
              >
                <Ionicons name="pause" size={20} color="#FF9800" />
                <Text style={styles.actionModalButtonText}>Pause</Text>
              </TouchableOpacity>
            )}

            {selectedDownload?.status === 'paused' && (
              <TouchableOpacity
                style={styles.actionModalButton}
                onPress={() => handleDownloadAction('resume', selectedDownload)}
                activeOpacity={0.7}
              >
                <Ionicons name="play" size={20} color="#4CAF50" />
                <Text style={styles.actionModalButtonText}>Resume</Text>
              </TouchableOpacity>
            )}

            {['downloading', 'paused'].includes(selectedDownload?.status || '') && (
              <TouchableOpacity
                style={[styles.actionModalButton, styles.cancelButton]}
                onPress={() => handleDownloadAction('cancel', selectedDownload)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#F44336" />
                <Text style={[styles.actionModalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            )}

            {selectedDownload?.status === 'failed' && (
              <>
                <TouchableOpacity
                  style={styles.actionModalButton}
                  onPress={() => handleDownloadAction('retry', selectedDownload!)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="#2196F3" />
                  <Text style={styles.actionModalButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionModalButton, styles.deleteButton]}
                  onPress={() => handleDownloadAction('delete', selectedDownload!)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                  <Text style={[styles.actionModalButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}

            {['completed', 'cancelled'].includes(selectedDownload?.status || '') && (
              <TouchableOpacity
                style={[styles.actionModalButton, styles.deleteButton]}
                onPress={() => handleDownloadAction('delete', selectedDownload)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color="#F44336" />
                <Text style={[styles.actionModalButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.actionModalCancelButton}
            onPress={() => {
              setShowActionModal(false);
              setSelectedDownload(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionModalCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const filteredDownloads = getFilteredDownloads();

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.headerIcon}
          >
            <Ionicons name="download" size={24} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.headerTitle}>My Downloads</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowDownloadManager(true)}>
            <Ionicons name="folder-open" size={24} color="#00D4AA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={() => setShowDownloadSettings(true)}>
            <Ionicons name="settings" size={24} color="#00D4AA" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Alert.alert(
                'Clear All Downloads',
                'This will remove all download history. Are you sure?',
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
            }}
          >
            <Ionicons name="trash" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>

      </View>



      {/* Notification */}
      {notification.visible && (
        <View style={styles.notificationContainer}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.2)', 'rgba(22, 163, 74, 0.1)']}
            style={styles.notificationGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={styles.notificationText}>{notification.message}</Text>
            <TouchableOpacity
              onPress={() => setNotification(prev => ({ ...prev, visible: false }))}
              style={styles.notificationClose}
            >
              <Ionicons name="close" size={16} color="#22C55E" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: 'All Files', count: getTotalDownloads() },
          { key: 'active', label: 'Active', count: getActiveDownloads() },
          { key: 'completed', label: 'Completed', count: downloads.filter(d => d.status === 'completed').length }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <LinearGradient
              colors={selectedTab === tab.key
                ? ['#00D4AA', '#007A88']
                : ['transparent', 'transparent']
              }
              style={styles.tabGradient}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Downloads List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D4AA"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredDownloads.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredDownloads.map((item) => ( // Removed index from map as key is item.id
            <View key={item.id}>
              {renderDownloadItem({ item })}
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total Downloads: {getTotalDownloads()} • Active: {getActiveDownloads()}
        </Text>
      </View>

      {/* Action Modal */}
      {renderActionModal()}

      {/* Download Manager */}
      <DownloadManager
        visible={showDownloadManager}
        onClose={() => setShowDownloadManager(false)}
      />

      {/* Download Settings */}
      <DownloadSettings
        visible={showDownloadSettings}
        onClose={() => setShowDownloadSettings(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 12,
    padding: 5,
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTab: {},
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
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
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  downloadItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  downloadCard: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  posterContainer: {
    position: 'relative',
    marginRight: 16,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  posterPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  posterPlaceholderText: {
    color: '#00D4AA',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  downloadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadSize: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  downloadStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
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
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 40,
  },
  downloadStats: {
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
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
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionModalButtons: {
    marginBottom: 16,
  },
  actionModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  actionModalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  notificationContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  notificationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  notificationText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 18,
  },
  notificationClose: {
    padding: 4,
    marginLeft: 8,
  },
});