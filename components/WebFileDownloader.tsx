
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebFileDownloaderProps {
  url: string;
  filename?: string;
  title?: string;
}

export function WebFileDownloader({ url, filename, title }: WebFileDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  // Extract filename from URL if not provided
  const getFilename = (url: string, fallback?: string): string => {
    if (fallback) return fallback;
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'download';
      
      // Decode URI components to handle special characters
      return decodeURIComponent(filename);
    } catch {
      return 'download.mp4';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const downloadFile = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'This downloader only works in web browsers.');
      return;
    }

    setIsDownloading(true);
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setDownloadSpeed(0);

    const finalFilename = getFilename(url, filename);
    const startTime = Date.now();
    let lastTime = startTime;
    let lastLoaded = 0;

    try {
      console.log('Starting download:', url);
      console.log('Filename:', finalFilename);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      setTotalBytes(total);

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;
        setDownloadedBytes(receivedLength);

        // Calculate progress
        if (total > 0) {
          const progressPercent = (receivedLength / total) * 100;
          setProgress(Math.min(progressPercent, 100));
        }

        // Calculate download speed
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000; // Convert to seconds
        
        if (timeDiff >= 0.5) { // Update speed every 500ms
          const bytesDiff = receivedLength - lastLoaded;
          const speed = bytesDiff / timeDiff;
          setDownloadSpeed(speed);
          
          lastTime = currentTime;
          lastLoaded = receivedLength;
        }
      }

      // Combine chunks into a single array
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Create blob and download
      const blob = new Blob([allChunks], {
        type: response.headers.get('content-type') || 'application/octet-stream'
      });

      // Create download link
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      console.log('Download completed:', finalFilename);
      Alert.alert(
        'Download Complete!',
        `"${finalFilename}" has been downloaded successfully (${formatFileSize(receivedLength)}).`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
      setDownloadSpeed(0);
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <TouchableOpacity
        style={[styles.downloadButton, isDownloading && styles.downloadingButton]}
        onPress={downloadFile}
        disabled={isDownloading}
      >
        <Ionicons
          name={isDownloading ? 'download' : 'cloud-download'}
          size={24}
          color="#fff"
        />
        <Text style={styles.downloadButtonText}>
          {isDownloading ? 'Downloading...' : 'Download File'}
        </Text>
      </TouchableOpacity>

      {isDownloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>
      )}

      {isDownloading && totalBytes > 0 && (
        <View style={styles.downloadDetails}>
          <Text style={styles.detailText}>
            {formatFileSize(downloadedBytes)} / {formatFileSize(totalBytes)}
          </Text>
          {downloadSpeed > 0 && (
            <Text style={styles.detailText}>
              Speed: {formatSpeed(downloadSpeed)}
            </Text>
          )}
        </View>
      )}

      {Platform.OS !== 'web' && (
        <Text style={styles.warningText}>
          Web downloads only work in browsers
        </Text>
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
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
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
    backgroundColor: '#2196F3',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  warningText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
