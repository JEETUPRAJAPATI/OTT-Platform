
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';

export interface DownloadItem {
  id: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  quality: 'low' | 'medium' | 'high';
  size: number; // in MB
  downloadedAt: Date;
  expiresAt?: Date;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  episodeId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  filePath?: string;
  downloadUrl?: string; // Internet Archive URL
  fileSize?: number; // Actual file size in bytes
}

export interface DownloadQuality {
  label: string;
  value: 'low' | 'medium' | 'high';
  resolution: string;
  estimatedSize: string;
}

class DownloadService {
  private downloads: DownloadItem[] = [];
  private downloadQueue: DownloadItem[] = [];
  private maxConcurrentDownloads = 3;
  private activeDownloads = 0;
  private downloadCallbacks: Map<string, (progress: number) => void> = new Map();

  constructor() {
    this.loadFromStorage();
    this.setupNotifications();
  }

  private async setupNotifications() {
    await Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }

  // Get available quality options
  getQualityOptions(): DownloadQuality[] {
    return [
      {
        label: 'Low Quality',
        value: 'low',
        resolution: '480p',
        estimatedSize: '~500MB'
      },
      {
        label: 'Medium Quality',
        value: 'medium',
        resolution: '720p',
        estimatedSize: '~1.2GB'
      },
      {
        label: 'High Quality',
        value: 'high',
        resolution: '1080p',
        estimatedSize: '~2.5GB'
      }
    ];
  }

  // Add item to download queue (Internet Archive support)
  addToDownloadQueue(
    contentId: number,
    contentType: 'movie' | 'tv',
    title: string,
    posterPath: string,
    quality: 'low' | 'medium' | 'high',
    downloadUrl?: string,
    episodeId?: number,
    seasonNumber?: number,
    episodeNumber?: number
  ): string {
    const downloadId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Estimate file size based on quality
    let estimatedSize = 500; // MB
    switch (quality) {
      case 'medium':
        estimatedSize = 1200;
        break;
      case 'high':
        estimatedSize = 2500;
        break;
    }

    const downloadItem: DownloadItem = {
      id: downloadId,
      contentId,
      contentType,
      title,
      posterPath,
      quality,
      size: estimatedSize,
      downloadedAt: new Date(),
      progress: 0,
      status: 'pending',
      episodeId,
      seasonNumber,
      episodeNumber,
      downloadUrl,
    };

    this.downloads.push(downloadItem);
    this.downloadQueue.push(downloadItem);
    this.saveToStorage();
    
    // Start download if we have capacity
    this.processDownloadQueue();
    
    return downloadId;
  }

  // Process download queue
  private async processDownloadQueue(): Promise<void> {
    if (this.activeDownloads >= this.maxConcurrentDownloads) {
      return;
    }

    const nextDownload = this.downloadQueue.find(item => item.status === 'pending');
    if (!nextDownload) {
      return;
    }

    this.activeDownloads++;
    nextDownload.status = 'downloading';
    this.saveToStorage();

    try {
      if (nextDownload.downloadUrl) {
        await this.downloadFromInternetArchive(nextDownload);
      } else {
        await this.simulateDownload(nextDownload);
      }
      nextDownload.status = 'completed';
      nextDownload.progress = 100;
      
      // Set expiration (30 days from now)
      nextDownload.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Show completion notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Download Complete',
          body: `${nextDownload.title} has been downloaded successfully.`,
        },
        trigger: null,
      });
    } catch (error) {
      nextDownload.status = 'failed';
      console.error('Download failed:', error);
      
      // Show error notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Download Failed',
          body: `Failed to download ${nextDownload.title}. Tap to retry.`,
        },
        trigger: null,
      });
    }

    this.activeDownloads--;
    this.saveToStorage();
    
    // Process next item in queue
    this.processDownloadQueue();
  }

  // Download from Internet Archive
  private async downloadFromInternetArchive(item: DownloadItem): Promise<void> {
    if (!item.downloadUrl) {
      throw new Error('No download URL provided');
    }

    const fileName = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_${item.id}.mp4`;
    const downloadPath = `${FileSystem.documentDirectory}downloads/${fileName}`;
    
    // Ensure downloads directory exists
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    const dirInfo = await FileSystem.getInfoAsync(downloadDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      item.downloadUrl,
      downloadPath,
      {},
      (downloadProgress) => {
        const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
        item.progress = Math.round(progress);
        item.fileSize = downloadProgress.totalBytesExpectedToWrite;
        
        // Calculate actual size in MB
        item.size = Math.round(downloadProgress.totalBytesExpectedToWrite / (1024 * 1024));
        
        this.saveToStorage();
        
        // Notify progress callback if exists
        const callback = this.downloadCallbacks.get(item.id);
        if (callback) {
          callback(item.progress);
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (result) {
      item.filePath = result.uri;
    }
  }

  // Simulate download progress (for non-Internet Archive downloads)
  private simulateDownload(item: DownloadItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (item.status === 'paused') {
          return;
        }

        if (item.status !== 'downloading') {
          clearInterval(interval);
          if (item.status === 'failed') {
            reject(new Error('Download cancelled'));
          }
          return;
        }

        item.progress += Math.random() * 10;
        if (item.progress >= 100) {
          item.progress = 100;
          clearInterval(interval);
          resolve();
        }
        this.saveToStorage();
      }, 1000);

      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        setTimeout(() => {
          item.status = 'failed';
          clearInterval(interval);
          reject(new Error('Download failed'));
        }, Math.random() * 10000);
      }
    });
  }

  // Set progress callback for real-time updates
  setProgressCallback(downloadId: string, callback: (progress: number) => void): void {
    this.downloadCallbacks.set(downloadId, callback);
  }

  // Remove progress callback
  removeProgressCallback(downloadId: string): void {
    this.downloadCallbacks.delete(downloadId);
  }

  // Get all downloads
  getDownloads(): DownloadItem[] {
    return this.downloads;
  }

  // Get downloads by status
  getDownloadsByStatus(status: DownloadItem['status']): DownloadItem[] {
    return this.downloads.filter(item => item.status === status);
  }

  // Get completed downloads
  getCompletedDownloads(): DownloadItem[] {
    return this.downloads.filter(item => item.status === 'completed');
  }

  // Get downloading items
  getActiveDownloads(): DownloadItem[] {
    return this.downloads.filter(item => item.status === 'downloading');
  }

  // Get pending downloads
  getPendingDownloads(): DownloadItem[] {
    return this.downloads.filter(item => item.status === 'pending');
  }

  // Pause download
  pauseDownload(downloadId: string): void {
    const download = this.downloads.find(item => item.id === downloadId);
    if (download && download.status === 'downloading') {
      download.status = 'paused';
      this.activeDownloads--;
      this.saveToStorage();
    }
  }

  // Resume download
  resumeDownload(downloadId: string): void {
    const download = this.downloads.find(item => item.id === downloadId);
    if (download && download.status === 'paused') {
      download.status = 'pending';
      this.saveToStorage();
      this.processDownloadQueue();
    }
  }

  // Retry failed download
  retryDownload(downloadId: string): void {
    const download = this.downloads.find(item => item.id === downloadId);
    if (download && download.status === 'failed') {
      download.status = 'pending';
      download.progress = 0;
      this.saveToStorage();
      this.processDownloadQueue();
    }
  }

  // Cancel download
  cancelDownload(downloadId: string): void {
    const downloadIndex = this.downloads.findIndex(item => item.id === downloadId);
    if (downloadIndex !== -1) {
      const download = this.downloads[downloadIndex];
      if (download.status === 'downloading') {
        this.activeDownloads--;
      }
      
      // Remove file if it exists
      if (download.filePath) {
        FileSystem.deleteAsync(download.filePath, { idempotent: true });
      }
      
      this.downloads.splice(downloadIndex, 1);
      this.downloadQueue = this.downloadQueue.filter(item => item.id !== downloadId);
      this.removeProgressCallback(downloadId);
      this.saveToStorage();
    }
  }

  // Delete downloaded content
  deleteDownload(downloadId: string): void {
    this.cancelDownload(downloadId);
  }

  // Check if content is downloaded
  isDownloaded(contentId: number, contentType: 'movie' | 'tv' = 'movie', episodeId?: number): boolean {
    return this.downloads.some(item => 
      item.contentId === contentId && 
      item.contentType === contentType && 
      item.status === 'completed' &&
      (episodeId ? item.episodeId === episodeId : true)
    );
  }

  // Get download info for content
  getDownloadInfo(contentId: number, contentType: 'movie' | 'tv' = 'movie', episodeId?: number): DownloadItem | undefined {
    return this.downloads.find(item => 
      item.contentId === contentId && 
      item.contentType === contentType &&
      (episodeId ? item.episodeId === episodeId : true)
    );
  }

  // Get total downloaded size in MB
  getTotalDownloadedSize(): number {
    return this.downloads
      .filter(item => item.status === 'completed')
      .reduce((total, item) => total + item.size, 0);
  }

  // Get storage info
  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    try {
      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      const totalDiskCapacity = await FileSystem.getTotalDiskCapacityAsync();
      
      const used = this.getTotalDownloadedSize();
      const total = Math.round(totalDiskCapacity / (1024 * 1024)); // Convert to MB
      const available = Math.round(freeDiskStorage / (1024 * 1024)); // Convert to MB
      
      return { used, total, available };
    } catch (error) {
      console.error('Error getting storage info:', error);
      const used = this.getTotalDownloadedSize();
      return { used, total: 50 * 1024, available: 45 * 1024 }; // Fallback values
    }
  }

  // Clean up expired downloads
  cleanupExpiredDownloads(): void {
    const now = new Date();
    const expiredDownloads = this.downloads.filter(item => 
      item.expiresAt && item.expiresAt < now
    );
    
    expiredDownloads.forEach(item => {
      this.deleteDownload(item.id);
    });
  }

  // Clear all downloads
  clearAllDownloads(): void {
    // Delete all files
    this.downloads.forEach(item => {
      if (item.filePath) {
        FileSystem.deleteAsync(item.filePath, { idempotent: true });
      }
    });
    
    this.downloads = [];
    this.downloadQueue = [];
    this.activeDownloads = 0;
    this.downloadCallbacks.clear();
    this.saveToStorage();
  }

  // Storage methods
  private async saveToStorage(): Promise<void> {
    try {
      const downloadData = {
        downloads: this.downloads,
        downloadQueue: this.downloadQueue
      };
      await AsyncStorage.setItem('rkswot-downloads', JSON.stringify(downloadData));
    } catch (error) {
      console.error('Failed to save download data:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('rkswot-downloads');
      if (stored) {
        const downloadData = JSON.parse(stored);
        this.downloads = downloadData.downloads || [];
        this.downloadQueue = downloadData.downloadQueue || [];
        
        // Reset any downloading items to pending on app restart
        this.downloads.forEach(item => {
          if (item.status === 'downloading') {
            item.status = 'pending';
          }
        });
        
        // Clean up expired downloads
        this.cleanupExpiredDownloads();
        
        // Resume processing queue
        this.processDownloadQueue();
      }
    } catch (error) {
      console.error('Failed to load download data:', error);
    }
  }
}

export const downloadService = new DownloadService();
