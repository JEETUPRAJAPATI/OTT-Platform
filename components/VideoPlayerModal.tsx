
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
import { VideoView, useVideoPlayer } from 'expo-video';
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
  title: string;
}

export function VideoPlayerModal({
  visible,
  onClose,
  videoFiles,
  title
}: VideoPlayerModalProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const player = useVideoPlayer(
    selectedVideo?.downloadUrl || '',
    player => {
      player.loop = false;
      player.muted = false;
    }
  );

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleVideoSelection = async (videoFile: VideoFile) => {
    setIsLoading(true);
    try {
      setSelectedVideo(videoFile);
      if (player) {
        player.replace({ uri: videoFile.downloadUrl });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load video');
      console.error('Video loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (player) {
      if (player.playing) {
        await player.pause();
      } else {
        await player.play();
      }
    }
  };

  const handleVideoTap = () => {
    setShowControls(!showControls);
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderQualitySelector = () => (
    <View style={styles.qualitySelectorContainer}>
      <Text style={styles.qualitySelectorTitle}>Select Quality</Text>
      {videoFiles.map((file, index) => (
        <TouchableOpacity
          key={index}
          style={styles.qualityOption}
          onPress={() => handleVideoSelection(file)}
        >
          <View style={styles.qualityInfo}>
            <Text style={styles.qualityText}>{file.quality}</Text>
            <Text style={styles.fileName}>
              {file.format} • {formatFileSize(file.size)}
            </Text>
          </View>
          <Ionicons name="play-circle" size={24} color="#E50914" />
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
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {showControls && (
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsOverlay}
            pointerEvents="box-none"
          >
            <View style={styles.topControls}>
              <TouchableOpacity onPress={onClose} style={styles.controlButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
              <TouchableOpacity
                onPress={() => setSelectedVideo(null)}
                style={styles.controlButton}
              >
                <Ionicons name="settings" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                <Ionicons
                  name={player?.playing ? "pause" : "play"}
                  size={48}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.content}>
          {selectedVideo ? renderVideoPlayer() : renderQualitySelector()}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
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
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229,9,20,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
});
