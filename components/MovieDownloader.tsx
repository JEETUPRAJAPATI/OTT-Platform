import React, { useState } from 'react';
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
  Platform, // Import Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadService } from '@/services/downloadService';
import { VideoPlayerModal } from './VideoPlayerModal';

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
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  const showToast = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleDirectDownload = async (downloadUrl: string) => {
    try {
      console.log('Opening download URL in browser:', downloadUrl);

      // Simply open the URL in browser
      await downloadService.downloadFile(downloadUrl, 'Movie Download');

      // Close the modal after opening URL
      onClose();

    } catch (error) {
      console.error('Direct download error:', error);
      showToast('Download Failed', 'Failed to open download URL. Please check the URL and try again.');
    }
  };

  const searchMovie = async (title: string) => {
    if (!title.trim()) {
      showToast('Error', 'Please enter a movie title');
      return;
    }

    setIsSearching(true);
    setMovieFound(false);
    setMovieFiles([]);
    setArchiveIdentifier('');

    try {
      console.log('🔍 Starting search for:', title.trim());

      // Search for movie on Internet Archive
      const searchResult = await downloadService.searchInternetArchive(title.trim());

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
      setShowQualityModal(false);
      setIsDownloading(true);

      console.log(`Starting real download for: ${title} (${identifier})`);

      // Import the file download service
      const { fileDownloadService } = await import('../services/fileDownloadService');

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

      // Start the real file download
      const downloadId = await fileDownloadService.startDownload(
        downloadUrl,
        selectedFile.name,
        title,
        {
          onProgress: (progress) => {
            setDownloadProgress(progress.progress);
            setProgressInfo(progress);

            // Update status message
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
            setDownloadProgress(100);
            setStatusMessage('Download completed!');

            Alert.alert(
              'Download Complete!',
              `"${title}" has been downloaded successfully to your Downloads folder.`,
              [
                { text: 'OK', onPress: () => onClose() },
                { text: 'Open Downloads', onPress: () => {
                  // You can implement opening downloads folder here
                  onClose();
                }}
              ]
            );
          },
          onError: (error) => {
            setIsDownloading(false);
            setStatusMessage(`Download failed: ${error}`);

            Alert.alert(
              'Download Failed',
              `Failed to download "${title}": ${error}`,
              [{ text: 'OK' }]
            );
          }
        }
      );

      setDownloadId(downloadId);
      setStatusMessage('Starting download...');

    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
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
      console.log('Play button clicked - opening best quality file');

      // Use the first/best quality file for direct playback
      const selectedFile = movieFiles[0];

      // Create streaming URL (remove download parameter)
      const streamingUrl = selectedFile.downloadUrl.replace('?download=1', '');

      console.log('Opening streaming URL:', streamingUrl);

      // Open directly in browser for auto-play
      const { openBrowserAsync } = await import('expo-web-browser');

      await openBrowserAsync(streamingUrl, {
        presentationStyle: 'fullScreen',
        showTitle: true,
        showInRecents: true,
        enableBarCollapsing: false,
        dismissButtonStyle: 'done'
      });

      // Close downloader after successful play
      onClose();

    } catch (error) {
      console.error('Play error:', error);
      showToast('Playback Failed', 'Could not start playback. Try using the browser button or download instead.');
    }
  };



  const cancelDownload = () => {
    if (downloadId) {
      downloadService.cancelDownload(downloadId);
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadId(null);
      showToast('Download Cancelled', 'Download has been cancelled');
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
            {movieFiles.map((file, index) => (
              <TouchableOpacity
                key={index}
                style={styles.qualityOption}
                onPress={() => handleDirectDownload(file.downloadUrl)}
              >
                <View style={styles.qualityInfo}>
                  <Text style={styles.qualityText}>
                    {file.quality} - {formatFileSize(file.size)} - {file.format}
                  </Text>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
                <Ionicons name="download" size={20} color="#4CAF50" />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        <View style={styles.header}>
          <Text style={styles.title}>Movie Downloader</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Search Movie on Internet Archive</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter movie title or direct download URL..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchTitle}
                onChangeText={setSearchTitle}
                editable={!isSearching}
              />
              <TouchableOpacity
                style={[styles.searchButton, isSearching && styles.disabledButton]}
                onPress={() => {
                  if (searchTitle.includes('archive.org/download/')) {
                    // Direct download URL
                    handleDirectDownload(searchTitle);
                  } else {
                    // Search for movie
                    searchMovie(searchTitle);
                  }
                }}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={searchTitle.includes('archive.org/download/') ? "download" : "search"} size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {searchTitle.includes('archive.org/download/') && (
              <Text style={styles.directUrlHint}>
                💡 Direct download URL detected - Click to download
              </Text>
            )}
          </View>

          {movieFound && movieFiles && movieFiles.length > 0 && (
            <View style={styles.downloadSection}>
              <Text style={styles.sectionTitle}>
                Found {movieFiles.length} file(s) - Ready to Play or Download
              </Text>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={startPlay}
                >
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Play</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={startDownload}
                >
                  <Ionicons name="download" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.playbackNote}>
                💡 Some videos may only support download due to Internet Archive streaming limitations
              </Text>

              <View style={styles.filesPreview}>
                <Text style={styles.archiveInfoTitle}>Available Files:</Text>
                {movieFiles.slice(0, 4).map((file, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.fileInfoContainer}
                    onPress={() => downloadMovie(archiveIdentifier, searchTitle || movieTitle)}
                  >
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileInfo}>
                        📹 {file.quality} • {file.size}MB • {file.format}
                      </Text>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                    </View>
                    <View style={styles.downloadBrowserContainer}>
                      <TouchableOpacity
                        style={[styles.downloadButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleDirectDownload(file.downloadUrl)}
                      >
                        <Ionicons name="download" size={16} color="#fff" />
                        <Text style={styles.downloadButtonText}>Download</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.downloadButton, { backgroundColor: '#2196F3', marginLeft: 8 }]}
                        onPress={async () => {
                          try {
                            // Extract streaming URL (remove download parameter)
                            const streamUrl = file.downloadUrl.replace('?download=1', '');
                            console.log('Opening browser with streaming URL:', streamUrl);

                            const { openBrowserAsync } = await import('expo-web-browser');
                            await openBrowserAsync(streamUrl, {
                              presentationStyle: 'fullScreen',
                              showTitle: true,
                              showInRecents: true,
                              enableBarCollapsing: false,
                              dismissButtonStyle: 'done'
                            });
                          } catch (error) {
                            console.error('Browser open error:', error);
                            showToast('Browser Error', 'Failed to open video in browser');
                          }
                        }}
                      >
                        <Ionicons name="globe" size={16} color="#fff" />
                        <Text style={styles.downloadButtonText}>Browser</Text>
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

          {!movieFound && !isSearching && searchTitle.trim().length > 0 && (
            <View style={styles.noResultsSection}>
              <Ionicons name="search" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.noResultsTitle}>No Movie Found</Text>
              <Text style={styles.noResultsText}>
                Try searching with a different title or check your spelling
              </Text>
            </View>
          )}



          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoText}>
              • Searches Internet Archive's movie collection
            </Text>
            <Text style={styles.infoText}>
              • Finds available video files in different qualities
            </Text>
            <Text style={styles.infoText}>
              • Downloads directly to your device storage
            </Text>
            <Text style={styles.infoText}>
              • Supports MP4, MKV, WebM formats
            </Text>
          </View>
        </View>

        {renderQualityModal()}

        <VideoPlayerModal
          visible={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          videoFiles={movieFiles || []}
          movieTitle={searchTitle || movieTitle || 'Unknown Movie'}
        />
      </SafeAreaView>
    </Modal>
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
    padding: 20,
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
    padding: 20,
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
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 45,
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
  // Added style for the new container for download and browser buttons
  downloadBrowserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  // Adjusted style for downloadButtonText to be used by both buttons
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});