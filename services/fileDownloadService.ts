
import { Platform, Alert, Linking } from 'react-native';

// Conditional imports for platform-specific packages
let AsyncStorage: any = null;
let RNFS: any = null;
let PermissionsAndroid: any = null;
let Permissions: any = null;
let Permissions: any = null;

if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    RNFS = require('react-native-fs');
    PermissionsAndroid = require('react-native').PermissionsAndroid;
    const permissions = require('react-native-permissions');
    Permissions = {
      check: permissions.check,
      request: permissions.request,
      PERMISSIONS: permissions.PERMISSIONS,
      RESULTS: permissions.RESULTS
    };
  } catch (error) {
    console.warn('Native packages not available:', error);
  }
} else {
  // Web platform fallbacks
  AsyncStorage = {
    getItem: async (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors on web
      }
    },
    removeItem: async (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors on web
      }
    }
  };
}

export interface DownloadProgress {
  id: string;
  filename: string;
  url: string;
  progress: number; // 0-100
  bytesWritten: number;
  contentLength: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  speed: number; // bytes per second
  estimatedTime: number; // seconds remaining
  filePath?: string;
  error?: string;
  startTime: number;
  lastUpdateTime: number;
}

export interface DownloadCallbacks {
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (filePath: string) => void;
  onError?: (error: string) => void;
}

class FileDownloadService {
  private downloads: Map<string, DownloadProgress> = new Map();
  private downloadJobs: Map<string, any> = new Map();
  private callbacks: Map<string, DownloadCallbacks> = new Map();
  private readonly STORAGE_KEY = 'file_downloads';
  private isNativeSupported: boolean;

  constructor() {
    this.isNativeSupported = Platform.OS !== 'web' && RNFS !== null;
    this.loadDownloads();
  }

  // Check if file downloads are supported on current platform
  isSupported(): boolean {
    return this.isNativeSupported;
  }

  // Request storage permissions
  async requestStoragePermissions(): Promise<boolean> {
    if (!this.isNativeSupported) {
      Alert.alert(
        'Platform Not Supported',
        'File downloads are only available on mobile devices. Please use the mobile app to download files.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (Platform.OS === 'ios') {
      // iOS doesn't require explicit storage permissions for Downloads folder
      return true;
    }

    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 30) {
        // Android 11+ uses scoped storage
        try {
          const hasPermission = await this.checkScopedStoragePermission();
          if (!hasPermission) {
            Alert.alert(
              'Storage Permission Required',
              'This app needs access to save files to your Downloads folder. Please grant permission in the next screen.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Grant Permission', onPress: () => this.requestScopedStoragePermission() }
              ]
            );
            return false;
          }
          return true;
        } catch (error) {
          console.error('Scoped storage permission error:', error);
          return false;
        }
      } else {
        // Android 10 and below
        try {
          if (!PermissionsAndroid) {
            throw new Error('PermissionsAndroid not available');
          }
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'This app needs access to save downloaded movies to your device.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (error) {
          console.error('Storage permission error:', error);
          return false;
        }
      }
    }

    return false;
  }

  private async checkScopedStoragePermission(): Promise<boolean> {
    try {
      if (!Permissions || !Permissions.check || !Permissions.PERMISSIONS) {
        return false;
      }
      const result = await Permissions.check(Permissions.PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return result === Permissions.RESULTS.GRANTED;
    } catch (error) {
      console.error('Check scoped storage permission error:', error);
      return false;
    }
  }

  private async requestScopedStoragePermission(): Promise<boolean> {
    try {
      if (!Permissions || !Permissions.request || !Permissions.PERMISSIONS) {
        throw new Error('Permissions not available');
      }
      const result = await Permissions.request(Permissions.PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      if (result !== Permissions.RESULTS.GRANTED) {
        // Open app settings for manual permission grant
        Alert.alert(
          'Permission Required',
          'Please manually grant storage permission in App Settings to download files.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Request scoped storage permission error:', error);
      return false;
    }
  }

  // Get Downloads folder path
  private getDownloadsPath(): string {
    if (Platform.OS === 'ios') {
      return `${RNFS.DocumentDirectoryPath}/Downloads`;
    } else {
      // Android - use external Downloads directory
      return `${RNFS.DownloadDirectoryPath}`;
    }
  }

  // Ensure Downloads folder exists
  private async ensureDownloadsFolderExists(): Promise<void> {
    const downloadsPath = this.getDownloadsPath();
    
    try {
      const exists = await RNFS.exists(downloadsPath);
      if (!exists) {
        await RNFS.mkdir(downloadsPath);
        console.log('Downloads folder created:', downloadsPath);
      }
    } catch (error) {
      console.error('Error creating downloads folder:', error);
      throw new Error('Failed to create downloads folder');
    }
  }

  // Generate safe filename
  private generateSafeFilename(originalName: string, movieTitle: string): string {
    // Remove invalid characters and create a safe filename
    const sanitizedTitle = movieTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const sanitizedOriginal = originalName.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
    
    // If original name is descriptive, use it; otherwise, use movie title
    if (sanitizedOriginal.length > 10 && !sanitizedOriginal.includes('archive')) {
      return sanitizedOriginal;
    }
    
    // Extract file extension from original name
    const extension = originalName.split('.').pop() || 'mp4';
    return `${sanitizedTitle}.${extension}`;
  }

  // Start download
  async startDownload(
    url: string,
    filename: string,
    movieTitle: string,
    callbacks?: DownloadCallbacks
  ): Promise<string> {
    try {
      // Check if platform supports file downloads
      if (!this.isNativeSupported) {
        throw new Error('File downloads are not supported on this platform. Please use the mobile app.');
      }

      // Check permissions first
      const hasPermission = await this.requestStoragePermissions();
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }

      // Ensure Downloads folder exists
      await this.ensureDownloadsFolderExists();

      // Generate unique download ID
      const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate safe filename
      const safeFilename = this.generateSafeFilename(filename, movieTitle);
      const downloadsPath = this.getDownloadsPath();
      const filePath = `${downloadsPath}/${safeFilename}`;

      // Check if file already exists and handle duplicate
      let finalFilePath = filePath;
      let counter = 1;
      while (await RNFS.exists(finalFilePath)) {
        const nameWithoutExt = safeFilename.replace(/\.[^/.]+$/, '');
        const extension = safeFilename.split('.').pop();
        finalFilePath = `${downloadsPath}/${nameWithoutExt}_${counter}.${extension}`;
        counter++;
      }

      // Check available storage space
      await this.checkStorageSpace(url, finalFilePath);

      // Initialize download progress
      const downloadProgress: DownloadProgress = {
        id: downloadId,
        filename: safeFilename,
        url,
        progress: 0,
        bytesWritten: 0,
        contentLength: 0,
        status: 'pending',
        speed: 0,
        estimatedTime: 0,
        filePath: finalFilePath,
        startTime: Date.now(),
        lastUpdateTime: Date.now()
      };

      this.downloads.set(downloadId, downloadProgress);
      if (callbacks) {
        this.callbacks.set(downloadId, callbacks);
      }

      // Save to storage
      await this.saveDownloads();

      console.log('Starting download:', {
        downloadId,
        url,
        filePath: finalFilePath,
        filename: safeFilename
      });

      // Start the actual download
      const downloadJob = RNFS.downloadFile({
        fromUrl: url,
        toFile: finalFilePath,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
          'Accept': '*/*',
          'Accept-Encoding': 'identity', // Prevent compression for accurate progress
        },
        background: true, // Enable background download
        discretionary: true, // Allow system to optimize download timing
        cacheable: false,
        progressInterval: 500, // Update progress every 500ms
        progressDivider: 1,
        begin: (res) => {
          console.log('Download started:', res);
          const contentLength = parseInt(res.contentLength || '0', 10);
          
          this.updateDownloadProgress(downloadId, {
            contentLength,
            status: 'downloading'
          });
        },
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          const currentTime = Date.now();
          const download = this.downloads.get(downloadId);
          
          if (download) {
            const timeDiff = (currentTime - download.lastUpdateTime) / 1000; // seconds
            const bytesDiff = res.bytesWritten - download.bytesWritten;
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
            const remainingBytes = res.contentLength - res.bytesWritten;
            const estimatedTime = speed > 0 ? remainingBytes / speed : 0;

            this.updateDownloadProgress(downloadId, {
              progress: Math.min(progress, 100),
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
              speed,
              estimatedTime,
              lastUpdateTime: currentTime
            });
          }
        }
      });

      this.downloadJobs.set(downloadId, downloadJob);

      // Handle download completion
      downloadJob.promise
        .then((result) => {
          console.log('Download completed:', result);
          this.handleDownloadComplete(downloadId, result.filePath || finalFilePath);
        })
        .catch((error) => {
          console.error('Download failed:', error);
          this.handleDownloadError(downloadId, error.message || 'Download failed');
        });

      return downloadId;

    } catch (error) {
      console.error('Start download error:', error);
      if (callbacks?.onError) {
        callbacks.onError(error instanceof Error ? error.message : 'Failed to start download');
      }
      throw error;
    }
  }

  // Check available storage space
  private async checkStorageSpace(url: string, filePath: string): Promise<void> {
    try {
      // Get file size from server
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      
      if (contentLength > 0) {
        // Get available storage space
        const statResult = await RNFS.getFSInfo();
        const availableSpace = statResult.freeSpace;
        
        // Add 10% buffer for safety
        const requiredSpace = contentLength * 1.1;
        
        if (availableSpace < requiredSpace) {
          const availableGB = (availableSpace / (1024 * 1024 * 1024)).toFixed(1);
          const requiredGB = (requiredSpace / (1024 * 1024 * 1024)).toFixed(1);
          
          throw new Error(`Insufficient storage space. Available: ${availableGB}GB, Required: ${requiredGB}GB`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient storage')) {
        throw error;
      }
      // If we can't check storage space, log warning but continue
      console.warn('Could not check storage space:', error);
    }
  }

  // Update download progress
  private updateDownloadProgress(downloadId: string, updates: Partial<DownloadProgress>): void {
    const download = this.downloads.get(downloadId);
    if (download) {
      const updatedDownload = { ...download, ...updates };
      this.downloads.set(downloadId, updatedDownload);
      
      const callbacks = this.callbacks.get(downloadId);
      if (callbacks?.onProgress) {
        callbacks.onProgress(updatedDownload);
      }
      
      // Save to storage periodically (every 5% progress)
      if (updatedDownload.progress % 5 < (download.progress % 5)) {
        this.saveDownloads();
      }
    }
  }

  // Handle download completion
  private async handleDownloadComplete(downloadId: string, filePath: string): Promise<void> {
    try {
      this.updateDownloadProgress(downloadId, {
        status: 'completed',
        progress: 100,
        filePath
      });

      // Make file visible in file manager (Android)
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(filePath);
          console.log('File added to media scanner:', filePath);
        } catch (error) {
          console.warn('Could not add file to media scanner:', error);
        }
      }

      const callbacks = this.callbacks.get(downloadId);
      if (callbacks?.onComplete) {
        callbacks.onComplete(filePath);
      }

      // Show completion notification
      Alert.alert(
        'Download Complete!',
        `Movie downloaded successfully to Downloads folder.\n\nFile: ${filePath.split('/').pop()}`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Open Folder',
            onPress: () => this.openDownloadsFolder()
          }
        ]
      );

      await this.saveDownloads();
    } catch (error) {
      console.error('Handle download complete error:', error);
    }
  }

  // Handle download error
  private handleDownloadError(downloadId: string, error: string): void {
    this.updateDownloadProgress(downloadId, {
      status: 'failed',
      error
    });

    const callbacks = this.callbacks.get(downloadId);
    if (callbacks?.onError) {
      callbacks.onError(error);
    }

    Alert.alert(
      'Download Failed',
      `Download failed: ${error}\n\nYou can retry the download from the downloads screen.`,
      [{ text: 'OK', style: 'default' }]
    );

    this.saveDownloads();
  }

  // Pause download
  pauseDownload(downloadId: string): void {
    const downloadJob = this.downloadJobs.get(downloadId);
    if (downloadJob) {
      downloadJob.stop();
      this.updateDownloadProgress(downloadId, {
        status: 'paused'
      });
    }
  }

  // Resume download
  async resumeDownload(downloadId: string): Promise<void> {
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'paused') {
      // Restart the download from where it left off
      const newDownloadId = await this.startDownload(
        download.url,
        download.filename,
        download.filename,
        this.callbacks.get(downloadId)
      );
      
      // Update the ID mapping
      const callbacks = this.callbacks.get(downloadId);
      if (callbacks) {
        this.callbacks.delete(downloadId);
        this.callbacks.set(newDownloadId, callbacks);
      }
      
      this.cancelDownload(downloadId);
    }
  }

  // Cancel download
  cancelDownload(downloadId: string): void {
    const downloadJob = this.downloadJobs.get(downloadId);
    if (downloadJob) {
      downloadJob.stop();
      this.downloadJobs.delete(downloadId);
    }

    const download = this.downloads.get(downloadId);
    if (download) {
      // Delete partial file
      if (download.filePath && download.status !== 'completed') {
        RNFS.unlink(download.filePath).catch((error) => {
          console.warn('Could not delete partial file:', error);
        });
      }

      this.updateDownloadProgress(downloadId, {
        status: 'cancelled'
      });
    }

    this.callbacks.delete(downloadId);
  }

  // Delete completed download
  async deleteDownload(downloadId: string): Promise<void> {
    const download = this.downloads.get(downloadId);
    if (download && download.filePath) {
      try {
        await RNFS.unlink(download.filePath);
        console.log('Download file deleted:', download.filePath);
      } catch (error) {
        console.warn('Could not delete download file:', error);
      }
    }

    this.downloads.delete(downloadId);
    this.downloadJobs.delete(downloadId);
    this.callbacks.delete(downloadId);
    await this.saveDownloads();
  }

  // Get download progress
  getDownloadProgress(downloadId: string): DownloadProgress | null {
    return this.downloads.get(downloadId) || null;
  }

  // Get all downloads
  getAllDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values());
  }

  // Get downloads by status
  getDownloadsByStatus(status: DownloadProgress['status']): DownloadProgress[] {
    return this.getAllDownloads().filter(download => download.status === status);
  }

  // Open downloads folder
  private openDownloadsFolder(): void {
    const downloadsPath = this.getDownloadsPath();
    
    if (Platform.OS === 'android') {
      // Open file manager to downloads folder
      Linking.openURL(`content://com.android.externalstorage.documents/document/primary%3ADownload`).catch(() => {
        // Fallback to generic file manager
        Linking.openURL('content://com.android.documentsui.picker').catch(() => {
          Alert.alert('Cannot Open', 'Please manually open your Downloads folder in the file manager.');
        });
      });
    } else {
      // iOS - open Files app
      Linking.openURL('shareddocuments://').catch(() => {
        Alert.alert('Cannot Open', 'Please manually open the Files app and navigate to the Downloads folder.');
      });
    }
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Format download speed
  formatSpeed(bytesPerSecond: number): string {
    return `${this.formatFileSize(bytesPerSecond)}/s`;
  }

  // Format time remaining
  formatTimeRemaining(seconds: number): string {
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
  }

  // Save downloads to storage
  private async saveDownloads(): Promise<void> {
    try {
      const downloadsArray = Array.from(this.downloads.values());
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloadsArray));
        }
      } else {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloadsArray));
      }
    } catch (error) {
      console.error('Save downloads error:', error);
    }
  }

  // Load downloads from storage
  private async loadDownloads(): Promise<void> {
    try {
      let downloadsJson: string | null = null;
      
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          downloadsJson = localStorage.getItem(this.STORAGE_KEY);
        }
      } else {
        downloadsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      }
      
      if (downloadsJson) {
        const downloadsArray: DownloadProgress[] = JSON.parse(downloadsJson);
        downloadsArray.forEach(download => {
          this.downloads.set(download.id, download);
        });
      }
    } catch (error) {
      console.error('Load downloads error:', error);
    }
  }

  // Clear all downloads
  async clearAllDownloads(): Promise<void> {
    // Cancel all active downloads
    for (const downloadId of this.downloadJobs.keys()) {
      this.cancelDownload(downloadId);
    }

    this.downloads.clear();
    this.downloadJobs.clear();
    this.callbacks.clear();
    
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } else {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const fileDownloadService = new FileDownloadService();
