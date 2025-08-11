import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';

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
  identifier?: string; // Internet Archive identifier
  filename?: string; // Filename from archive
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
  private downloadCallbacks: Map<string, (progress: number, progressInfo?: any) => void> = new Map();
  private readonly STORAGE_KEY = 'rkswot-downloads';

  // Singleton instance
  private static instance: DownloadService | null = null;

  // Placeholder for download history and queue as they are mentioned in changes but not in original code
  private downloadHistory: any[] = [];
  private downloadQueue: any[] = [];

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
      // Use the exact pattern from the example - properly encode and search
      const encodedTitle = encodeURIComponent(cleanTitle);

      // Primary search strategies based on the working example
      const searchQueries = [
        `title:(${encodedTitle})+AND+mediatype:(movies)`, // Most direct approach like the example
        `${encodedTitle}+AND+mediatype:(movies)+AND+format:(MPEG4+OR+Matroska+OR+Ogg Video)`, // Filter by video formats
        `title:"${cleanTitle}"+AND+mediatype:(movies)`, // Exact title match
        `${encodedTitle}+hindi+AND+mediatype:(movies)`, // For Indian movies
        `${encodedTitle}+movie+AND+mediatype:(movies)`, // Generic movie search
        `${encodedTitle}+AND+mediatype:(movies)+AND+collection:(feature_films)`,
        `${encodedTitle}+AND+mediatype:(movies)+AND+subject:(feature+films)`
      ];

      let bestResults: any[] = [];

      // Try each search query until we find good results
      for (const searchQuery of searchQueries) {
        // Use the exact URL pattern from the example
        const searchUrl = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl=identifier,title&rows=10&page=1&output=json&sort[]=downloads+desc`;

        this.logNetwork('Trying search query', searchUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0'
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
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0'
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

      // Enhanced filtering for actual movie video files
      const videoFiles = data.files.filter((file: any) => {
        const name = file.name?.toLowerCase() || '';
        const format = file.format?.toLowerCase() || '';

        // Skip audio-only files that might be soundtracks
        if (name.includes('song') || name.includes('soundtrack') || 
            name.includes('audio') || name.includes('music') ||
            format.includes('mp3') || format.includes('flac') || 
            format.includes('audio') || format.includes('sound')) {
          return false;
        }

        // Video file extensions
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv'];
        const hasVideoExtension = videoExtensions.some(ext => name.endsWith(ext));

        // Video formats from Internet Archive
        const videoFormats = ['mpeg4', 'h.264', 'matroska', 'ogg video', 'quicktime', 'windows media', 'flash video', 'webm'];
        const hasVideoFormat = videoFormats.some(fmt => format.includes(fmt));

        // Skip obviously non-video files
        if (name.includes('subtitle') || name.includes('.srt') || name.includes('.vtt') ||
            name.includes('thumbnail') || name.includes('.jpg') || name.includes('.png') ||
            format.includes('text') || format.includes('image') || 
            name.includes('poster') || name.includes('cover')) {
          return false;
        }

        // Ensure minimum file size (video files are typically larger than 10MB)
        const fileSize = file.size ? parseInt(file.size) : 0;
        if (fileSize > 0 && fileSize < 10000000) { // Less than 10MB
          return false;
        }

        return hasVideoExtension || hasVideoFormat;
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

        // Use exact URL construction pattern with download parameter
        const downloadUrl = `https://archive.org/download/${cleanIdentifier}/${encodeURIComponent(fileName)}?download=1`;

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

  // Simple download function that opens URL in browser
  async downloadFile(downloadUrl: string, filename: string): Promise<void> {
    try {
      console.log('Opening download URL in browser:', downloadUrl);

      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
        this.showToast('Download Opened', 'Download link opened in browser.');
      } else {
        this.showToast('Cannot Open URL', 'Unable to open the download URL. Please copy the link and paste it in your browser.');
      }
    } catch (error) {
      console.error('Download error:', error);
      this.showToast('Download Failed', 'Failed to open download URL. Please try again.');
    }
  }

  // Add item to download queue (simplified - just opens URL)
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

    if (downloadUrl) {
      // Simply open the URL in browser
      this.downloadFile(downloadUrl, title);
    }

    return downloadId;
  }

  // Set progress callback (simplified - not used anymore)
  setProgressCallback(downloadId: string, callback: (progress: number, progressInfo?: any) => void): void {
    this.downloadCallbacks.set(downloadId, callback);
  }

  // Remove progress callback
  removeProgressCallback(downloadId: string): void {
    this.downloadCallbacks.delete(downloadId);
  }

  // Get all downloads (simplified)
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

  // Simple methods (no longer needed but kept for compatibility)
  pauseDownload(downloadId: string): void {
    console.log('Pause not supported in browser mode');
  }

  resumeDownload(downloadId: string): void {
    console.log('Resume not supported in browser mode');
  }

  retryDownload(downloadId: string): void {
    console.log('Retry not supported in browser mode');
  }

  cancelDownload(downloadId: string): void {
    this.removeProgressCallback(downloadId);
  }

  deleteDownload(downloadId: string): void {
    this.cancelDownload(downloadId);
  }

  // Check if content is downloaded (always false in browser mode)
  isDownloaded(contentId: number, contentType: 'movie' | 'tv' = 'movie', episodeId?: number): boolean {
    return false;
  }

  // Get download info for content
  getDownloadInfo(contentId: number, contentType: 'movie' | 'tv' = 'movie', episodeId?: number): DownloadItem | undefined {
    return undefined;
  }

  // Get total downloaded size (always 0 in browser mode)
  getTotalDownloadedSize(): number {
    return 0;
  }

  // Get storage info (simplified)
  async getStorageInfo(): Promise<{ used: number; total: number; available: number }> {
    return { used: 0, total: 50 * 1024, available: 50 * 1024 };
  }

  // Clear all downloads (simplified)
  clearAllDownloads(): void {
    this.downloads = [];
    this.downloadCallbacks.clear();
    this.saveToStorage();
  }

  // Storage methods (simplified)
  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        downloads: this.downloads,
        history: this.downloadHistory,
        queue: this.downloadQueue,
      };

      if (Platform.OS === 'web') {
        try {
          // Check if localStorage is available
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('downloadData', JSON.stringify(data));
          }
        } catch (storageError) {
          console.warn('LocalStorage not available:', storageError);
        }
      } else {
        await AsyncStorage.setItem('downloadData', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save download data:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        try {
          // Check if localStorage is available
          if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem('downloadData');
            if (stored) {
              const data = JSON.parse(stored);
              this.downloads = data.downloads || [];
              this.downloadHistory = data.history || [];
              this.downloadQueue = data.queue || [];
            }
          } else {
            // localStorage not available, use in-memory storage
            this.downloads = [];
            this.downloadHistory = [];
            this.downloadQueue = [];
          }
        } catch (storageError) {
          console.warn('LocalStorage not available:', storageError);
          // Initialize with empty arrays
          this.downloads = [];
          this.downloadHistory = [];
          this.downloadQueue = [];
        }
      } else {
        // Use AsyncStorage for mobile
        const stored = await AsyncStorage.getItem('downloadData');
        if (stored) {
          const data = JSON.parse(stored);
          this.downloads = data.downloads || [];
          this.downloadHistory = data.history || [];
          this.downloadQueue = data.queue || [];
        }
      }
    } catch (error) {
      console.error('Failed to load download data:', error);
      // Initialize with empty arrays on error
      this.downloads = [];
      this.downloadHistory = [];
      this.downloadQueue = [];
    }
  }

  // Download movie from Internet Archive directly
  async downloadMovie(identifier: string, title: string): Promise<void> {
    try {
      console.log('=== DOWNLOAD MOVIE START ===');
      console.log('Identifier:', identifier);
      console.log('Title:', title);

      this.showToast('Starting Download', 'Preparing to download movie...');

      // Get metadata to find video files
      const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
      console.log('Fetching metadata from:', metadataUrl);

      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
      }

      const metadata = await metadataResponse.json();
      console.log('Metadata received, files count:', metadata.files?.length || 0);

      if (!metadata.files || metadata.files.length === 0) {
        throw new Error('No files found in archive');
      }

      // Filter for video files
      const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];
      const videoFiles = metadata.files.filter((file: any) => {
        if (!file.name) return false;
        const fileName = file.name.toLowerCase();
        return videoExtensions.some(ext => fileName.endsWith(ext)) &&
               parseInt(file.size || '0', 10) > 1024 * 1024; // At least 1MB
      });

      console.log('Video files found:', videoFiles.length);

      if (videoFiles.length === 0) {
        throw new Error('No video files found in archive');
      }

      // Use the largest video file
      const selectedFile = videoFiles.reduce((largest, current) => {
        const largestSize = parseInt(largest.size || '0', 10);
        const currentSize = parseInt(current.size || '0', 10);
        return currentSize > largestSize ? current : largest;
      });

      console.log('Selected file:', selectedFile.name, 'Size:', selectedFile.size);

      // Construct direct download URL
      const directDownloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(selectedFile.name)}?download=1`;
      console.log('Direct download URL:', directDownloadUrl);

      // For React Native, we'll use Linking to open the download URL
      const { Linking } = require('react-native');
      await Linking.openURL(directDownloadUrl);

      // Save download record
      const downloadRecord: DownloadItem = {
        id: Date.now().toString(),
        title: title,
        identifier: identifier,
        filename: selectedFile.name,
        size: parseInt(selectedFile.size || '0', 10),
        downloadedAt: new Date().toISOString(),
        status: 'completed',
        progress: 100
      };

      this.downloads.push(downloadRecord);
      await this.saveToStorage();

      console.log('=== DOWNLOAD MOVIE SUCCESS ===');
      this.showToast('Download Started', `${title} download has been initiated in your browser!`);

    } catch (error: any) {
      console.error('=== DOWNLOAD MOVIE ERROR ===');
      console.error('Error details:', error);

      let errorMessage = 'Download failed';
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        errorMessage = 'Download timed out. Please try again.';
      } else if (error.message.includes('No video files found')) {
        errorMessage = 'This archive contains no downloadable video files.';
      } else if (error.message.includes('Failed to fetch metadata')) {
        errorMessage = 'Could not access movie information. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.showToast('Download Failed', errorMessage);
      throw error;
    }
  }
}

export const downloadService = new DownloadService();