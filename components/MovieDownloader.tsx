import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { downloadService } from '@/services/downloadService';


interface MovieFile {
  name: string;
  size: number;
  format: string;
  quality: string;
  downloadUrl: string;
}

interface MovieDownloaderProps {
  visible: boolean;
  onClose: () => void;
  movieTitle?: string;
  contentId?: number;
  contentType?: 'movie' | 'tv';
  posterPath?: string;
}

// Direct Internet Archive API calls - no backend needed
export function MovieDownloader({
  visible,
  onClose,
  movieTitle = '',
  contentId = 0,
  contentType = 'movie',
  posterPath = ''
}: MovieDownloaderProps) {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState(movieTitle);
  const [isSearching, setIsSearching] = useState(false);
  const [movieFiles, setMovieFiles] = useState<MovieFile[]>([]);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<any>(null);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [movieFound, setMovieFound] = useState(false);
  const [archiveIdentifier, setArchiveIdentifier] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState(movieTitle);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [showDownloadNotification, setShowDownloadNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');


  const showToast = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const showDownloadStartedNotification = (fileName: string) => {
    setNotificationMessage(`Download started: "${fileName}". Monitor progress in Downloads tab.`);
    setShowDownloadNotification(true);
    
    // Auto-hide notification after 6 seconds
    setTimeout(() => {
      setShowDownloadNotification(false);
    }, 6000);
  };

  const navigateToDownloads = () => {
    setShowDownloadNotification(false);
    onClose();
    router.push('/(tabs)/downloads');
  };

  // Auto-search when modal opens with movie title
  useEffect(() => {
    if (visible && movieTitle && movieTitle.trim() !== '') {
      setSearchQuery(movieTitle);
      // Auto-trigger search after a short delay
      const autoSearchTimer = setTimeout(() => {
        searchMovie();
      }, 500);

      return () => clearTimeout(autoSearchTimer);
    }
  }, [visible, movieTitle]);

  const handleDirectDownload = async (downloadUrl: string, fileName?: string) => {
    try {
      console.log('=== DIRECT DOWNLOAD STARTED ===');
      console.log('Download URL:', downloadUrl);
      console.log('Filename:', fileName);

      setDownloadingFiles(prev => new Set(prev).add(downloadUrl));
      setIsDownloading(true);
      setDownloadProgress(0);
      setProgressInfo(null);
      setDownloadSpeed(0);
      setEstimatedTime(0);
      setStatusMessage('Initializing download...');

      // Use the real file download service for automatic download
      const fileDownloadServiceModule = await import('../services/fileDownloadService');
      const fileDownloadService = fileDownloadServiceModule.fileDownloadService;

      // Check if downloads are supported on this platform
      if (!fileDownloadService.isSupported()) {
        console.log('Platform not supported for downloads');
        Alert.alert(
          'Platform Not Supported',
          'File downloads are only available on mobile devices. Please use the mobile app to download files.',
          [{ text: 'OK' }]
        );
        setDownloadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(downloadUrl);
          return newSet;
        });
        setIsDownloading(false);
        setStatusMessage('');
        return;
      }

      // First check current permission status
      setStatusMessage('Checking existing permissions...');
      console.log('Checking current permission status...');
      const currentPermissionStatus = await fileDownloadService.checkPermissionStatus();
      console.log('Current permission status:', currentPermissionStatus);

      if (currentPermissionStatus) {
        console.log('Permissions already granted - proceeding with download');
        setStatusMessage('Permissions confirmed - starting download...');
      } else {
        console.log('Permissions not granted - requesting permissions');
        setStatusMessage('Requesting storage permissions...');

        const hasPermission = await fileDownloadService.requestStoragePermissions();
        console.log('Permission request result:', hasPermission);

        if (!hasPermission) {
          console.log('Permissions denied by user');
          setDownloadingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(downloadUrl);
            return newSet;
          });
          setIsDownloading(false);
          setStatusMessage('Permission denied');
          showToast('Permission Required', 'Storage permission is required to download movies. Please grant permission in app settings and try again.');
          return;
        }
      }

      setStatusMessage('Starting download...');

      const downloadId = await fileDownloadService.startDownload(
        downloadUrl,
        fileName || 'Movie Download',
        searchTitle || movieTitle,
        {
          onProgress: (progress) => {
            console.log(`Download progress: ${progress.progress}%`);
            setDownloadProgress(progress.progress);
            setProgressInfo(progress);
            setStatusMessage(`Downloading... ${progress.progress.toFixed(1)}%`);

            // Update speed and time estimates
            if (progress.speed > 0) {
              setDownloadSpeed(progress.speed);
              setEstimatedTime(progress.estimatedTime);
            }
          },
          onComplete: (filePath) => {
            console.log(`Download completed: ${filePath}`);
            setIsDownloading(false);
            setDownloadingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(downloadUrl);
              return newSet;
            });
            setDownloadProgress(100);
            setStatusMessage('Download completed successfully!');

            // Show success modal instead of alert
            setSuccessMessage(`"${fileName || 'Movie'}" has been downloaded start successfully!\n\nFile saved to Downloads folder\n\nYou can find it in the Downloads section of this app.`);
            setShowSuccessModal(true);
          },
          onError: (error) => {
            console.error(`Download failed: ${error}`);
            setIsDownloading(false);
            setDownloadingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(downloadUrl);
              return newSet;
            });
            setDownloadProgress(0);
            setStatusMessage(`Download failed: ${error}`);
            showToast('Download Failed', error instanceof Error ? error.message : 'Failed to start download.');
          }
        }
      );

      setDownloadId(downloadId);

      // Show download started notification
      showDownloadStartedNotification(fileName || 'Movie');
      
      setSuccessMessage(`Download started for "${fileName || 'Movie'}"!\n\nYou can monitor the progress in the Downloads section.\n\nThe file will be saved to your Downloads folder when complete.`);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Direct download error:', error);
      setIsDownloading(false);
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadUrl);
        return newSet;
      });
      setDownloadProgress(0);
      setStatusMessage('Download failed');
      showToast('Download Failed', error instanceof Error ? error.message : 'Failed to start download. Please try again.');
    }
  };

  const searchMovie = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a movie title to search.');
      return;
    }

    setIsSearching(true);
    setMovieFiles([]);
    setArchiveIdentifier('');

    try {
      console.log('🔍 Starting search for:', searchQuery);

      // Search for movie on Internet Archive
      const searchResult = await downloadService.searchInternetArchive(searchQuery);

      console.log('🎬 Search result:', searchResult);
      console.log('📝 Search details:', {
        found: searchResult.found,
        identifier: searchResult.identifier,
        title: searchResult.title
      });

      if (!searchResult.found) {
        console.log('No movie found, search result:', searchResult);
        setIsSearching(false);
        setMovieFound(false);
        setMovieFiles([]);
        // Show additional helpful message
        if (searchResult.error?.includes('No movie archives found')) {
          showToast('Search Tips', 'Try searching with:\n• Full movie title\n• Title + year (e.g. "Inception 2010")\n• Alternative titles\n• Director name + title');
        } else {
          showToast('Movie Not Found', searchResult.error || 'No movies found with that title. Please try a different search term.');
        }
        return;
      }

      if (!searchResult.identifier) {
        console.log('No identifier found in search result');
        setIsSearching(false);
        setMovieFound(false);
        Alert.alert('Search Error', 'Invalid search result received. Please try again.');
        return;
      }

      console.log('Found identifier:', searchResult.identifier);
      setArchiveIdentifier(searchResult.identifier);

      // Get movie files and metadata
      console.log('Fetching files for identifier:', searchResult.identifier);
      const filesResult = await downloadService.getInternetArchiveFiles(searchResult.identifier);

      console.log('Files result:', filesResult);

      if (!filesResult.success) {
        console.log('Files fetch failed:', filesResult.error);
        setIsSearching(false);
        setMovieFound(false);
        setMovieFiles([]);
        if (filesResult.error?.includes('No video files found')) {
          showToast('Archive Issue', 'This archive exists but contains no video files. Try searching for a different version or title.');
        } else {
          showToast('Files Load Error', filesResult.error || 'Failed to load movie files. Please try again.');
        }
        return;
      }

      if (filesResult.files.length === 0) {
        console.log('No files in successful result');
        setIsSearching(false);
        setMovieFound(false);
        setMovieFiles([]);
        Alert.alert('No Video Files', 'This archive contains files but no video content. Try searching for a different movie or check your spelling.');
        return;
      }

      console.log('Setting movie files:', filesResult.files);
      setMovieFiles(filesResult.files);
      setMovieFound(true);

      // Show more detailed success message
      const totalSize = filesResult.files.reduce((sum, file) => sum + file.size, 0);
      const sizeText = totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)}GB` : `${totalSize}MB`;
      console.log('Movie found successfully, files count:', filesResult.files.length);
      showToast('Movie Found!', `Found ${filesResult.files.length} video file(s) for "${searchResult.title}"\nTotal size: ${sizeText}`);
    } catch (error) {
      console.error('Search error:', error);
      setMovieFound(false);
      setMovieFiles([]);
      showToast('Unexpected Error', 'An unexpected error occurred. Please check your internet connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const startDownload = () => {
    if (movieFiles.length === 0) {
      showToast('Error', 'No files available for download');
      return;
    }

    if (movieFiles.length === 1) {
      // If only one file, download directly
      downloadMovie(archiveIdentifier, searchTitle || movieTitle); // Pass identifier and title
    } else {
      // Show quality selection modal
      setShowQualityModal(true);
    }
  };

  const downloadMovie = async (identifier: string, title: string) => {
    try {
      console.log('=== MOVIE DOWNLOAD STARTED ===');
      console.log('Identifier:', identifier);
      console.log('Title:', title);

      setShowQualityModal(false);
      setIsDownloading(true);
      setDownloadProgress(0);
      setProgressInfo(null);
      setDownloadSpeed(0);
      setEstimatedTime(0);
      setStatusMessage('Initializing movie download...');

      // Import the file download service
      const fileDownloadServiceModule = await import('../services/fileDownloadService');
      const fileDownloadService = fileDownloadServiceModule.fileDownloadService;

      // Check if downloads are supported
      if (!fileDownloadService.isSupported()) {
        console.log('Platform not supported for downloads');
        Alert.alert(
          'Platform Not Supported',
          'File downloads are only available on mobile devices. Please use the mobile app to download files.',
          [{ text: 'OK' }]
        );
        setIsDownloading(false);
        setStatusMessage('');
        return;
      }

      // Check current permission status first
      setStatusMessage('Verifying storage permissions...');
      console.log('Checking current permission status...');
      const currentPermissionStatus = await fileDownloadService.checkPermissionStatus();
      console.log('Current permission status:', currentPermissionStatus);

      if (currentPermissionStatus) {
        console.log('Permissions already granted - proceeding with download');
        setStatusMessage('Permissions verified - preparing download...');
      } else {
        console.log('Permissions not granted - requesting permissions');
        setStatusMessage('Requesting storage permissions...');

        const hasPermission = await fileDownloadService.requestStoragePermissions();
        console.log('Permission request result:', hasPermission);

        if (!hasPermission) {
          console.log('Permissions denied by user');
          setIsDownloading(false);
          setStatusMessage('Permission denied');
          showToast('Permission Required', 'Storage permission is required to download movies. Please check app settings and ensure "Files and media" permission is enabled.');
          return;
        }
      }

      setStatusMessage('Preparing download...');

      // Get metadata to find the best video file
      const metadataUrl = `https://archive.org/metadata/${identifier}`;
      console.log('Fetching metadata from:', metadataUrl);

      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to get metadata: ${metadataResponse.status}`);
      }

      const metadata = await metadataResponse.json();
      console.log('Metadata response:', metadata);

      if (!metadata.files || !Array.isArray(metadata.files)) {
        throw new Error('No files found in metadata');
      }

      // Filter and sort video files by quality and size
      const videoFiles = metadata.files.filter((file: any) => {
        const name = file.name?.toLowerCase() || '';
        const format = file.format?.toLowerCase() || '';

        // Video file extensions
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
        const hasVideoExtension = videoExtensions.some(ext => name.endsWith(ext));

        // Video formats from Internet Archive
        const videoFormats = ['mpeg4', 'h.264', 'matroska', 'ogg video', 'quicktime', 'windows media'];
        const hasVideoFormat = videoFormats.some(fmt => format.includes(fmt));

        // Ensure minimum file size (video files are typically larger than 50MB)
        const fileSize = file.size ? parseInt(file.size) : 0;
        const isLargeEnough = fileSize > 50000000; // 50MB minimum

        return (hasVideoExtension || hasVideoFormat) && isLargeEnough;
      }).sort((a: any, b: any) => {
        // Sort by file size (largest first, assuming better quality)
        const sizeA = parseInt(a.size || '0');
        const sizeB = parseInt(b.size || '0');
        return sizeB - sizeA;
      });

      console.log('Found video files:', videoFiles.length);

      if (videoFiles.length === 0) {
        throw new Error('No suitable video files found for download');
      }

      // Use the largest video file (assuming best quality)
      const selectedFile = videoFiles[0];
      const downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(selectedFile.name)}?download=1`;

      console.log('Selected file for download:', selectedFile.name);
      console.log('Download URL:', downloadUrl);

      setStatusMessage('Starting download...');

      // Start the real file download
      const downloadId = await fileDownloadService.startDownload(
        downloadUrl,
        selectedFile.name,
        title,
        {
          onProgress: (progress) => {
            setDownloadProgress(progress.progress);
            setProgressInfo(progress);
            setDownloadSpeed(progress.speed);
            setEstimatedTime(progress.estimatedTime);

            // Update status message with real-time info
            if (progress.status === 'downloading') {
              setStatusMessage(`Downloading... ${progress.progress.toFixed(1)}%`);
            } else if (progress.status === 'paused') {
              setStatusMessage('Download paused');
            } else {
              setStatusMessage(progress.status);
            }
          },
          onComplete: (filePath) => {
            setIsDownloading(false);
            setDownloadingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(downloadUrl);
              return newSet;
            });
            setDownloadProgress(100);
            setStatusMessage('Download completed successfully!');

            Alert.alert(
              '✅ Download Started!',
              `"${title}" has been downloaded successfully!\n\nFile: ${selectedFile.name}\nLocation: Downloads folder\n\nYou can find your downloaded movie in the Downloads section of this app.`,
              [
                { text: 'View', onPress: () => {
                  onClose();
                  // Navigate to downloads tab
                }},
                { text: 'OK', onPress: () => onClose() }
              ]
            );
          },
          onError: (error) => {
            setIsDownloading(false);
            setDownloadingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(downloadUrl);
              return newSet;
            });
            setDownloadProgress(0);
            setStatusMessage(`Download failed: ${error}`);

            Alert.alert(
              'Download Failed',
              `Failed to download "${title}": ${error}\n\nPlease check your internet connection and storage space, then try again.`,
              [{ text: 'OK' }]
            );
          }
        },
        {
          posterPath: posterPath || '',
          contentId: contentId,
          contentType: contentType
        }
      );

      setDownloadId(downloadId);

      // Show download started notification
      showDownloadStartedNotification(title);
      
      setSuccessMessage(`Download started for "${title}"!\n\nYou can monitor the progress in the Downloads section.\n\nThe file will be saved to your Downloads folder when complete.`);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadUrl);
        return newSet;
      });
      setDownloadProgress(0);
      setStatusMessage('Download failed');
      Alert.alert(
        'Download Error',
        error instanceof Error ? error.message : 'Failed to start download'
      );
    }
  };

  const startPlay = async () => {
    if (movieFiles.length === 0) {
      showToast('Error', 'No video files available for playback');
      return;
    }

    try {
      console.log('Play button clicked - opening directly in browser');

      // Use the first/best quality file for streaming
      const selectedFile = movieFiles[0];

      // Remove download parameter for streaming playback
      const streamUrl = selectedFile.downloadUrl.replace('?download=1', '');
      console.log('Opening streaming URL in browser:', streamUrl);

      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(streamUrl, {
        presentationStyle: 'fullScreen',
        showTitle: true,
        showInRecents: true,
        enableBarCollapsing: false,
        dismissButtonStyle: 'done'
      });

      // Close the downloader modal after opening in browser
      onClose();

    } catch (error) {
      console.error('Play error:', error);
      showToast('Playback Failed', 'Could not open video in browser. Please try again.');
    }
  };

  const openExternalPlatform = async (url: string) => {
    try {
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(url, {
        presentationStyle: 'pageSheet',
        showTitle: true,
        showInRecents: true,
        dismissButtonStyle: 'done',
        toolbarColor: '#1a1a1a',
        controlsColor: '#fff',
        enableBarCollapsing: false
      });
    } catch (error) {
      console.error('Error opening external platform:', error);
      Alert.alert('Error', 'Failed to open platform. Please try again.');
    }
  };


  const cancelDownload = async () => {
    if (downloadId) {
      try {
        const fileDownloadServiceModule = await import('../services/fileDownloadService');
        const fileDownloadService = fileDownloadServiceModule.fileDownloadService;
        fileDownloadService.cancelDownload(downloadId);
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadId(null);
        setStatusMessage('Download cancelled');
        showToast('Download Cancelled', 'Download has been cancelled');
      } catch (error) {
        console.error('Cancel download error:', error);
      }
    }
  };

  const retryDownload = () => {
    if (downloadId) {
      downloadService.retryDownload(downloadId);
      showToast('Retry Started', 'Download has been restarted');
    }
  };

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';

    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let size = bytesPerSecond;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return 'Calculating...';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const renderQualityModal = () => (
    <Modal
      visible={showQualityModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowQualityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Quality</Text>
            <TouchableOpacity
              onPress={() => setShowQualityModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.qualityList}>
            {movieFiles.map((file, index) => {
              const isDownloading = downloadingFiles.has(file.downloadUrl);
              return (
                <TouchableOpacity
                  key={`quality-${file.name}-${index}`}
                  style={[
                    styles.qualityOption,
                    isDownloading && { opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.02)' }
                  ]}
                  onPress={() => {
                    if (!isDownloading) {
                      handleDirectDownload(file.downloadUrl, file.name);
                    }
                  }}
                  disabled={isDownloading}
                >
                  <View style={styles.qualityInfo}>
                    <Text style={[
                      styles.qualityText,
                      isDownloading && { color: 'rgba(255,255,255,0.5)' }
                    ]}>
                      {file.quality} - {formatFileSize(file.size)} - {file.format}
                    </Text>
                    <Text style={[
                      styles.fileName,
                      isDownloading && { color: 'rgba(255,255,255,0.4)' }
                    ]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    {isDownloading && (
                      <Text style={styles.downloadingText}>
                        Downloading...
                      </Text>
                    )}
                  </View>
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : (
                    <Ionicons name="download" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDownloadNotification = () => (
    showDownloadNotification && (
      <View style={styles.downloadNotificationContainer}>
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.95)', 'rgba(56, 142, 60, 0.95)']}
          style={styles.downloadNotificationGradient}
        >
          <View style={styles.downloadNotificationContent}>
            <View style={styles.downloadNotificationLeft}>
              <Ionicons name="download" size={24} color="#FFFFFF" />
              <View style={styles.downloadNotificationText}>
                <Text style={styles.downloadNotificationTitle}>Download Started!</Text>
                <Text style={styles.downloadNotificationMessage}>{notificationMessage}</Text>
              </View>
            </View>
            
            <View style={styles.downloadNotificationActions}>
              <TouchableOpacity
                style={styles.downloadNotificationButton}
                onPress={navigateToDownloads}
                activeOpacity={0.7}
              >
                <Text style={styles.downloadNotificationButtonText}>View Downloads</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.downloadNotificationClose}
                onPress={() => setShowDownloadNotification(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    )
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          </View>

          <Text style={styles.successTitle}>Download Started!</Text>

          <Text style={styles.successMessage}>
            {successMessage}
          </Text>

          <View style={styles.successButtons}>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigateToDownloads();
              }}
            >
              <Text style={styles.successButtonText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.successButton, styles.successButtonSecondary]}
              onPress={() => {
                setShowSuccessModal(false);
                onClose();
              }}
            >
              <Text style={[styles.successButtonText, styles.successButtonTextSecondary]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );



  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {renderDownloadNotification()}
        
        <View style={styles.header}>
          <Text style={styles.title}>Movie Downloader</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Search Movie on Internet Archive</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter movie title or direct download URL..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                editable={!isSearching}
              />
              <TouchableOpacity
                style={[styles.searchButton, isSearching && styles.disabledButton]}
                onPress={() => {
                  if (searchQuery.includes('archive.org/download/')) {
                    // Direct download URL
                    handleDirectDownload(searchQuery);
                  } else {
                    // Search for movie
                    searchMovie();
                  }
                }}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={searchQuery.includes('archive.org/download/') ? "download" : "search"} size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {searchQuery.includes('archive.org/download/') && (
              <Text style={styles.directUrlHint}>
                💡 Direct download URL detected - Click to download
              </Text>
            )}
          </View>

          {movieFound && movieFiles && movieFiles.length > 0 && (
            <View style={styles.downloadSection}>
              <Text style={styles.sectionTitle}>
                Found {movieFiles.length} file(s) - Available Files
              </Text>

              <View style={styles.filesPreview}>
                <Text style={styles.archiveInfoTitle}>Available Files:</Text>
                {movieFiles.slice(0, 4).map((file, index) => (
                  <TouchableOpacity
                    key={`${file.name}-${index}`}
                    style={[
                      styles.fileInfoContainer,
                      downloadingFiles.has(file.downloadUrl) && { opacity: 0.7 }
                    ]}
                    onPress={() => {
                      if (!downloadingFiles.has(file.downloadUrl)) {
                        downloadMovie(archiveIdentifier, searchTitle || movieTitle);
                      }
                    }}
                    disabled={downloadingFiles.has(file.downloadUrl)}
                  >
                    <View style={styles.fileDetails}>
                      <Text style={[
                        styles.fileInfo,
                        downloadingFiles.has(file.downloadUrl) && { color: 'rgba(255,255,255,0.6)' }
                      ]}>
                        📹 {file.quality} • {formatFileSize(file.size)} • {file.format}
                      </Text>
                      <Text style={[
                        styles.fileName,
                        downloadingFiles.has(file.downloadUrl) && { color: 'rgba(255,255,255,0.5)' }
                      ]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      {downloadingFiles.has(file.downloadUrl) && (
                        <Text style={styles.downloadingText}>
                          Download in progress...
                        </Text>
                      )}
                    </View>
                    <View style={styles.downloadBrowserContainer}>
                      <TouchableOpacity
                        style={[
                          styles.iconButton, 
                          { 
                            backgroundColor: downloadingFiles.has(file.downloadUrl) ? '#999' : '#FF9800',
                            opacity: downloadingFiles.has(file.downloadUrl) ? 0.5 : 1
                          }
                        ]}
                        onPress={async () => {
                          if (downloadingFiles.has(file.downloadUrl)) return;
                          
                          try {
                            // Remove download parameter for streaming
                            const streamUrl = file.downloadUrl.replace('?download=1', '');
                            console.log('Opening streaming URL in browser:', streamUrl);

                            const { openBrowserAsync } = await import('expo-web-browser');
                            await openBrowserAsync(streamUrl, {
                              presentationStyle: 'fullScreen',
                              showTitle: true,
                              showInRecents: true,
                              enableBarCollapsing: false,
                              dismissButtonStyle: 'done'
                            });

                            onClose();
                          } catch (error) {
                            console.error('Play error:', error);
                            showToast('Play Error', 'Failed to open video for streaming');
                          }
                        }}
                        disabled={downloadingFiles.has(file.downloadUrl)}
                      >
                        <Ionicons 
                          name="play" 
                          size={20} 
                          color={downloadingFiles.has(file.downloadUrl) ? "#ccc" : "#fff"} 
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.iconButton,
                          {
                            backgroundColor: downloadingFiles.has(file.downloadUrl) ? '#666' : '#4CAF50',
                            opacity: downloadingFiles.has(file.downloadUrl) ? 0.5 : 1
                          }
                        ]}
                        onPress={() => {
                          if (!downloadingFiles.has(file.downloadUrl)) {
                            try {
                              handleDirectDownload(file.downloadUrl, file.name);
                            } catch (error) {
                              console.error('Download button error:', error);
                              showToast('Download Error', 'Failed to start download. Please try again.');
                            }
                          }
                        }}
                        disabled={downloadingFiles.has(file.downloadUrl)}
                      >
                        {downloadingFiles.has(file.downloadUrl) ? (
                          <ActivityIndicator size="small" color="#ccc" />
                        ) : (
                          <Ionicons name="download" size={20} color="#fff" />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.iconButton, 
                          { 
                            backgroundColor: downloadingFiles.has(file.downloadUrl) ? '#999' : '#2196F3',
                            opacity: downloadingFiles.has(file.downloadUrl) ? 0.5 : 1
                          }
                        ]}
                        onPress={async () => {
                          if (downloadingFiles.has(file.downloadUrl)) return;
                          
                          try {
                            // Keep download parameter for browser downloads
                            console.log('Opening browser with download URL:', file.downloadUrl);

                            const { openBrowserAsync } = await import('expo-web-browser');
                            await openBrowserAsync(file.downloadUrl, {
                              presentationStyle: 'fullScreen',
                              showTitle: true,
                              showInRecents: true,
                              enableBarCollapsing: false,
                              dismissButtonStyle: 'done'
                            });

                            // Close modal after opening in browser
                            onClose();
                          } catch (error) {
                            console.error('Browser open error:', error);
                            showToast('Browser Error', 'Failed to open download in browser');
                          }
                        }}
                        disabled={downloadingFiles.has(file.downloadUrl)}
                      >
                        <Ionicons 
                          name="globe" 
                          size={20} 
                          color={downloadingFiles.has(file.downloadUrl) ? "#ccc" : "#fff"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
                {movieFiles.length > 4 && (
                  <TouchableOpacity
                    style={styles.showAllButton}
                    onPress={() => setShowQualityModal(true)}
                  >
                    <Text style={styles.showAllText}>
                      View all {movieFiles.length} files
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#2196F3" />
                  </TouchableOpacity>
                )}
                <Text style={styles.archiveId}>
                  Archive ID: {archiveIdentifier}
                </Text>
              </View>
            </View>
          )}

          {!movieFound && !isSearching && searchQuery.trim().length > 0 && (
            <View style={styles.noResultsSection}>
              <Ionicons name="search" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.noResultsTitle}>No Movie Found</Text>
              <Text style={styles.noResultsText}>
                Try searching with a different title or check your spelling
              </Text>
            </View>
          )}

          {/* External Platforms Section */}
          <View style={styles.externalPlatformsSection}>
            <Text style={styles.externalPlatformTitle}>External Platforms</Text>
            <Text style={styles.externalPlatformSubtitle}>Browse movies on external streaming platforms</Text>

            <View style={styles.externalPlatformContainer}>
              <Text style={styles.externalPlatformHeader}>Available Platforms:</Text>
              <ScrollView
                style={styles.platformScrollView}
                contentContainerStyle={styles.platformScrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <TouchableOpacity
                  style={styles.platformCard}
                  onPress={() => openExternalPlatform('https://thekitchenspot.net')}
                >
                  <View style={styles.platformCardContent}>
                    <View style={styles.platformCardLeft}>
                      <Text style={styles.platformCardIcon}>🍿</Text>
                      <View style={styles.platformCardInfo}>
                        <Text style={styles.platformCardName}>The Kitchen Spot</Text>
                        <Text style={styles.platformCardDesc}>Movie streaming and download platform</Text>
                      </View>
                    </View>
                    <View style={styles.platformCardActions}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => openExternalPlatform('https://thekitchenspot.net')}
                      >
                        <Ionicons name="open-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.platformCard}
                  onPress={() => openExternalPlatform('https://fmovies.to')}
                >
                  <View style={styles.platformCardContent}>
                    <View style={styles.platformCardLeft}>
                      <Text style={styles.platformCardIcon}>🎬</Text>
                      <View style={styles.platformCardInfo}>
                        <Text style={styles.platformCardName}>Fmovies</Text>
                        <Text style={styles.platformCardDesc}>Free movie and TV show streaming</Text>
                      </View>
                    </View>
                    <View style={styles.platformCardActions}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => openExternalPlatform('https://fmovies.to')}
                      >
                        <Ionicons name="open-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.platformCard}
                  onPress={() => openExternalPlatform('https://yesmovies.ag')}
                >
                  <View style={styles.platformCardContent}>
                    <View style={styles.platformCardLeft}>
                      <Text style={styles.platformCardIcon}>✅</Text>
                      <View style={styles.platformCardInfo}>
                        <Text style={styles.platformCardName}>YesMovies</Text>
                        <Text style={styles.platformCardDesc}>Free online movie streaming platform</Text>
                      </View>
                    </View>
                    <View style={styles.platformCardActions}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => openExternalPlatform('https://yesmovies.ag')}
                      >
                        <Ionicons name="open-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>


          {isDownloading && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.sectionTitle}>Downloading Movie</Text>
                <Text style={styles.progressPercentage}>{downloadProgress.toFixed(1)}%</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
                </View>
              </View>

              <View style={styles.statusContainer}>
                <Text style={styles.statusMessage}>{statusMessage}</Text>
              </View>

              {progressInfo && (
                <View style={styles.progressDetails}>
                  <View style={styles.progressDetailRow}>
                    <Text style={styles.progressDetailLabel}>Downloaded:</Text>
                    <Text style={styles.progressDetailValue}>
                      {formatFileSize(progressInfo.bytesWritten)} / {formatFileSize(progressInfo.contentLength)}
                    </Text>
                  </View>
                  {downloadSpeed > 0 && (
                    <>
                      <View style={styles.progressDetailRow}>
                        <Text style={styles.progressDetailLabel}>Speed:</Text>
                        <Text style={styles.progressDetailValue}>{formatSpeed(downloadSpeed)}</Text>
                      </View>
                      <View style={styles.progressDetailRow}>
                        <Text style={styles.progressDetailLabel}>Time remaining:</Text>
                        <Text style={styles.progressDetailValue}>{formatTime(estimatedTime)}</Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              <View style={styles.downloadActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelDownload}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={styles.cancelButtonText}>Cancel Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}



          <View style={styles.howItWorksSection}>
            <Text style={styles.howItWorksTitle}>How it works:</Text>
            <Text style={styles.howItWorksItem}>• Searches Internet Archive's movie collection</Text>
            <Text style={styles.howItWorksItem}>• Finds available video files in different qualities</Text>
            <Text style={styles.howItWorksItem}>• Downloads directly to your device storage</Text>
            <Text style={styles.howItWorksItem}>• Supports MP4, MKV, WebM formats</Text>
          </View>
        </ScrollView>

        {renderQualityModal()}
        {renderSuccessModal()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 0 : 20, // Add top padding for Android
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 15, // Extra top padding for iOS
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCloseButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 14,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  downloadSection: {
    marginBottom: 30,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flex: 1,
    marginRight: 10,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flex: 1,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  filesPreview: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  archiveInfoTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fileInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  moreFiles: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  archiveId: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  fileDetails: {
    flex: 1,
    marginRight: 12,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  showAllText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  noResultsSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercentage: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusMessage: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  downloadActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  progressDetails: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  progressDetailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  errorHelpSection: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorHelpTitle: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorHelpText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  directUrlHint: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playbackNote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  qualityList: {
    padding: 20,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qualityInfo: {
    flex: 1,
    marginRight: 12,
  },
  qualityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileName: {
    color: '#E0E0E0',
    fontSize: 12,
  },
  webNoticeText: {
    color: '#E50914',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  webDownloadContent: {
    padding: 20,
    maxHeight: '80%',
  },
  webDownloadInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  webDownloadInfoTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  webDownloadInfoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  // Updated style for the container with play, download and browser buttons
  downloadBrowserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  // Icon-only button style
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Adjusted style for downloadButtonText to be used by both buttons
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Styles for External Platforms section
  externalPlatformsSection: {
    marginBottom: 30,
  },
  externalPlatformTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  externalPlatformSubtitle: {
    color: 'rgba(255,107,53,0.8)',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  externalPlatformContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  externalPlatformHeader: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  platformScrollView: {
    maxHeight: 250,
    minHeight: 200,
  },
  platformScrollContent: {
    paddingBottom: 20,
  },
  platformCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  platformCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  platformCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  platformCardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  platformCardInfo: {
    flex: 1,
  },
  platformCardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  platformCardDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  platformCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  howItWorksSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  howItWorksTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  howItWorksItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  successModalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  successButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successButtonTextSecondary: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Download notification styles
  downloadNotificationContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadNotificationGradient: {
    borderRadius: 16,
  },
  downloadNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  downloadNotificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  downloadNotificationText: {
    marginLeft: 12,
    flex: 1,
  },
  downloadNotificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  downloadNotificationMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  downloadNotificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  downloadNotificationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  downloadNotificationClose: {
    padding: 4,
  },
  downloadingText: {
    color: '#FF9800',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
});