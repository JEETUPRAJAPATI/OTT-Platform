

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
  private downloadCallbacks: Map<string, (progress: number, progressInfo?: any) => void> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Helper function that follows the exact 3-step pattern from the example
  async searchAndGetDownloadLinks(movieTitle: string): Promise<{
    success: boolean;
    identifier?: string;
    files?: { name: string; size: string; format: string; downloadUrl: string }[];
    error?: string;
  }> {
    try {
      // Step 1: Search for the movie
      const encodedTitle = encodeURIComponent(movieTitle.trim());
      const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodedTitle})+AND+mediatype:(movies)&fl=identifier,title&output=json`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        return { success: false, error: 'Search request failed' };
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.response?.docs?.length) {
        return { success: false, error: 'No movies found' };
      }
      
      const identifier = searchData.response.docs[0].identifier;
      
      // Step 2: Get metadata for that identifier
      const metadataUrl = `https://archive.org/metadata/${identifier}`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        return { success: false, error: 'Failed to get movie metadata' };
      }
      
      const metadataData = await metadataResponse.json();
      
      if (!metadataData.files) {
        return { success: false, error: 'No files found in archive' };
      }
      
      // Step 3: Filter video files and build download URLs
      const videoFiles = metadataData.files
        .filter((file: any) => {
          const format = file.format?.toLowerCase() || '';
          return format.includes('mpeg4') || format.includes('matroska') || format.includes('ogg video');
        })
        .map((file: any) => ({
          name: file.name,
          size: file.size,
          format: file.format,
          downloadUrl: `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`
        }));
      
      return {
        success: true,
        identifier,
        files: videoFiles
      };
      
    } catch (error) {
      return { success: false, error: `Error: ${error.message}` };
    }
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

      // Filter video files using format field (like the example shows)
      const videoFiles = data.files.filter((file: any) => {
        if (!file.name) return false;
        
        // Primary filtering by format field (exact approach from example)
        const format = file.format?.toLowerCase() || '';
        if (format.includes('mpeg4') || format.includes('matroska') || format.includes('ogg video')) {
          return true;
        }
        
        // Fallback to filename extension for files without proper format metadata
        const fileName = file.name.toLowerCase();
        const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];
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
        
        // Use exact URL construction pattern from example
        const downloadUrl = `https://archive.org/download/${cleanIdentifier}/${encodeURIComponent(fileName)}`;
        
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

  // Download from Internet Archive with improved error handling and real-time progress
  private async downloadFromInternetArchive(item: DownloadItem): Promise<void> {
    if (!item.downloadUrl) {
      throw new Error('No download URL provided');
    }

    // Extract filename from URL or create one
    const urlParts = item.downloadUrl.split('/');
    const originalFilename = urlParts[urlParts.length - 1] || `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
    const fileName = decodeURIComponent(originalFilename);

    let startTime = Date.now();
    let lastUpdateTime = startTime;
    let lastBytesLoaded = 0;
    let speed = 0;
    let estimatedTimeRemaining = 0;

    try {
      // Set initial status
      this.updateDownloadStatus(item.id, 'connecting');
      this.updateDownloadProgress(item.id, {
        progress: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        status: 'Connecting to server...',
        receivedBytes: 0,
        totalBytes: 0
      });

      // Create a more robust fetch request with proper headers
      const response = await fetch(item.downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://archive.org/'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found on server. The download link may be invalid.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. The file may have restricted access.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const contentLength = response.headers.get('Content-Length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (totalSize > 0) {
        item.size = Math.round(totalSize / (1024 * 1024)); // Update size in MB
        item.fileSize = totalSize;
      }

      // Set status to downloading
      this.updateDownloadStatus(item.id, 'downloading');
      this.updateDownloadProgress(item.id, {
        progress: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        status: 'Starting download...',
        receivedBytes: 0,
        totalBytes: totalSize
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader - browser may not support streaming downloads');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // Real-time progress loop
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Calculate progress and update UI frequently
        if (totalSize > 0) {
          const progress = (receivedLength / totalSize) * 100;
          item.progress = Math.round(Math.min(progress, 100));
          
          // Calculate speed and ETA every 500ms for smoother updates
          const currentTime = Date.now();
          const timeDiff = currentTime - lastUpdateTime;
          
          if (timeDiff >= 500) { // Update every 500ms for smoother progress
            const bytesDiff = receivedLength - lastBytesLoaded;
            speed = bytesDiff / (timeDiff / 1000); // bytes per second
            
            if (speed > 0) {
              const remainingBytes = totalSize - receivedLength;
              estimatedTimeRemaining = Math.round(remainingBytes / speed);
            }
            
            lastUpdateTime = currentTime;
            lastBytesLoaded = receivedLength;

            // Update progress with detailed real-time info
            this.updateDownloadProgress(item.id, {
              progress: item.progress,
              speed,
              estimatedTimeRemaining,
              status: `Downloading... ${item.progress}%`,
              receivedBytes: receivedLength,
              totalBytes: totalSize
            });
          }
        } else {
          // For unknown size, just show bytes downloaded
          item.progress = Math.min((receivedLength / (50 * 1024 * 1024)) * 100, 95); // Estimate based on 50MB
          
          this.updateDownloadProgress(item.id, {
            progress: item.progress,
            speed: 0,
            estimatedTimeRemaining: 0,
            status: `Downloading... ${Math.round(receivedLength / (1024 * 1024))}MB`,
            receivedBytes: receivedLength,
            totalBytes: 0
          });
        }
      }

      // Create blob from chunks
      this.updateDownloadStatus(item.id, 'completing');
      this.updateDownloadProgress(item.id, {
        progress: 95,
        speed: 0,
        estimatedTimeRemaining: 0,
        status: 'Finalizing download...',
        receivedBytes: receivedLength,
        totalBytes: totalSize || receivedLength
      });

      const blob = new Blob(chunks);
      
      // For React Native web, we need to handle downloads differently
      if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.includes('Expo')) {
        // React Native Web environment - save to file system
        const url = URL.createObjectURL(blob);
        
        // Create download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
      } else {
        // Regular web browser
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
      
      // Set final progress
      item.progress = 100;
      item.filePath = `Downloaded: ${fileName}`;
      
      this.updateDownloadProgress(item.id, {
        progress: 100,
        speed: 0,
        estimatedTimeRemaining: 0,
        status: 'Download completed!',
        receivedBytes: receivedLength,
        totalBytes: totalSize || receivedLength
      });

    } catch (error: any) {
      console.error('Download error details:', error);
      this.updateDownloadStatus(item.id, 'failed');
      
      let errorMessage = 'Download failed';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Download was cancelled';
      } else if (error.message.includes('CORS') || error.message.includes('cors')) {
        errorMessage = 'Network access blocked. Try using a different browser or disable ad blockers.';
      } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || 'Unknown error occurred during download';
      }

      this.updateDownloadProgress(item.id, {
        progress: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        status: errorMessage,
        receivedBytes: 0,
        totalBytes: 0
      });
      
      throw new Error(errorMessage);
    }
  }

  // Helper method to update download status
  private updateDownloadStatus(downloadId: string, status: string): void {
    const download = this.downloads.find(item => item.id === downloadId);
    if (download) {
      // Add status message based on current state
      let statusMessage = '';
      switch (status) {
        case 'connecting':
          statusMessage = 'Connecting...';
          break;
        case 'downloading':
          statusMessage = 'Downloading...';
          break;
        case 'completing':
          statusMessage = 'Finalizing download...';
          break;
        case 'completed':
          statusMessage = 'Download completed!';
          break;
        case 'failed':
          statusMessage = 'Download failed';
          break;
        default:
          statusMessage = status;
      }
      
      // Store status message for UI to display
      (download as any).statusMessage = statusMessage;
      this.saveToStorage();
    }
  }

  // Helper method to update detailed progress info with real-time notifications
  private updateDownloadProgress(downloadId: string, progressInfo: {
    progress: number;
    speed: number;
    estimatedTimeRemaining: number;
    status: string;
    receivedBytes: number;
    totalBytes: number;
  }): void {
    const download = this.downloads.find(item => item.id === downloadId);
    if (download) {
      // Update download progress
      download.progress = progressInfo.progress;
      
      // Store detailed progress info
      (download as any).progressInfo = progressInfo;
      (download as any).statusMessage = progressInfo.status;
      
      // Save to storage less frequently for performance
      if (progressInfo.progress % 5 === 0 || progressInfo.progress >= 100) {
        this.saveToStorage();
      }
      
      // Always notify callback for real-time UI updates
      const callback = this.downloadCallbacks.get(downloadId);
      if (callback) {
        try {
          callback(progressInfo.progress, progressInfo);
        } catch (callbackError) {
          console.warn('Progress callback error:', callbackError);
        }
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
  setProgressCallback(downloadId: string, callback: (progress: number, progressInfo?: any) => void): void {
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

