

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

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

export interface VideoFile {
  name: string;
  size: number;
  format: string;
  quality: string;
  downloadUrl: string;
}

export interface SearchResult {
  identifier?: string;
  title?: string;
  found: boolean;
  error?: string;
}

export interface FilesResult {
  files: VideoFile[];
  success: boolean;
  error?: string;
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

  // Log network debugging information
  private logNetwork(action: string, url: string, error?: any) {
    console.log(`[DownloadService] ${action}:`, {
      url,
      timestamp: new Date().toISOString(),
      error: error?.message || error
    });
  }

  // Check network connectivity
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity test using a reliable endpoint
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('[DownloadService] Network connectivity check failed:', error);
      return false;
    }
  }

  // Search Internet Archive for movies with enhanced error handling and filtering
  async searchInternetArchive(movieTitle: string): Promise<SearchResult> {
    if (!movieTitle || movieTitle.trim().length === 0) {
      return { found: false, error: 'Movie title is required' };
    }

    const cleanTitle = movieTitle.trim();
    this.logNetwork('Starting search', `title: ${cleanTitle}`);

    // Check network connectivity first
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      const error = 'No internet connection. Please check your network and try again.';
      this.showToast('Network Error', error);
      return { found: false, error };
    }

    try {
      // Properly encode the search query with multiple search strategies
      const encodedTitle = encodeURIComponent(cleanTitle);
      
      // Try different search queries for better results
      const searchQueries = [
        `title:(${encodedTitle})+AND+mediatype:(movies)+AND+format:(mp4+OR+mkv+OR+avi+OR+webm)`,
        `${encodedTitle}+AND+mediatype:(movies)+AND+collection:(feature_films)`,
        `title:(${encodedTitle})+AND+mediatype:(movies)+AND+format:(mp4)`,
        `${encodedTitle}+AND+mediatype:(movies)+AND+format:(mkv)`,
        `title:"${cleanTitle}"+AND+mediatype:(movies)`,
        `${encodedTitle}+movie+AND+mediatype:(movies)`,
        `${encodedTitle}+AND+mediatype:(movies)+AND+subject:(feature+films)`
      ];
      
      let bestResults: any[] = [];
      
      // Try each search query until we find good results
      for (const searchQuery of searchQueries) {
        const searchUrl = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl=identifier,title,description,creator,year&rows=10&page=1&output=json&sort[]=downloads+desc`;
        
        this.logNetwork('Trying search query', searchUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            continue; // Try next query
          }

          const responseText = await response.text();
          if (!responseText || responseText.trim().length === 0) {
            continue;
          }

          const data = JSON.parse(responseText);
          
          if (data.response && Array.isArray(data.response.docs) && data.response.docs.length > 0) {
            // Filter out obvious non-movie results
            const filteredResults = data.response.docs.filter((doc: any) => {
              const title = doc.title?.toLowerCase() || '';
              const identifier = doc.identifier?.toLowerCase() || '';
              
              // Skip Twitter posts, social media, and other non-movie content
              if (title.includes('twitter') || title.includes('@') || 
                  identifier.includes('twitter') || identifier.includes('odysee')) {
                return false;
              }
              
              // Skip obvious non-movie formats
              if (title.includes('podcast') || title.includes('radio') || 
                  title.includes('tv show') || title.includes('episode')) {
                return false;
              }
              
              return true;
            });
            
            if (filteredResults.length > 0) {
              bestResults = filteredResults;
              break; // Found good results, stop searching
            }
          }
        } catch (queryError) {
          this.logNetwork('Query error', searchUrl, queryError);
          continue; // Try next query
        }
      }

      this.logNetwork('Search completed', 'all queries', {
        resultCount: bestResults.length,
        totalQueries: searchQueries.length
      });

      if (bestResults.length === 0) {
        this.showToast('Movie Not Found', `No movie files found for "${cleanTitle}". Try searching for a more specific title or a different movie.`);
        return { found: false, error: 'No movie archives found' };
      }

      // Find the best match - prioritize exact title matches and proper movie archives
      const exactMatches = bestResults.filter((doc: any) => 
        doc.title && doc.title.toLowerCase().includes(cleanTitle.toLowerCase())
      );
      
      const bestMatch = exactMatches.length > 0 ? exactMatches[0] : bestResults[0];

      if (!bestMatch.identifier) {
        throw new Error('Search result missing identifier');
      }

      // Validate that this archive actually contains video files
      const validationResult = await this.validateMovieArchive(bestMatch.identifier);
      if (!validationResult.isValid) {
        this.showToast('No Video Files', `Found archive "${bestMatch.title}" but it contains no downloadable video files. Try a different search term.`);
        return { found: false, error: 'Archive contains no video files' };
      }

      this.logNetwork('Valid movie archive found', bestMatch.identifier, {
        identifier: bestMatch.identifier,
        title: bestMatch.title,
        videoFileCount: validationResult.videoFileCount
      });

      const result = {
        identifier: bestMatch.identifier,
        title: bestMatch.title || cleanTitle,
        found: true
      };

      console.log('Returning search result:', result);
      return result;

    } catch (error: any) {
      this.logNetwork('Search error', 'searchInternetArchive', error);

      let errorMessage = 'Failed to search for movie';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Search timed out. Please try again.';
      } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server returned invalid data. Please try again later.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      }

      this.showToast('Search Failed', errorMessage);
      return { found: false, error: errorMessage };
    }
  }

  // Validate that an archive contains actual video files
  private async validateMovieArchive(identifier: string): Promise<{ isValid: boolean; videoFileCount: number }> {
    try {
      const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
      
      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0'
        }
      });

      if (!response.ok) {
        return { isValid: false, videoFileCount: 0 };
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      if (!data.files || !Array.isArray(data.files)) {
        return { isValid: false, videoFileCount: 0 };
      }

      // Count video files
      const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];
      const videoFiles = data.files.filter((file: any) => {
        if (!file.name) return false;
        const fileName = file.name.toLowerCase();
        return videoExtensions.some(ext => fileName.endsWith(ext)) && 
               parseInt(file.size || '0', 10) > 1024 * 1024; // At least 1MB
      });

      return { 
        isValid: videoFiles.length > 0, 
        videoFileCount: videoFiles.length 
      };
    } catch (error) {
      this.logNetwork('Validation error', identifier, error);
      return { isValid: false, videoFileCount: 0 };
    }
  }

  // Get movie files and metadata from Internet Archive with enhanced error handling
  async getInternetArchiveFiles(identifier: string): Promise<FilesResult> {
    if (!identifier || identifier.trim().length === 0) {
      return { files: [], success: false, error: 'Identifier is required' };
    }

    const cleanIdentifier = identifier.trim();
    this.logNetwork('Fetching metadata', `identifier: ${cleanIdentifier}`);

    try {
      const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(cleanIdentifier)}`;
      
      this.logNetwork('Fetching metadata from URL', metadataUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for metadata

      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      this.logNetwork('Metadata response received', metadataUrl, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty metadata response');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        this.logNetwork('Metadata JSON parse error', metadataUrl, { responseText: responseText.substring(0, 200) });
        throw new Error('Invalid JSON in metadata response');
      }

      if (!data.files || !Array.isArray(data.files)) {
        this.logNetwork('No files array in metadata', metadataUrl, { hasFiles: !!data.files });
        return { files: [], success: false, error: 'No files found in archive' };
      }

      this.logNetwork('Processing files', metadataUrl, { fileCount: data.files.length });

      // Filter and process video files
      const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];
      const videoFiles = data.files.filter((file: any) => {
        if (!file.name) return false;
        const fileName = file.name.toLowerCase();
        return videoExtensions.some(ext => fileName.endsWith(ext));
      });

      this.logNetwork('Video files found', metadataUrl, { videoFileCount: videoFiles.length });

      if (videoFiles.length === 0) {
        this.showToast('No Video Files', 'This archive contains no downloadable video files.');
        return { files: [], success: false, error: 'No video files found' };
      }

      const processedFiles: VideoFile[] = videoFiles.map((file: any) => {
        const fileName = file.name || '';
        const fileSize = parseInt(file.size || '0', 10);
        const fileSizeMB = Math.round(fileSize / (1024 * 1024));
        
        // Extract quality from filename with better detection
        let quality = 'Unknown';
        const lowerName = fileName.toLowerCase();
        
        if (lowerName.includes('2160p') || lowerName.includes('4k') || lowerName.includes('uhd')) {
          quality = '4K UHD';
        } else if (lowerName.includes('1440p')) {
          quality = '1440p QHD';
        } else if (lowerName.includes('1080p') || lowerName.includes('1080')) {
          quality = '1080p Full HD';
        } else if (lowerName.includes('720p') || lowerName.includes('720')) {
          quality = '720p HD';
        } else if (lowerName.includes('480p') || lowerName.includes('480')) {
          quality = '480p SD';
        } else if (lowerName.includes('360p') || lowerName.includes('360')) {
          quality = '360p';
        } else if (lowerName.includes('hd')) {
          quality = 'HD';
        } else if (fileSizeMB > 4000) {
          quality = '4K Quality';
        } else if (fileSizeMB > 2000) {
          quality = 'Full HD Quality';
        } else if (fileSizeMB > 1000) {
          quality = 'HD Quality';
        } else if (fileSizeMB > 500) {
          quality = 'Standard Quality';
        } else {
          quality = 'Low Quality';
        }
        
        // Extract format from file extension
        const format = fileName.split('.').pop()?.toUpperCase() || 'MP4';
        
        // Construct proper download URL - handle encoding properly
        const downloadUrl = `https://archive.org/download/${encodeURIComponent(cleanIdentifier)}/${encodeURIComponent(fileName)}`;
        
        return {
          name: fileName,
          size: Math.max(fileSizeMB, 1), // Ensure minimum 1MB to avoid zero-size files
          format,
          quality,
          downloadUrl
        };
      }).filter(file => file.size > 0 && file.name.length > 0); // Filter out invalid files

      // Sort by quality (highest first) and size
      const qualityOrder = [
        '4K UHD', '4K Quality', '1440p QHD', '1080p Full HD', 'Full HD Quality', 
        'HD', '720p HD', 'HD Quality', '480p SD', 'Standard Quality', 
        '360p', 'Low Quality', 'Unknown'
      ];
      
      processedFiles.sort((a, b) => {
        const aIndex = qualityOrder.indexOf(a.quality);
        const bIndex = qualityOrder.indexOf(b.quality);
        
        // If qualities are different, sort by quality order
        if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        
        // If same quality or one is unknown, sort by file size (larger first)
        if (a.size !== b.size) {
          return b.size - a.size;
        }
        
        // If same size, prefer certain formats
        const formatPriority = { 'MKV': 3, 'MP4': 2, 'WEBM': 1, 'AVI': 0 };
        const aFormatPriority = formatPriority[a.format] || 0;
        const bFormatPriority = formatPriority[b.format] || 0;
        
        return bFormatPriority - aFormatPriority;
      });

      this.logNetwork('Files processed successfully', metadataUrl, { 
        processedCount: processedFiles.length,
        qualities: processedFiles.map(f => f.quality)
      });

      return {
        files: processedFiles,
        success: true
      };

    } catch (error: any) {
      this.logNetwork('Metadata fetch error', 'getInternetArchiveFiles', error);

      let errorMessage = 'Failed to get movie files';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server returned invalid data. Please try again later.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      }

      this.showToast('Failed to Load Files', errorMessage);
      return { files: [], success: false, error: errorMessage };
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

    const fileName = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_${item.id}.mp4`;
    const downloadPath = `${FileSystem.documentDirectory}downloads/${fileName}`;
    
    // Ensure downloads directory exists
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    try {
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
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
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0'
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

