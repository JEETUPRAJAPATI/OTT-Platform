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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [movieFound, setMovieFound] = useState(false);
  const [archiveIdentifier, setArchiveIdentifier] = useState<string>('');

  const showToast = (title: string, message: string) => {
    Alert.alert(title, message);
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
      console.log('Starting search for:', title.trim());
      
      // Search for movie on Internet Archive
      const searchResult = await downloadService.searchInternetArchive(title.trim());

      console.log('Search result:', searchResult);

      if (!searchResult.found) {
        console.log('No movie found, search result:', searchResult);
        setIsSearching(false);
        // Show additional helpful message
        if (searchResult.error?.includes('No movie archives found')) {
          showToast('Search Tips', 'Try searching with:\n• Full movie title\n• Title + year (e.g. "Inception 2010")\n• Alternative titles\n• Director name + title');
        }
        return;
      }

      if (!searchResult.identifier) {
        console.log('No identifier found in search result');
        setIsSearching(false);
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
        if (filesResult.error?.includes('No video files found')) {
          showToast('Archive Issue', 'This archive exists but contains no video files. Try searching for a different version or title.');
        }
        return;
      }

      if (filesResult.files.length === 0) {
        console.log('No files in successful result');
        setIsSearching(false);
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
      downloadMovie(movieFiles[0]);
    } else {
      // Show quality selection modal
      setShowQualityModal(true);
    }
  };

  const downloadMovie = async (file: MovieFile) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setShowQualityModal(false);

      // Determine quality for download service
      let quality: 'low' | 'medium' | 'high' = 'medium';
      if (file.quality.includes('1080') || file.quality === 'HD') quality = 'high';
      else if (file.quality.includes('720')) quality = 'medium';
      else quality = 'low';

      const id = downloadService.addToDownloadQueue(
        contentId || Date.now(), // Use contentId or timestamp as fallback
        contentType,
        searchTitle || file.name,
        posterPath,
        quality,
        file.downloadUrl
      );

      setDownloadId(id);

      // Set up progress callback
      downloadService.setProgressCallback(id, (progress) => {
        setDownloadProgress(progress);
        if (progress >= 100) {
          setIsDownloading(false);
          setDownloadProgress(100);
          showToast('Download Complete', `${searchTitle} has been downloaded successfully!`);
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      });

      showToast('Download Started', `Downloading ${file.quality} ${file.format} version (${file.size}MB)`);
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      showToast('Download Failed', 'Failed to start download. Please try again.');
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

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)}GB`;
    }
    return `${sizeInMB}MB`;
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
                onPress={() => downloadMovie(file)}
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
                placeholder="Enter movie title..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchTitle}
                onChangeText={setSearchTitle}
                editable={!isSearching && !isDownloading}
              />
              <TouchableOpacity
                style={[styles.searchButton, (isSearching || isDownloading) && styles.disabledButton]}
                onPress={() => searchMovie(searchTitle)}
                disabled={isSearching || isDownloading}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {movieFound && movieFiles.length > 0 && !isDownloading && (
            <View style={styles.downloadSection}>
              <Text style={styles.sectionTitle}>
                Found {movieFiles.length} file(s) - Ready to Download
              </Text>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={startDownload}
              >
                <Ionicons name="download" size={24} color="#fff" />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>

              <View style={styles.filesPreview}>
                {movieFiles.slice(0, 3).map((file, index) => (
                  <Text key={index} style={styles.fileInfo}>
                    {file.quality} - {formatFileSize(file.size)} - {file.format}
                  </Text>
                ))}
                {movieFiles.length > 3 && (
                  <Text style={styles.moreFiles}>
                    +{movieFiles.length - 3} more files...
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Debug info - remove this after testing */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <Text style={styles.debugText}>Debug Info:</Text>
              <Text style={styles.debugText}>movieFound: {movieFound.toString()}</Text>
              <Text style={styles.debugText}>movieFiles.length: {movieFiles.length}</Text>
              <Text style={styles.debugText}>isDownloading: {isDownloading.toString()}</Text>
              <Text style={styles.debugText}>archiveIdentifier: {archiveIdentifier}</Text>
            </View>
          )}

          {isDownloading && (
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Downloading...</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{downloadProgress}%</Text>
              </View>

              <View style={styles.downloadActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelDownload}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retryDownload}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
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
  downloadButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  downloadButtonText: {
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
  fileInfo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  moreFiles: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  debugSection: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
  },
  debugText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});