import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoFile {
  name: string;
  size: number;
  format: string;
  quality: string;
  downloadUrl: string;
}

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  videoFiles: VideoFile[];
  movieTitle: string;
}

export function VideoPlayerModal({
  visible,
  onClose,
  videoFiles,
  movieTitle
}: VideoPlayerModalProps) {
  const videoRef = useRef<Video>(null);
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock states for movieFound, movieFiles, isLoading, isDownloading, downloadProgress
  // These would typically come from props or state management in a real app.
  const movieFound = videoFiles.length > 0;
  const movieFiles = videoFiles; // Use the passed videoFiles directly
  const isDownloading = false; // Placeholder
  const downloadProgress = 0; // Placeholder

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible && videoFiles.length > 0) {
      if (videoFiles.length === 1) {
        setSelectedFile(videoFiles[0]);
        setShowQualitySelector(false);
      } else {
        setShowQualitySelector(true);
      }
    }
  }, [visible, videoFiles]);

  useEffect(() => {
    // Auto-hide controls
    if (showControls && selectedFile) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, selectedFile]);

  const handlePlayPress = async (file: VideoFile) => {
    setSelectedFile(file);
    setShowQualitySelector(false);
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting playback for:', file.name);
      console.log('Video URL:', file.downloadUrl);

      // Check if it's a direct Internet Archive URL and modify if needed
      let playbackUrl = file.downloadUrl;

      // For Internet Archive URLs, ensure proper format for streaming
      if (playbackUrl.includes('archive.org/download/')) {
        // Remove the ?download=1 parameter if present for streaming
        playbackUrl = playbackUrl.replace('?download=1', '');
        console.log('Modified URL for streaming:', playbackUrl);
      }

      // Load and play the video
      if (videoRef.current) {
        const videoSource = {
          uri: playbackUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://archive.org/'
          }
        };

        console.log('Loading video with source:', videoSource);
        await videoRef.current.loadAsync(videoSource);
        console.log('Video loaded successfully, starting playback...');
        await videoRef.current.playAsync();
        setIsPlaying(true);
        console.log('Video playback started');
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError(`Failed to load video: ${error.message || 'Unknown error'}. This video may not support streaming playback.`);
      Alert.alert(
        'Playback Error',
        'This video cannot be streamed directly. You can try:\n\n• Download the video first\n• Try a different quality\n• Check your internet connection\n\nSome Internet Archive videos only support download, not streaming.',
        [
          { text: 'Try Different Quality', onPress: () => setShowQualitySelector(true) },
          { text: 'OK' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  const handleVideoTap = () => {
    setShowControls(!showControls);
  };

  const openInBrowser = async (downloadUrl: string) => {
    try {
      // Remove ?download=1 for better browser streaming
      const streamUrl = downloadUrl.replace('?download=1', '');
      console.log('Opening in browser:', streamUrl);

      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(streamUrl);
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Failed to open video in browser');
    }
  };

  const handleClose = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
      }
    } catch (error) {
      console.error('Error stopping video:', error);
    }

    setSelectedFile(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setShowQualitySelector(false);
    onClose();
  };

  // Placeholder functions for startPlay and startDownload as they are used in the provided changes
  const startPlay = () => {
    if (selectedFile) {
      handlePlayPress(selectedFile);
    }
  };

  const handleDirectDownload = async (url: string) => {
    Alert.alert('Download', `Initiating download for: ${url}`);
    // In a real app, this would trigger a download service
  };

  const startDownload = () => {
    if (selectedFile) {
      handleDirectDownload(selectedFile.downloadUrl);
    }
  };


  const renderQualitySelector = () => (
    <View style={styles.qualitySelectorContainer}>
      <Text style={styles.qualitySelectorTitle}>Select Quality</Text>
      {videoFiles.map((file, index) => (
        <TouchableOpacity
          key={index}
          style={styles.qualityOption}
          onPress={() => handlePlayPress(file)}
        >
          <View style={styles.qualityInfo}>
            <Text style={styles.qualityText}>
              {file.quality} - {Math.round(file.size)}MB - {file.format}
            </Text>
            <Text style={styles.fileName} numberOfLines={2}>
              {file.name}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePlayPress(file)}
            >
              <Ionicons name="play" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleDirectDownload(file.downloadUrl)}
            >
              <Ionicons name="download" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => openInBrowser(file.downloadUrl)}
            >
              <Ionicons name="globe" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderVideoPlayer = () => (
    <View style={styles.videoContainer}>
      <TouchableOpacity 
        style={styles.videoTouchArea}
        onPress={handleVideoTap}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          shouldPlay={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying || false);
              if (status.error) {
                console.error('Video playback status error:', status.error);
                setError(`Playback error: ${status.error}`);
              }
            }
          }}
          onError={(error) => {
            console.error('Video component error:', error);
            setError(`Video loading failed: ${error.message || 'Unknown error'}. This video may not support streaming.`);
            setIsLoading(false);
          }}
          onLoad={(status) => {
            console.log('Video loaded successfully:', status);
            setIsLoading(false);
          }}
          onLoadStart={() => {
            console.log('Video loading started...');
            setIsLoading(true);
          }}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9800" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => setShowQualitySelector(true)}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Try Different Quality</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => {
                  if (selectedFile) {
                    Alert.alert(
                      'Download Video',
                      'This video may work better if downloaded first. Would you like to download it?',
                      [
                        { text: 'Cancel' },
                        { 
                          text: 'Download', 
                          onPress: () => {
                            // Use the download service to open download URL
                            const downloadUrl = selectedFile.downloadUrl.includes('?download=1') 
                              ? selectedFile.downloadUrl 
                              : `${selectedFile.downloadUrl}?download=1`;

                            import('../services/downloadService').then(({ downloadService }) => {
                              downloadService.downloadFile(downloadUrl, selectedFile.name);
                              handleClose();
                            });
                          }
                        }
                      ]
                    );
                  }
                }}
              >
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Download Instead</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: '#2196F3' }]}
                onPress={() => selectedFile && openInBrowser(selectedFile.downloadUrl)}
              >
                <Ionicons name="globe" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.errorHint}>
              💡 Some Internet Archive videos only support download, not direct streaming
            </Text>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && selectedFile && !isLoading && !error && (
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsOverlay}
            pointerEvents="box-none"
          >
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.videoTitle} numberOfLines={1}>{movieTitle}</Text>
                <Text style={styles.qualityInfo} numberOfLines={1}>
                  {selectedFile.quality} • {selectedFile.format}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={() => setShowQualitySelector(true)} 
                style={styles.controlButton}
              >
                <Ionicons name="settings" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Center Play/Pause Button */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={48} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <Text style={styles.fileInfo}>
                Playing: {selectedFile.name}
              </Text>
              
              {movieFound && movieFiles.length > 0 && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={startPlay}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="play" size={20} color="#fff" />
                        <Text style={styles.playButtonText}>Play</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={startDownload}
                    disabled={isDownloading || isLoading}
                  >
                    {isDownloading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.downloadButtonText}>
                          {Math.round(downloadProgress)}%
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="download" size={20} color="#fff" />
                        <Text style={styles.downloadButtonText}>Download</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.browserButton}
                    onPress={() => openInBrowser(movieFiles[0]?.downloadUrl)}
                    disabled={isLoading}
                  >
                    <Ionicons name="globe" size={20} color="#fff" />
                    <Text style={styles.browserButtonText}>Browser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Player</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.content}>
          {showQualitySelector ? renderQualitySelector() : renderVideoPlayer()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  qualitySelectorContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  qualitySelectorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  qualityInfo: {
    flex: 1,
    marginRight: 12,
  },
  qualityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoTouchArea: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerControls: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  fileInfo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  playButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  browserButton: {
    flex: 1,
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  browserButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});