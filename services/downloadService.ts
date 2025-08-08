import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

interface ArchiveSearchResult {
  identifier: string;
  title: string;
  description?: string;
  downloads: number;
  files?: ArchiveFile[];
}

interface ArchiveFile {
  name: string;
  source: string;
  format: string;
  size?: string;
  length?: string;
}

interface ArchiveMetadata {
  identifier: string;
  metadata: {
    title: string;
    description?: string;
    subject?: string[];
    date?: string;
  };
  files: ArchiveFile[];
}

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
  }

  // Toast notification helper
  private showToast(title: string, message: string) {
    Alert.alert(title, message);
  }

  // Search Internet Archive for movie content
  async searchInternetArchive(movieTitle: string, year?: number): Promise<ArchiveSearchResult[]> {
    try {
      // Clean and normalize the movie title for better search results
      const cleanTitle = movieTitle.replace(/[^\w\s]/g, '').trim();
      const searchQuery = year ? `${cleanTitle} ${year}` : cleanTitle;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Search for movies/videos in Internet Archive with broader collections
      const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodedQuery}) AND mediatype:movies&fl=identifier,title,description,downloads&rows=50&page=1&output=json&sort[]=downloads+desc`;
      
      console.log('Searching Internet Archive with URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      const results = data.response?.docs || [];
      
      console.log(`Found ${results.length} potential matches for "${movieTitle}"`);
      
      // Filter results to find the best matches
      return results.filter(result => {
        const resultTitle = result.title?.toLowerCase() || '';
        const searchTitle = cleanTitle.toLowerCase();
        
        // Check if the title contains key words from the search
        const searchWords = searchTitle.split(' ').filter(word => word.length > 2);
        const matchingWords = searchWords.filter(word => resultTitle.includes(word));
        
        // Consider it a match if at least 60% of significant words match
        return matchingWords.length >= Math.max(1, Math.floor(searchWords.length * 0.6));
      });
    } catch (error) {
      console.error('Archive.org search error:', error);
      throw new Error('Failed to search Internet Archive. Please check your connection.');
    }
  }

  // Get metadata and file list for a specific item
  async getArchiveMetadata(identifier: string): Promise<ArchiveMetadata | null> {
    try {
      const metadataUrl = `https://archive.org/metadata/${identifier}`;
      
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`Metadata fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for video files
      const videoFiles = data.files?.filter((file: ArchiveFile) => 
        file.format && ['mp4', 'avi', 'mkv', 'mov', 'wmv'].includes(file.format.toLowerCase())
      ) || [];
      
      return {
        identifier: data.metadata?.identifier || identifier,
        metadata: data.metadata || {},
        files: videoFiles
      };
    } catch (error) {
      console.error('Archive.org metadata error:', error);
      return null;
    }
  }

  // Find best quality video file from archive metadata
  findBestVideoFile(files: ArchiveFile[]): ArchiveFile | null {
    if (!files || files.length === 0) return null;
    
    console.log('Available files:', files.map(f => `${f.name} (${f.format}) - ${f.size || 'unknown size'}`));
    
    // Filter for video files with common video formats
    const videoFiles = files.filter(f => {
      const format = f.format?.toLowerCase();
      const name = f.name?.toLowerCase();
      return (
        format && 
        ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'].includes(format)
      ) || (
        name && 
        /\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v)$/i.test(name)
      );
    });
    
    if (videoFiles.length === 0) {
      console.log('No video files found');
      return null;
    }
    
    console.log(`Found ${videoFiles.length} video files`);
    
    // Prefer MP4 format for better compatibility
    const mp4Files = videoFiles.filter(f => 
      f.format?.toLowerCase() === 'mp4' || 
      f.name?.toLowerCase().endsWith('.mp4')
    );
    
    const targetFiles = mp4Files.length > 0 ? mp4Files : videoFiles;
    
    // Sort by quality indicators and size
    const sortedFiles = targetFiles.sort((a, b) => {
      // First, prioritize files with quality indicators in filename
      const aHasQuality = /\b(1080p|720p|hd|high|quality)\b/i.test(a.name || '');
      const bHasQuality = /\b(1080p|720p|hd|high|quality)\b/i.test(b.name || '');
      
      if (aHasQuality && !bHasQuality) return -1;
      if (!aHasQuality && bHasQuality) return 1;
      
      // Then sort by file size if available
      if (a.size && b.size) {
        const sizeA = parseInt(a.size) || 0;
        const sizeB = parseInt(b.size) || 0;
        return sizeB - sizeA; // Larger files first
      }
      
      // Fallback to name length (longer names often indicate higher quality)
      return b.name.length - a.name.length;
    });
    
    const selectedFile = sortedFiles[0];
    console.log(`Selected file: ${selectedFile.name} (${selectedFile.format}) - ${selectedFile.size || 'unknown size'}`);
    
    return selectedFile;
  }

  // Search for movie and return download URL if found
  async findMovieDownloadUrl(movieTitle: string, year?: number): Promise<string | null> {
    try {
      console.log(`Starting search for: "${movieTitle}" (${year || 'unknown year'})`);
      
      // Search for the movie
      const searchResults = await this.searchInternetArchive(movieTitle, year);
      
      if (!searchResults || searchResults.length === 0) {
        console.log('No search results found');
        return null;
      }
      
      console.log(`Found ${searchResults.length} search results, checking for video files...`);
      
      // Try each search result until we find a downloadable video
      for (let i = 0; i < Math.min(searchResults.length, 10); i++) { // Limit to top 10 results
        const result = searchResults[i];
        console.log(`Checking result ${i + 1}: ${result.title} (${result.identifier})`);
        
        try {
          const metadata = await this.getArchiveMetadata(result.identifier);
          if (metadata && metadata.files.length > 0) {
            console.log(`Found ${metadata.files.length} files in ${result.identifier}`);
            const bestFile = this.findBestVideoFile(metadata.files);
            if (bestFile) {
              const downloadUrl = `https://archive.org/download/${metadata.identifier}/${encodeURIComponent(bestFile.name)}`;
              console.log(`Found video file: ${bestFile.name}`);
              console.log(`Download URL: ${downloadUrl}`);
              return downloadUrl;
            }
          }
        } catch (metadataError) {
          console.error(`Error fetching metadata for ${result.identifier}:`, metadataError);
          // Continue to next result
        }
      }
      
      console.log('No video files found in any search results');
      return null;
    } catch (error) {
      console.error('Error finding movie download URL:', error);
      return null;
    }
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

      // Show completion toast
      this.showToast('Download Complete', `${nextDownload.title} has been downloaded successfully.`);
    } catch (error) {
      nextDownload.status = 'failed';
      console.error('Download failed:', error);

      // Show error toast
      this.showToast('Download Failed', `Failed to download ${nextDownload.title}. Please try again.`);
    }

    this.activeDownloads--;
    this.saveToStorage();

    // Process next item in queue
    this.processDownloadQueue();
  }

  // Download from Internet Archive with enhanced error handling
  private async downloadFromInternetArchive(item: DownloadItem): Promise<void> {
    if (!item.downloadUrl) {
      throw new Error('No download URL provided');
    }

    const fileName = `${item.title.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}_${Date.now()}.mp4`;
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    const downloadPath = `${downloadDir}${fileName}`;

    console.log('Download path:', downloadPath);

    // Ensure downloads directory exists
    try {
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
        console.log('Created downloads directory:', downloadDir);
      }
    } catch (error) {
      console.error('Error creating downloads directory:', error);
      throw new Error('Failed to create downloads directory. Please check storage permissions.');
    }

    // Check available storage space before starting download
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const requiredSpace = item.size * 1024 * 1024; // Convert MB to bytes

      if (freeSpace < requiredSpace * 1.1) { // Add 10% buffer
        throw new Error('Insufficient storage space. Please free up some space and try again.');
      }
    } catch (error) {
      console.error('Storage check failed:', error);
    }

    let lastUpdateTime = Date.now();
    let lastBytesWritten = 0;

    const downloadResumable = FileSystem.createDownloadResumable(
      item.downloadUrl,
      downloadPath,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0'
        }
      },
      (downloadProgress) => {
        try {
          if (downloadProgress.totalBytesExpectedToWrite > 0) {
            const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
            item.progress = Math.round(Math.min(progress, 100));
            item.fileSize = downloadProgress.totalBytesExpectedToWrite;

            // Calculate actual size in MB
            item.size = Math.round(downloadProgress.totalBytesExpectedToWrite / (1024 * 1024));

            // Calculate download speed (optional - for future use)
            const currentTime = Date.now();
            const timeDiff = currentTime - lastUpdateTime;
            if (timeDiff >= 1000) { // Update speed every second
              const bytesDiff = downloadProgress.totalBytesWritten - lastBytesWritten;
              const speedBps = bytesDiff / (timeDiff / 1000);
              const speedMbps = (speedBps / (1024 * 1024)).toFixed(1);

              lastUpdateTime = currentTime;
              lastBytesWritten = downloadProgress.totalBytesWritten;
            }

            this.saveToStorage();

            // Notify progress callback if exists
            const callback = this.downloadCallbacks.get(item.id);
            if (callback) {
              callback(item.progress);
            }
          }
        } catch (error) {
          console.error('Progress update error:', error);
        }
      }
    );

    try {
      const result = await downloadResumable.downloadAsync();
      if (result) {
        item.filePath = result.uri;

        // Verify file integrity
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error('Downloaded file is corrupted or empty');
        }
      } else {
        throw new Error('Download completed but no file was saved');
      }
    } catch (error) {
      // Clean up partial download
      try {
        await FileSystem.deleteAsync(downloadPath, { idempotent: true });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      if (error.message.includes('Network')) {
        throw new Error('Network error occurred. Please check your internet connection and try again.');
      } else if (error.message.includes('storage') || error.message.includes('space')) {
        throw new Error('Insufficient storage space. Please free up some space and try again.');
      } else {
        throw new Error(`Download failed: ${error.message}`);
      }
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