
export interface DownloadItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  poster_path: string;
  downloadUrl?: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  size?: string;
  downloadedAt?: Date;
}

class DownloadService {
  private downloads: DownloadItem[] = [];

  // Get all downloads
  getDownloads(): DownloadItem[] {
    return this.downloads;
  }

  // Add item to downloads
  addDownload(item: {
    id: string;
    title: string;
    type: 'movie' | 'tv';
    poster_path: string;
  }): void {
    const downloadItem: DownloadItem = {
      ...item,
      progress: 0,
      status: 'pending',
    };

    // Check if already exists
    const exists = this.downloads.find(d => d.id === item.id);
    if (!exists) {
      this.downloads.push(downloadItem);
      this.startDownload(downloadItem);
    }
  }

  // Start download process (simulated)
  private startDownload(item: DownloadItem): void {
    // Update status to downloading
    item.status = 'downloading';
    
    // Simulate download progress
    const progressInterval = setInterval(() => {
      item.progress += Math.random() * 20;
      
      if (item.progress >= 100) {
        item.progress = 100;
        item.status = 'completed';
        item.downloadedAt = new Date();
        clearInterval(progressInterval);
      }
    }, 1000);
  }

  // Remove download
  removeDownload(id: string): void {
    this.downloads = this.downloads.filter(d => d.id !== id);
  }

  // Get download by ID
  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.find(d => d.id === id);
  }

  // Check if item is already downloaded or downloading
  isDownloaded(id: string): boolean {
    const download = this.getDownload(id);
    return download ? download.status === 'completed' : false;
  }

  isDownloading(id: string): boolean {
    const download = this.getDownload(id);
    return download ? download.status === 'downloading' : false;
  }

  // Clear all completed downloads
  clearCompleted(): void {
    this.downloads = this.downloads.filter(d => d.status !== 'completed');
  }
}

export const downloadService = new DownloadService();
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

  constructor() {
    this.loadFromStorage();
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

  // Add item to download queue
  addToDownloadQueue(
    contentId: number,
    contentType: 'movie' | 'tv',
    title: string,
    posterPath: string,
    quality: 'low' | 'medium' | 'high',
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
      episodeNumber
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
      await this.simulateDownload(nextDownload);
      nextDownload.status = 'completed';
      nextDownload.progress = 100;
      nextDownload.filePath = `downloads/${nextDownload.id}.mp4`;
      
      // Set expiration (30 days from now)
      nextDownload.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } catch (error) {
      nextDownload.status = 'failed';
      console.error('Download failed:', error);
    }

    this.activeDownloads--;
    this.saveToStorage();
    
    // Process next item in queue
    this.processDownloadQueue();
  }

  // Simulate download progress
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

  // Cancel download
  cancelDownload(downloadId: string): void {
    const downloadIndex = this.downloads.findIndex(item => item.id === downloadId);
    if (downloadIndex !== -1) {
      const download = this.downloads[downloadIndex];
      if (download.status === 'downloading') {
        this.activeDownloads--;
      }
      this.downloads.splice(downloadIndex, 1);
      this.downloadQueue = this.downloadQueue.filter(item => item.id !== downloadId);
      this.saveToStorage();
    }
  }

  // Delete downloaded content
  deleteDownload(downloadId: string): void {
    this.cancelDownload(downloadId);
  }

  // Check if content is downloaded
  isDownloaded(contentId: number, contentType: 'movie' | 'tv', episodeId?: number): boolean {
    return this.downloads.some(item => 
      item.contentId === contentId && 
      item.contentType === contentType && 
      item.status === 'completed' &&
      (episodeId ? item.episodeId === episodeId : true)
    );
  }

  // Get download info for content
  getDownloadInfo(contentId: number, contentType: 'movie' | 'tv', episodeId?: number): DownloadItem | undefined {
    return this.downloads.find(item => 
      item.contentId === contentId && 
      item.contentType === contentType &&
      (episodeId ? item.episodeId === episodeId : true)
    );
  }

  // Get total downloaded size
  getTotalDownloadedSize(): number {
    return this.downloads
      .filter(item => item.status === 'completed')
      .reduce((total, item) => total + item.size, 0);
  }

  // Get available storage info
  getStorageInfo(): { used: number; total: number; available: number } {
    const used = this.getTotalDownloadedSize();
    const total = 50 * 1024; // Assume 50GB total storage
    const available = total - used;
    
    return { used, total, available };
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
    this.downloads = [];
    this.downloadQueue = [];
    this.activeDownloads = 0;
    this.saveToStorage();
  }

  // Storage methods
  private saveToStorage(): void {
    try {
      const downloadData = {
        downloads: this.downloads,
        downloadQueue: this.downloadQueue
      };
      localStorage.setItem('rkswot-downloads', JSON.stringify(downloadData));
    } catch (error) {
      console.error('Failed to save download data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('rkswot-downloads');
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
