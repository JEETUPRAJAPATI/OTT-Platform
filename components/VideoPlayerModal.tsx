
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
      
      // Load and play the video
      if (videoRef.current) {
        await videoRef.current.loadAsync({ uri: file.downloadUrl });
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError('Failed to load video. The file may be corrupted or unavailable.');
      Alert.alert(
        'Playback Error',
        'Unable to play this video. Please try a different quality or check your internet connection.',
        [{ text: 'OK' }]
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
          <Ionicons name="play" size={24} color="#FF9800" />
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
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying || false);
            }
          }}
          onError={(error) => {
            console.error('Video error:', error);
            setError('Playback failed. Please try again or select a different quality.');
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
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setShowQualitySelector(true)}
            >
              <Text style={styles.retryButtonText}>Try Different Quality</Text>
            </TouchableOpacity>
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
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});
