import { Platform, Alert, Linking } from 'react-native';

// Conditional imports for platform-specific packages
let AsyncStorage: any = null;
let RNFS: any = null;
let PermissionsAndroid: any = null;
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
  // Additional metadata
  posterPath?: string;
  contentId?: number;
  contentType?: 'movie' | 'tv';
  movieTitle?: string;
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

  // Check current permission status without requesting
  async checkPermissionStatus(): Promise<boolean> {
    if (!this.isNativeSupported) {
      return false;
    }

    if (Platform.OS === 'ios') {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;

        if (androidVersion >= 33) {
          // Android 13+ - Check READ_MEDIA_IMAGES
          const mediaImagesStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
          console.log('Current READ_MEDIA_IMAGES permission status:', mediaImagesStatus);
          return mediaImagesStatus;
        } else {
          // Android 12 and below - Check storage permissions
          const readStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          const writeStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          console.log('Current storage permission status - Read:', readStatus, 'Write:', writeStatus);
          return readStatus && writeStatus;
        }
      } catch (error) {
        console.error('Error checking permission status:', error);
        return false;
      }
    }

    return false;
  }

  // Request storage permissions (public method)
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
      console.log('iOS platform - storage permission granted by default');
      return true;
    }

    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;
      console.log('Android version:', androidVersion);

      try {
        if (!PermissionsAndroid) {
          throw new Error('PermissionsAndroid not available');
        }

        if (androidVersion >= 33) {
          // Android 13+ - Use READ_MEDIA_IMAGES instead of READ_EXTERNAL_STORAGE
          console.log('Android 13+ detected - checking READ_MEDIA_IMAGES permission');

          // Check if permission is already granted
          const mediaImagesStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
          console.log('READ_MEDIA_IMAGES permission status:', mediaImagesStatus);

          if (mediaImagesStatus) {
            console.log('Media images permission already granted');
            return true;
          }

          // Request media images permission
          const mediaResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Media Access Permission',
              message: 'This app needs access to save downloaded movies to your device.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          console.log('Media images permission request result:', mediaResult);

          if (mediaResult === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Media images permission granted');
            return true;
          } else {
            console.log('Media images permission denied');
            this.showPermissionDeniedAlert();
            return false;
          }

        } else if (androidVersion >= 30) {
          // Android 11+ - Check existing permissions first
          console.log('Android 11+ detected - checking storage permissions');

          const readStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          const writeStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);

          console.log('Storage permission status - Read:', readStatus, 'Write:', writeStatus);

          if (readStatus && writeStatus) {
            console.log('Storage permissions already granted');
            return true;
          }

          // Request permissions if not granted
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ];

          const results = await PermissionsAndroid.requestMultiple(permissions);
          console.log('Permission request results:', results);

          const allGranted = Object.values(results).every(
            result => result === PermissionsAndroid.RESULTS.GRANTED
          );

          if (allGranted) {
            console.log('All storage permissions granted');
            return true;
          } else {
            console.log('Some storage permissions denied');
            this.showPermissionDeniedAlert();
            return false;
          }

        } else {
          // Android 10 and below
          console.log('Android 10 and below - checking legacy storage permissions');

          const readStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          const writeStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);

          console.log('Legacy storage permission status - Read:', readStatus, 'Write:', writeStatus);

          if (readStatus && writeStatus) {
            console.log('Legacy storage permissions already granted');
            return true;
          }

          // Request permissions if not granted
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ];

          const results = await PermissionsAndroid.requestMultiple(permissions);
          console.log('Legacy permission request results:', results);

          const allGranted = Object.values(results).every(
            result => result === PermissionsAndroid.RESULTS.GRANTED
          );

          if (allGranted) {
            console.log('All legacy storage permissions granted');
            return true;
          } else {
            console.log('Some legacy storage permissions denied');
            this.showPermissionDeniedAlert();
            return false;
          }
        }

      } catch (error) {
        console.error('Storage permission error:', error);
        Alert.alert(
          'Permission Error',
          'Unable to request storage permission. Please manually enable storage access in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                Linking.openSettings().catch(() => {
                  Alert.alert('Error', 'Cannot open app settings. Please manually enable storage permission in your device settings.');
                });
              }
            }
          ]
        );
        return false;
      }
    }

    return false;
  }

  // Helper method to show permission denied alert with guidance
  private showPermissionDeniedAlert(): void {
    Alert.alert(
      'Storage Permission Required',
      'To download movies, this app needs storage permission. You can:\n\n1. Go to App Settings\n2. Enable "Files and media" or "Storage" permission\n3. Try downloading again\n\nIf you\'ve already granted permission but still see this message, try clearing the app cache and restart.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            Linking.openSettings().catch(() => {
              Alert.alert('Error', 'Cannot open app settings. Please manually enable storage permission in your device settings.');
            });
          }
        }
      ]
    );
  }

  // Get Downloads folder path with default Downloads directory
  private async getDownloadsPath(): Promise<string> {
    // Try to get custom download path from storage
    try {
      const customPath = await AsyncStorage.getItem('custom_download_path');
      if (customPath) {
        // Verify custom path exists, create if not
        const exists = await RNFS.exists(customPath);
        if (!exists) {
          await RNFS.mkdir(customPath);
        }
        return customPath;
      }
    } catch (error) {
      console.warn('Could not get custom download path:', error);
    }

    // Default to system Downloads folder
    if (Platform.OS === 'ios') {
      // iOS: Use Documents/Downloads folder
      const downloadsPath = `${RNFS.DocumentDirectoryPath}/Downloads`;
      try {
        const exists = await RNFS.exists(downloadsPath);
        if (!exists) {
          await RNFS.mkdir(downloadsPath);
        }
      } catch (error) {
        console.warn('Could not create iOS Downloads folder:', error);
      }
      return downloadsPath;
    } else {
      // Android: Use system Downloads directory as default
      return RNFS.DownloadDirectoryPath || `${RNFS.ExternalStorageDirectoryPath}/Download`;
    }
  }

  // Set custom download path
  async setCustomDownloadPath(path: string): Promise<boolean> {
    try {
      // Validate path exists or can be created
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.mkdir(path);
      }

      await AsyncStorage.setItem('custom_download_path', path);
      return true;
    } catch (error) {
      console.error('Error setting custom download path:', error);
      return false;
    }
  }

  // Get current download path
  async getCurrentDownloadPath(): Promise<string> {
    return this.getDownloadsPath();
  }

  // Reset to default download path
  async resetToDefaultPath(): Promise<void> {
    try {
      await AsyncStorage.removeItem('custom_download_path');
    } catch (error) {
      console.warn('Could not reset download path:', error);
    }
  }

  // Ensure Downloads folder exists
  private async ensureDownloadsFolderExists(): Promise<void> {
    const downloadsPath = await this.getDownloadsPath();

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
    callbacks?: DownloadCallbacks,
    metadata?: {
      posterPath?: string;
      contentId?: number;
      contentType?: 'movie' | 'tv';
    }
  ): Promise<string> {
    try {
      console.log('=== STARTING DOWNLOAD ===');
      console.log('URL:', url);
      console.log('Filename:', filename);
      console.log('Movie Title:', movieTitle);

      // Check if platform supports file downloads
      if (!this.isNativeSupported) {
        const error = 'File downloads are not supported on this platform. Please use the mobile app.';
        console.error(error);
        throw new Error(error);
      }

      // Check permissions first with detailed logging
      console.log('Checking storage permissions...');
      const hasPermission = await this.requestStoragePermissions();
      console.log('Storage permission status:', hasPermission);

      if (!hasPermission) {
        const error = 'Storage permission denied - cannot proceed with download';
        console.error(error);
        throw new Error('Storage permission denied');
      }

      console.log('Storage permission confirmed - proceeding with download');

      // Ensure Downloads folder exists
      await this.ensureDownloadsFolderExists();

      // Generate unique download ID
      const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate safe filename
      const safeFilename = this.generateSafeFilename(filename, movieTitle);
      const downloadsPath = await this.getDownloadsPath();
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
        lastUpdateTime: Date.now(),
        // Include metadata
        posterPath: metadata?.posterPath || '',
        contentId: metadata?.contentId,
        contentType: metadata?.contentType || 'movie',
        movieTitle: movieTitle
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
            onPress: () => this.openDownloadsFolder().catch(console.error)
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
    try {
      const downloadJob = this.downloadJobs.get(downloadId);
      const download = this.downloads.get(downloadId);
      
      if (downloadJob && typeof downloadJob.stop === 'function') {
        downloadJob.stop();
        console.log('Download job stopped for pause:', downloadId);
      }
      
      // Remove from active jobs but keep download record
      this.downloadJobs.delete(downloadId);
      
      if (download) {
        this.updateDownloadProgress(downloadId, {
          status: 'paused'
        });
        
        // Save current state to allow proper resume
        this.saveDownloads();
        console.log('Download paused successfully:', downloadId, 'at', download.progress.toFixed(1) + '%');
      }
    } catch (error) {
      console.error('Error pausing download:', error);
      // Still update status to paused
      this.updateDownloadProgress(downloadId, {
        status: 'paused'
      });
    }
  }

  // Resume download
  async resumeDownload(downloadId: string): Promise<void> {
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'paused') {
      try {
        console.log('Resuming download for:', downloadId);
        console.log('Current progress:', download.progress, '% - Bytes:', download.bytesWritten);

        // Update status to downloading
        this.updateDownloadProgress(downloadId, {
          status: 'downloading'
        });

        // Check if partial file exists
        let resumeFromByte = 0;
        if (download.filePath && download.bytesWritten > 0) {
          try {
            const fileExists = await RNFS.exists(download.filePath);
            if (fileExists) {
              const fileStats = await RNFS.stat(download.filePath);
              resumeFromByte = fileStats.size;
              console.log('Partial file exists, resuming from byte:', resumeFromByte);
            }
          } catch (error) {
            console.warn('Could not check partial file, starting fresh:', error);
            resumeFromByte = 0;
          }
        }

        // Resume download with Range header
        const downloadJob = RNFS.downloadFile({
          fromUrl: download.url,
          toFile: download.filePath!,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            'Range': resumeFromByte > 0 ? `bytes=${resumeFromByte}-` : undefined, // Resume from specific byte
          },
          background: true,
          discretionary: true,
          cacheable: false,
          progressInterval: 500,
          progressDivider: 1,
          resumable: true, // Enable resumable downloads
          begin: (res) => {
            console.log('Resume download started:', res);
            const totalContentLength = download.contentLength || parseInt(res.contentLength || '0', 10);
            
            this.updateDownloadProgress(downloadId, {
              contentLength: totalContentLength,
              status: 'downloading'
            });
          },
          progress: (res) => {
            // Calculate actual progress including resumed bytes
            const totalBytesWritten = resumeFromByte + res.bytesWritten;
            const totalContentLength = download.contentLength || res.contentLength;
            const progress = totalContentLength > 0 ? (totalBytesWritten / totalContentLength) * 100 : 0;
            
            const currentTime = Date.now();
            const downloadRecord = this.downloads.get(downloadId);

            if (downloadRecord) {
              const timeDiff = (currentTime - downloadRecord.lastUpdateTime) / 1000;
              const bytesDiff = totalBytesWritten - downloadRecord.bytesWritten;
              const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
              const remainingBytes = totalContentLength - totalBytesWritten;
              const estimatedTime = speed > 0 ? remainingBytes / speed : 0;

              this.updateDownloadProgress(downloadId, {
                progress: Math.min(progress, 100),
                bytesWritten: totalBytesWritten,
                contentLength: totalContentLength,
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
            console.log('Resume download completed:', result);
            this.handleDownloadComplete(downloadId, result.filePath || download.filePath!);
          })
          .catch((error) => {
            console.error('Resume download failed:', error);
            this.handleDownloadError(downloadId, error.message || 'Resume download failed');
          });

      } catch (error) {
        console.error('Error resuming download:', error);
        this.updateDownloadProgress(downloadId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Resume failed'
        });
      }
    }
  }

  // Cancel download
  cancelDownload(downloadId: string): void {
    try {
      console.log('Cancelling download:', downloadId);
      
      const downloadJob = this.downloadJobs.get(downloadId);
      if (downloadJob && typeof downloadJob.stop === 'function') {
        downloadJob.stop();
        console.log('Download job stopped for:', downloadId);
      }
      
      this.downloadJobs.delete(downloadId);

      const download = this.downloads.get(downloadId);
      if (download) {
        // Delete partial file
        if (download.filePath && download.status !== 'completed') {
          RNFS?.unlink(download.filePath).catch((error) => {
            console.warn('Could not delete partial file:', error);
          });
        }

        // Remove from downloads completely for cancelled items
        this.downloads.delete(downloadId);
        console.log('Download removed from list:', downloadId);
      }

      this.callbacks.delete(downloadId);
      
      // Save updated downloads
      this.saveDownloads();
      
    } catch (error) {
      console.error('Error cancelling download:', error);
      
      // Still try to remove it from the downloads list
      this.downloads.delete(downloadId);
      this.callbacks.delete(downloadId);
      this.saveDownloads();
    }
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

  // Get active downloads (downloading, pending, paused)
  getActiveDownloads(): DownloadProgress[] {
    return this.getAllDownloads().filter(download => 
      ['downloading', 'pending', 'paused'].includes(download.status)
    );
  }

  // Get completed downloads
  getCompletedDownloads(): DownloadProgress[] {
    return this.getDownloadsByStatus('completed');
  }

  // Get failed downloads
  getFailedDownloads(): DownloadProgress[] {
    return this.getDownloadsByStatus('failed');
  }

  // Retry download method
  async retryDownload(downloadId: string): Promise<string | null> {
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'failed') {
      try {
        console.log('Retrying download for:', downloadId);

        // Reset the download status
        this.updateDownloadProgress(downloadId, {
          status: 'pending',
          progress: 0,
          bytesWritten: 0,
          error: undefined
        });

        // Start a new download with the same parameters
        const newDownloadId = await this.startDownload(
          download.url,
          download.filename,
          download.filename.replace(/\.[^/.]+$/, ''),
          this.callbacks.get(downloadId)
        );

        // Remove the old failed download
        this.downloads.delete(downloadId);
        this.callbacks.delete(downloadId);
        await this.saveDownloads();

        return newDownloadId;
      } catch (error) {
        console.error('Error retrying download:', error);
        this.updateDownloadProgress(downloadId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Retry failed'
        });
        return null;
      }
    }
    return null;
  }

  // Open downloads folder
  private async openDownloadsFolder(): Promise<void> {
    const downloadsPath = await this.getDownloadsPath();

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

  // Debug helper method to log current permission and platform info
  async debugPermissionInfo(): Promise<void> {
    console.log('=== PERMISSION DEBUG INFO ===');
    console.log('Platform:', Platform.OS);
    console.log('Platform Version:', Platform.Version);
    console.log('Native Support:', this.isNativeSupported);

    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        console.log('Android Version:', androidVersion);

        if (androidVersion >= 33) {
          const mediaStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
          console.log('READ_MEDIA_IMAGES Status:', mediaStatus);
        } else {
          const readStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          const writeStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          console.log('READ_EXTERNAL_STORAGE Status:', readStatus);
          console.log('WRITE_EXTERNAL_STORAGE Status:', writeStatus);
        }

        const downloadsPath = await this.getDownloadsPath();
        console.log('Downloads Path:', downloadsPath);
        const pathExists = await RNFS.exists(downloadsPath);
        console.log('Downloads Path Exists:', pathExists);
      } catch (error) {
        console.error('Error getting permission debug info:', error);
      }
    }
    console.log('=== END PERMISSION DEBUG ===');
  }
}

// Create and export singleton instance
const fileDownloadService = new FileDownloadService();

export { fileDownloadService, FileDownloadService, DownloadProgress };
export default fileDownloadService;