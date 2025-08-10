
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

interface DirectFileDownloaderProps {
  downloadUrl: string;
  fileName?: string;
  onDownloadComplete?: (filePath: string) => void;
  onDownloadError?: (error: string) => void;
}

export function DirectFileDownloader({
  downloadUrl,
  fileName = 'downloaded_file',
  onDownloadComplete,
  onDownloadError
}: DirectFileDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // Extract filename from URL if not provided
  const getFileName = (url: string, fallback: string): string => {
    try {
      const urlObj = new URL(url);
      const pathName = decodeURIComponent(urlObj.pathname);
      const segments = pathName.split('/');
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment && lastSegment.includes('.')) {
        return lastSegment;
      }
      
      return fallback + '.mp4'; // Default extension
    } catch (error) {
      return fallback + '.mp4';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
      }
      return true; // iOS doesn't need explicit permissions for document directory
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const downloadFile = async () => {
    if (downloading) return;

    try {
      setDownloading(true);
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download files.');
        return;
      }

      // Get the actual filename
      const actualFileName = getFileName(downloadUrl, fileName);
      console.log('Downloading file:', actualFileName);

      // Create download path
      let downloadPath: string;
      if (Platform.OS === 'android') {
        // For Android, use document directory first, then move to Downloads
        downloadPath = `${FileSystem.documentDirectory}${actualFileName}`;
      } else {
        // For iOS, use document directory
        downloadPath = `${FileSystem.documentDirectory}${actualFileName}`;
      }

      console.log('Download path:', downloadPath);

      // Start download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        downloadPath,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0'
          }
        },
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          const progressPercentage = Math.min(progress * 100, 100);
          
          setProgress(progressPercentage);
          setDownloadedBytes(downloadProgress.totalBytesWritten);
          setTotalBytes(downloadProgress.totalBytesExpectedToWrite);
          
          console.log(`Download progress: ${progressPercentage.toFixed(1)}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result || !result.uri) {
        throw new Error('Download failed - no file URI returned');
      }

      console.log('Download completed:', result.uri);

      // For Android, try to move file to Downloads folder
      let finalPath = result.uri;
      if (Platform.OS === 'android') {
        try {
          // Create media library asset for Android Downloads folder
          const asset = await MediaLibrary.createAssetAsync(result.uri);
          if (asset) {
            // Try to move to Downloads album
            const album = await MediaLibrary.getAlbumAsync('Download');
            if (album) {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
              // Create Downloads album if it doesn't exist
              await MediaLibrary.createAlbumAsync('Download', asset, false);
            }
            console.log('File added to Downloads folder');
          }
        } catch (mediaError) {
          console.warn('Could not move to Downloads folder:', mediaError);
          // Continue with the file in document directory
        }
      }

      setDownloading(false);
      setProgress(100);

      // Show success message
      Alert.alert(
        'Download Complete!',
        `File downloaded successfully!\n\nFile: ${actualFileName}\nSize: ${formatFileSize(totalBytes)}\nLocation: ${Platform.OS === 'android' ? 'Downloads folder' : 'App documents'}`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Share File',
            onPress: () => shareFile(finalPath)
          }
        ]
      );

      // Callback for success
      if (onDownloadComplete) {
        onDownloadComplete(finalPath);
      }

    } catch (error) {
      setDownloading(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Download error:', error);
      
      Alert.alert(
        'Download Failed',
        `Failed to download file: ${errorMessage}`,
        [{ text: 'OK', style: 'default' }]
      );

      if (onDownloadError) {
        onDownloadError(errorMessage);
      }
    }
  };

  const shareFile = async (filePath: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'video/mp4',
          dialogTitle: 'Share downloaded file'
        });
      } else {
        Alert.alert('Sharing Not Available', 'File sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Error', 'Failed to share the file.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.downloadButton, downloading && styles.downloadingButton]}
        onPress={downloadFile}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="download" size={24} color="#fff" />
        )}
        <Text style={styles.downloadButtonText}>
          {downloading ? 'Downloading...' : 'Download File'}
        </Text>
      </TouchableOpacity>

      {downloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>
      )}

      {downloading && totalBytes > 0 && (
        <View style={styles.downloadDetails}>
          <Text style={styles.detailText}>
            {formatFileSize(downloadedBytes)} / {formatFileSize(totalBytes)}
          </Text>
          <Text style={styles.detailText}>
            File: {getFileName(downloadUrl, fileName)}
          </Text>
        </View>
      )}

      {Platform.OS === 'web' && (
        <Text style={styles.warningText}>
          ⚠️ File downloads work best on mobile devices
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  downloadingButton: {
    backgroundColor: '#2196F3',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
  },
  downloadDetails: {
    alignItems: 'center',
  },
  detailText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  warningText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
