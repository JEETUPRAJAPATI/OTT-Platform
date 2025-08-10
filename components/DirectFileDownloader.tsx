
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Conditional import for react-native-fs
let RNFS: any = null;
try {
  if (Platform.OS !== 'web') {
    RNFS = require('react-native-fs');
  }
} catch (error) {
  console.warn('react-native-fs not available:', error);
}

interface DirectFileDownloaderProps {
  downloadUrl: string;
  fileName: string;
  onDownloadComplete?: (filePath: string) => void;
  onDownloadError?: (error: string) => void;
}

interface DownloadProgress {
  progress: number;
  bytesWritten: number;
  contentLength: number;
  speed: number;
}

export function DirectFileDownloader({
  downloadUrl,
  fileName,
  onDownloadComplete,
  onDownloadError
}: DirectFileDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const downloadJobRef = useRef<any>(null);
  const lastProgressTimeRef = useRef<number>(Date.now());
  const lastBytesWrittenRef = useRef<number>(0);

  // Check if native downloads are supported
  const isNativeSupported = Platform.OS !== 'web' && RNFS !== null;

  // Request storage permissions for Android
  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need explicit permission for app documents
    }

    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 30) {
        // Android 11+ uses scoped storage, no explicit permission needed for Downloads
        return true;
      } else {
        // Android 10 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to save downloaded files to your device.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  // Get the appropriate download directory
  const getDownloadPath = async (filename: string): Promise<string> => {
    let downloadDir: string;
    
    if (Platform.OS === 'android') {
      // Use Downloads directory on Android
      downloadDir = RNFS.DownloadDirectoryPath;
    } else {
      // Use Documents directory on iOS
      downloadDir = RNFS.DocumentDirectoryPath;
    }

    // Ensure download directory exists
    const dirExists = await RNFS.exists(downloadDir);
    if (!dirExists) {
      await RNFS.mkdir(downloadDir);
    }

    return `${downloadDir}/${filename}`;
  };

  // Check if file already exists and handle conflicts
  const handleFileConflict = async (filePath: string): Promise<string> => {
    const fileExists = await RNFS.exists(filePath);
    
    if (!fileExists) {
      return filePath;
    }

    return new Promise((resolve, reject) => {
      Alert.alert(
        'File Already Exists',
        `The file "${fileName}" already exists. What would you like to do?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('Download cancelled by user'))
          },
          {
            text: 'Skip',
            onPress: () => reject(new Error('File already exists, skipping download'))
          },
          {
            text: 'Overwrite',
            onPress: () => resolve(filePath)
          },
          {
            text: 'Rename',
            onPress: async () => {
              // Create a new filename with timestamp
              const fileExtension = fileName.split('.').pop();
              const baseName = fileName.replace(`.${fileExtension}`, '');
              const timestamp = new Date().getTime();
              const newFileName = `${baseName}_${timestamp}.${fileExtension}`;
              const newPath = filePath.replace(fileName, newFileName);
              resolve(newPath);
            }
          }
        ]
      );
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format download speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  // Calculate download speed
  const calculateSpeed = (bytesWritten: number): number => {
    const currentTime = Date.now();
    const timeDiff = (currentTime - lastProgressTimeRef.current) / 1000; // seconds
    const bytesDiff = bytesWritten - lastBytesWrittenRef.current;
    
    if (timeDiff > 0) {
      const speed = bytesDiff / timeDiff;
      lastProgressTimeRef.current = currentTime;
      lastBytesWrittenRef.current = bytesWritten;
      return speed;
    }
    
    return 0;
  };

  // Check available storage space
  const checkStorageSpace = async (requiredBytes: number): Promise<boolean> => {
    try {
      const freeSpace = await RNFS.getFSInfo();
      const availableSpace = freeSpace.freeSpace;
      
      // Add 10% buffer for safety
      const requiredSpace = requiredBytes * 1.1;
      
      if (availableSpace < requiredSpace) {
        const availableGB = (availableSpace / (1024 * 1024 * 1024)).toFixed(1);
        const requiredGB = (requiredSpace / (1024 * 1024 * 1024)).toFixed(1);
        
        Alert.alert(
          'Insufficient Storage',
          `Not enough storage space available.\n\nRequired: ${requiredGB} GB\nAvailable: ${availableGB} GB`,
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Could not check storage space:', error);
      return true; // Continue with download if we can't check
    }
  };

  // Handle web download using browser's download
  const handleWebDownload = async () => {
    try {
      setDownloading(true);
      setProgress(50); // Show some progress

      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM temporarily
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Simulate progress completion
      setTimeout(() => {
        setProgress(100);
        setDownloading(false);
        
        Alert.alert(
          'Download Started',
          `Your browser will download: ${fileName}\n\nCheck your Downloads folder once the download completes.`,
          [{ text: 'OK' }]
        );

        if (onDownloadComplete) {
          onDownloadComplete('Browser Download');
        }
      }, 1000);

    } catch (error) {
      console.error('Web download error:', error);
      setDownloading(false);
      setProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Browser download failed';
      
      Alert.alert(
        'Download Failed',
        `Failed to start download: ${errorMessage}`,
        [{ text: 'OK' }]
      );

      if (onDownloadError) {
        onDownloadError(errorMessage);
      }
    }
  };

  // Start the download
  const startDownload = async () => {
    if (downloading) return;

    // Check platform support
    if (!isNativeSupported) {
      if (Platform.OS === 'web') {
        return await handleWebDownload();
      } else {
        Alert.alert(
          'Download Not Supported',
          'Native file downloads are not available on this platform. Please use a mobile device with the native app.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      setDownloading(true);
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
      setDownloadSpeed(0);

      // Reset progress tracking
      lastProgressTimeRef.current = Date.now();
      lastBytesWrittenRef.current = 0;

      // Request permissions
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }

      // Get file path
      const downloadPath = await getDownloadPath(fileName);
      
      // Handle file conflicts
      const finalPath = await handleFileConflict(downloadPath);

      // Get file size from server to check storage space
      try {
        const headResponse = await fetch(downloadUrl, { method: 'HEAD' });
        const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);
        
        if (contentLength > 0) {
          const hasSpace = await checkStorageSpace(contentLength);
          if (!hasSpace) {
            throw new Error('Insufficient storage space');
          }
          setTotalBytes(contentLength);
        }
      } catch (error) {
        console.warn('Could not get file size from server:', error);
      }

      console.log('Starting download:', {
        url: downloadUrl,
        path: finalPath,
        fileName
      });

      // Start download with react-native-fs
      const downloadJob = RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: finalPath,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
          'Accept': '*/*',
        },
        background: true, // Enable background download
        discretionary: true, // Allow system to optimize timing
        cacheable: false,
        progressDivider: 1,
        progressInterval: 500, // Update every 500ms
        begin: (res) => {
          console.log('Download started:', res);
          const contentLength = parseInt(res.contentLength || '0', 10);
          if (contentLength > 0) {
            setTotalBytes(contentLength);
          }
        },
        progress: (res) => {
          const progressPercent = res.contentLength > 0 
            ? (res.bytesWritten / res.contentLength) * 100 
            : 0;
          
          const speed = calculateSpeed(res.bytesWritten);
          
          setProgress(Math.min(progressPercent, 100));
          setDownloadedBytes(res.bytesWritten);
          setTotalBytes(res.contentLength);
          setDownloadSpeed(speed);
          
          console.log(`Download progress: ${progressPercent.toFixed(1)}%`);
        }
      });

      downloadJobRef.current = downloadJob;

      // Wait for download completion
      const result = await downloadJob.promise;
      
      console.log('Download completed:', result);

      // Make file visible in media scanner (Android)
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(finalPath);
          console.log('File added to media scanner');
        } catch (scanError) {
          console.warn('Could not add file to media scanner:', scanError);
        }
      }

      setProgress(100);
      setDownloading(false);

      // Success alert
      Alert.alert(
        'Download Complete!',
        `File downloaded successfully!\n\nFile: ${fileName}\nSize: ${formatFileSize(totalBytes)}\nLocation: ${Platform.OS === 'android' ? 'Downloads folder' : 'Documents folder'}`,
        [{ text: 'OK' }]
      );

      // Call success callback
      if (onDownloadComplete) {
        onDownloadComplete(finalPath);
      }

    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      setProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      Alert.alert(
        'Download Failed',
        `Failed to download file: ${errorMessage}`,
        [{ text: 'OK' }]
      );

      // Call error callback
      if (onDownloadError) {
        onDownloadError(errorMessage);
      }
    }
  };

  // Cancel download
  const cancelDownload = () => {
    if (downloadJobRef.current) {
      downloadJobRef.current.stop();
      downloadJobRef.current = null;
    }
    
    setDownloading(false);
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setDownloadSpeed(0);
    
    Alert.alert('Download Cancelled', 'The download has been cancelled.', [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.downloadButton, downloading && styles.downloadingButton]}
        onPress={downloading ? cancelDownload : startDownload}
        disabled={false}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="download" size={24} color="#fff" />
        )}
        <Text style={styles.downloadButtonText}>
          {downloading 
            ? (Platform.OS === 'web' ? 'Downloading...' : 'Cancel Download')
            : (Platform.OS === 'web' ? 'Download in Browser' : 'Download File')
          }
        </Text>
      </TouchableOpacity>

      {!isNativeSupported && Platform.OS === 'web' && (
        <View style={styles.webNotice}>
          <Text style={styles.webNoticeText}>
            🌐 Web Version: Files will be downloaded using your browser
          </Text>
        </View>
      )}

      {downloading && (
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
          </View>
          
          {totalBytes > 0 && (
            <View style={styles.downloadDetails}>
              <Text style={styles.detailText}>
                {formatFileSize(downloadedBytes)} / {formatFileSize(totalBytes)}
              </Text>
              {downloadSpeed > 0 && (
                <Text style={styles.detailText}>
                  Speed: {formatSpeed(downloadSpeed)}
                </Text>
              )}
              <Text style={styles.detailText}>
                File: {fileName}
              </Text>
            </View>
          )}
        </View>
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
    backgroundColor: '#F44336',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 8,
  },
  progressContainer: {
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
  webNotice: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  webNoticeText: {
    color: '#2196F3',
    fontSize: 12,
    textAlign: 'center',
  },
});
