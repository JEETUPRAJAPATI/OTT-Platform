
import React, { useState, useRef, useCallback } from 'react';
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

// Native-only import for react-native-fs
let RNFS: any = null;
if (Platform.OS !== 'web') {
  try {
    RNFS = require('react-native-fs');
  } catch (error) {
    console.error('react-native-fs not available:', error);
  }
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
  eta: number;
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
  const [eta, setEta] = useState(0);
  const downloadJobRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const lastProgressTimeRef = useRef<number>(0);
  const lastBytesWrittenRef = useRef<number>(0);

  // Check if running on native platform with proper RNFS support
  const isNativeApp = Platform.OS !== 'web' && RNFS !== null && typeof RNFS.downloadFile === 'function';

  // Request storage permissions for Android
  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need explicit permission for app documents
    }

    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 30) {
        // Android 11+ uses scoped storage
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
      // Use Documents directory on iOS (accessible via Files app)
      downloadDir = `${RNFS.DocumentDirectoryPath}/Downloads`;
    }

    // Ensure download directory exists
    const dirExists = await RNFS.exists(downloadDir);
    if (!dirExists) {
      await RNFS.mkdir(downloadDir);
      console.log('Created downloads directory:', downloadDir);
    }

    return `${downloadDir}/${filename}`;
  };

  // Resolve HTTPS redirects before downloading
  const resolveRedirects = async (url: string): Promise<string> => {
    try {
      console.log('Resolving redirects for URL:', url);
      
      // Use HEAD request to follow redirects without downloading content
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow', // Follow redirects automatically
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
          'Accept': '*/*',
        }
      });

      const finalUrl = response.url;
      console.log('Final URL after redirects:', finalUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return finalUrl;
    } catch (error) {
      console.warn('Could not resolve redirects, using original URL:', error);
      return url; // Fallback to original URL
    }
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

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return 'Calculating...';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Calculate download speed and ETA
  const calculateSpeedAndEta = useCallback((bytesWritten: number, contentLength: number): { speed: number; eta: number } => {
    const currentTime = Date.now();
    
    if (lastProgressTimeRef.current === 0) {
      lastProgressTimeRef.current = currentTime;
      lastBytesWrittenRef.current = bytesWritten;
      return { speed: 0, eta: 0 };
    }
    
    const timeDiff = (currentTime - lastProgressTimeRef.current) / 1000; // seconds
    const bytesDiff = bytesWritten - lastBytesWrittenRef.current;
    
    if (timeDiff > 1) { // Update every second
      const speed = bytesDiff / timeDiff;
      const remainingBytes = contentLength - bytesWritten;
      const eta = speed > 0 ? remainingBytes / speed : 0;
      
      lastProgressTimeRef.current = currentTime;
      lastBytesWrittenRef.current = bytesWritten;
      
      return { speed, eta };
    }
    
    return { speed: downloadSpeed, eta };
  }, [downloadSpeed]);

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

  // Start the download
  const startDownload = async () => {
    if (downloading) return;

    // Check if running on native platform
    if (!isNativeApp) {
      Alert.alert(
        'Download Not Available',
        'File downloads require a native build. This feature is not available in Expo Go or web browsers. You need to create a development build or use EAS Build.',
        [
          { text: 'OK' },
          {
            text: 'Learn More',
            onPress: () => {
              // You can add a link to Expo documentation here
              console.log('For downloads, create a development build with: npx expo run:android or npx expo run:ios');
            }
          }
        ]
      );
      return;
    }

    try {
      setDownloading(true);
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
      setDownloadSpeed(0);
      setEta(0);

      // Reset progress tracking
      startTimeRef.current = Date.now();
      lastProgressTimeRef.current = 0;
      lastBytesWrittenRef.current = 0;

      console.log('Starting native download process...');

      // Request permissions
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }

      // Resolve redirects first
      const resolvedUrl = await resolveRedirects(downloadUrl);
      console.log('Using resolved URL:', resolvedUrl);

      // Get file path
      const downloadPath = await getDownloadPath(fileName);
      console.log('Download path:', downloadPath);
      
      // Handle file conflicts
      const finalPath = await handleFileConflict(downloadPath);
      console.log('Final path:', finalPath);

      // Get file size from server to check storage space
      try {
        const headResponse = await fetch(resolvedUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
            'Accept': '*/*',
          }
        });
        
        const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);
        
        if (contentLength > 0) {
          const hasSpace = await checkStorageSpace(contentLength);
          if (!hasSpace) {
            throw new Error('Insufficient storage space');
          }
          setTotalBytes(contentLength);
          console.log('Expected file size:', formatFileSize(contentLength));
        }
      } catch (error) {
        console.warn('Could not get file size from server:', error);
      }

      console.log('Starting RNFS download with config:', {
        fromUrl: resolvedUrl,
        toFile: finalPath,
        background: true,
        discretionary: true,
        cacheable: false
      });

      // Start download with react-native-fs
      const downloadJob = RNFS.downloadFile({
        fromUrl: resolvedUrl,
        toFile: finalPath,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
          'Accept': '*/*',
          'Accept-Encoding': 'identity', // Prevent compression for accurate progress
          'Cache-Control': 'no-cache',
        },
        background: true, // Enable background download
        discretionary: true, // Allow system to optimize timing
        cacheable: false, // Don't cache large files
        progressDivider: 1, // Get all progress updates
        progressInterval: 1000, // Update every 1 second
        begin: (res) => {
          console.log('Download started with response:', res);
          const contentLength = parseInt(res.contentLength || '0', 10);
          if (contentLength > 0) {
            setTotalBytes(contentLength);
          }
        },
        progress: (res) => {
          const progressPercent = res.contentLength > 0 
            ? (res.bytesWritten / res.contentLength) * 100 
            : 0;
          
          const { speed, eta } = calculateSpeedAndEta(res.bytesWritten, res.contentLength);
          
          setProgress(Math.min(progressPercent, 100));
          setDownloadedBytes(res.bytesWritten);
          setTotalBytes(res.contentLength);
          setDownloadSpeed(speed);
          setEta(eta);
          
          console.log(`Progress: ${progressPercent.toFixed(1)}% (${formatFileSize(res.bytesWritten)}/${formatFileSize(res.contentLength)})`);
        }
      });

      downloadJobRef.current = downloadJob;

      // Wait for download completion
      const result = await downloadJob.promise;
      
      console.log('Download completed successfully:', result);

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
      const downloadTime = (Date.now() - startTimeRef.current) / 1000;
      Alert.alert(
        'Download Complete!',
        `File downloaded successfully!\n\nFile: ${fileName}\nSize: ${formatFileSize(totalBytes)}\nTime: ${formatTime(downloadTime)}\nLocation: ${Platform.OS === 'android' ? 'Downloads folder' : 'Documents/Downloads folder'}`,
        [
          { text: 'OK' },
          {
            text: 'Open Folder',
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.openURL('content://com.android.externalstorage.documents/document/primary%3ADownload').catch(() => {
                  Alert.alert('Info', 'Please check your Downloads folder in the file manager.');
                });
              } else {
                Linking.openURL('shareddocuments://').catch(() => {
                  Alert.alert('Info', 'Please check Files app > On My iPhone > [App Name] > Downloads');
                });
              }
            }
          }
        ]
      );

      // Call success callback
      if (onDownloadComplete) {
        onDownloadComplete(finalPath);
      }

    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
      setDownloadSpeed(0);
      setEta(0);
      
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
    setEta(0);
    
    Alert.alert('Download Cancelled', 'The download has been cancelled.', [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.downloadButton, downloading && styles.downloadingButton]}
        onPress={downloading ? cancelDownload : startDownload}
        disabled={!isNativeApp}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons 
            name={isNativeApp ? "download" : "close-circle"} 
            size={24} 
            color="#fff" 
          />
        )}
        <Text style={styles.downloadButtonText}>
          {!isNativeApp 
            ? 'Native App Required'
            : downloading 
              ? 'Cancel Download'
              : 'Download File'
          }
        </Text>
      </TouchableOpacity>

      {!isNativeApp && (
        <View style={styles.warningNotice}>
          <Text style={styles.warningText}>
            ⚠️ Downloads require native build - not available in Expo Go
          </Text>
          <Text style={styles.warningSubText}>
            Use: npx expo run:android or npx expo run:ios
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
              {eta > 0 && (
                <Text style={styles.detailText}>
                  ETA: {formatTime(eta)}
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
  warningNotice: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  warningSubText: {
    color: '#FF9800',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
});
