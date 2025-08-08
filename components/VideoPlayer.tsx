
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  PanGestureHandler,
  State
} from 'react-native';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Slider } from 'react-native';
import { userService } from '@/services/userService';
import { downloadService } from '@/services/downloadService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoPlayerProps {
  source: { uri: string } | number;
  title: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  subtitles?: Array<{ language: string; url: string; label: string }>;
  qualities?: Array<{ label: string; url: string; quality: string }>;
}

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
}

export function VideoPlayer({
  source,
  title,
  contentId,
  contentType,
  seasonNumber,
  episodeNumber,
  onClose,
  onNext,
  onPrevious,
  subtitles = [],
  qualities = []
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(qualities[0]?.quality || 'auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    isBuffering: false,
    isMuted: false,
    volume: 1.0,
    playbackRate: 1.0
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load user's saved position
    const continueWatching = userService.getContinueWatching();
    const savedItem = continueWatching.find(item => 
      item.contentId === contentId && 
      item.contentType === contentType &&
      (episodeNumber ? item.episodeNumber === episodeNumber : true)
    );
    
    if (savedItem && savedItem.progress > 5) {
      // Resume from saved position
      const resumeTime = (savedItem.progress / 100) * playbackState.duration;
      videoRef.current?.setPositionAsync(resumeTime * 1000);
    }
  }, [playbackState.duration]);

  useEffect(() => {
    // Auto-hide controls
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

  useEffect(() => {
    // Save viewing progress periodically
    const interval = setInterval(() => {
      if (playbackState.isPlaying && playbackState.duration > 0) {
        const progress = (playbackState.position / playbackState.duration) * 100;
        
        // Update continue watching
        userService.updateContinueWatching(
          contentId,
          contentType,
          title,
          '', // poster path would be passed from parent
          progress,
          undefined, // episode ID
          seasonNumber,
          episodeNumber
        );
        
        // Add to viewing history
        userService.addToHistory(
          contentId,
          contentType,
          title,
          '', // poster path
          progress,
          undefined, // episode ID
          seasonNumber,
          episodeNumber
        );
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [playbackState, contentId, contentType, title, seasonNumber, episodeNumber]);

  const togglePlayPause = async () => {
    if (playbackState.isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  };

  const toggleMute = async () => {
    await videoRef.current?.setIsMutedAsync(!playbackState.isMuted);
  };

  const handleSeek = async (value: number) => {
    const seekTime = value * playbackState.duration;
    await videoRef.current?.setPositionAsync(seekTime * 1000);
  };

  const handleVolumeChange = async (value: number) => {
    await videoRef.current?.setVolumeAsync(value);
  };

  const handlePlaybackRateChange = async (rate: number) => {
    await videoRef.current?.setRateAsync(rate, true);
    setPlaybackState(prev => ({ ...prev, playbackRate: rate }));
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await videoRef.current?.dismissFullscreenPlayer();
    } else {
      await videoRef.current?.presentFullscreenPlayer();
    }
  };

  const handleVideoTap = () => {
    setShowControls(!showControls);
  };

  const skip = async (seconds: number) => {
    const newPosition = Math.max(0, Math.min(playbackState.duration, playbackState.position + seconds));
    await videoRef.current?.setPositionAsync(newPosition * 1000);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const onPlaybackStatusUpdate = (status: any) => {
    setPlaybackState({
      isPlaying: status.isPlaying || false,
      position: (status.positionMillis || 0) / 1000,
      duration: (status.durationMillis || 0) / 1000,
      isBuffering: status.isBuffering || false,
      isMuted: status.isMuted || false,
      volume: status.volume || 1.0,
      playbackRate: status.rate || 1.0
    });
  };

  const onFullscreenUpdate = (event: any) => {
    setIsFullscreen(event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_PRESENT);
  };

  const renderQualityMenu = () => (
    <Modal
      visible={showQualityMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQualityMenu(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setShowQualityMenu(false)}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Video Quality</Text>
          {qualities.map((quality) => (
            <TouchableOpacity
              key={quality.quality}
              style={[
                styles.menuItem,
                selectedQuality === quality.quality && styles.selectedMenuItem
              ]}
              onPress={() => {
                setSelectedQuality(quality.quality);
                setShowQualityMenu(false);
                // Here you would switch video source
              }}
            >
              <Text style={[
                styles.menuItemText,
                selectedQuality === quality.quality && styles.selectedMenuItemText
              ]}>
                {quality.label}
              </Text>
              {selectedQuality === quality.quality && (
                <Ionicons name="checkmark" size={20} color="#E50914" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSubtitleMenu = () => (
    <Modal
      visible={showSubtitleMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSubtitleMenu(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setShowSubtitleMenu(false)}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Subtitles</Text>
          <TouchableOpacity
            style={[
              styles.menuItem,
              selectedSubtitle === null && styles.selectedMenuItem
            ]}
            onPress={() => {
              setSelectedSubtitle(null);
              setShowSubtitleMenu(false);
            }}
          >
            <Text style={[
              styles.menuItemText,
              selectedSubtitle === null && styles.selectedMenuItemText
            ]}>
              Off
            </Text>
            {selectedSubtitle === null && (
              <Ionicons name="checkmark" size={20} color="#E50914" />
            )}
          </TouchableOpacity>
          {subtitles.map((subtitle) => (
            <TouchableOpacity
              key={subtitle.language}
              style={[
                styles.menuItem,
                selectedSubtitle === subtitle.language && styles.selectedMenuItem
              ]}
              onPress={() => {
                setSelectedSubtitle(subtitle.language);
                setShowSubtitleMenu(false);
              }}
            >
              <Text style={[
                styles.menuItemText,
                selectedSubtitle === subtitle.language && styles.selectedMenuItemText
              ]}>
                {subtitle.label}
              </Text>
              {selectedSubtitle === subtitle.language && (
                <Ionicons name="checkmark" size={20} color="#E50914" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSettingsMenu = () => (
    <Modal
      visible={showSettings}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSettings(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setShowSettings(false)}
      >
        <View style={styles.settingsContainer}>
          <Text style={styles.menuTitle}>Playback Settings</Text>
          
          {/* Playback Speed */}
          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Playback Speed</Text>
            <View style={styles.speedButtons}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.speedButton,
                    playbackState.playbackRate === rate && styles.selectedSpeedButton
                  ]}
                  onPress={() => handlePlaybackRateChange(rate)}
                >
                  <Text style={[
                    styles.speedButtonText,
                    playbackState.playbackRate === rate && styles.selectedSpeedButtonText
                  ]}>
                    {rate}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Volume */}
          <View style={styles.settingSection}>
            <Text style={styles.settingLabel}>Volume</Text>
            <View style={styles.volumeContainer}>
              <Ionicons name="volume-low" size={20} color="#fff" />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={playbackState.volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor="#E50914"
                maximumTrackTintColor="#333"
              />
              <Ionicons name="volume-high" size={20} color="#fff" />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.settingSection}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowQualityMenu(true)}
            >
              <Ionicons name="settings" size={20} color="#fff" />
              <Text style={styles.settingButtonText}>Video Quality</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowSubtitleMenu(true)}
            >
              <Ionicons name="chatbox" size={20} color="#fff" />
              <Text style={styles.settingButtonText}>Subtitles</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      
      <TouchableOpacity 
        style={styles.videoContainer}
        onPress={handleVideoTap}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={source}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onFullscreenUpdate={onFullscreenUpdate}
          useNativeControls={false}
        />
        
        {/* Buffering Indicator */}
        {playbackState.isBuffering && (
          <View style={styles.bufferingContainer}>
            <Text style={styles.bufferingText}>Loading...</Text>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsOverlay}
            pointerEvents="box-none"
          >
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity onPress={onClose} style={styles.controlButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
                {episodeNumber && (
                  <Text style={styles.episodeInfo}>
                    S{seasonNumber}E{episodeNumber}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                onPress={() => setShowSettings(true)} 
                style={styles.controlButton}
              >
                <Ionicons name="settings" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              {onPrevious && (
                <TouchableOpacity onPress={onPrevious} style={styles.controlButton}>
                  <Ionicons name="play-skip-back" size={32} color="#fff" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={() => skip(-10)} style={styles.controlButton}>
                <Ionicons name="play-back" size={32} color="#fff" />
                <Text style={styles.skipText}>10</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                <Ionicons 
                  name={playbackState.isPlaying ? "pause" : "play"} 
                  size={48} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => skip(10)} style={styles.controlButton}>
                <Ionicons name="play-forward" size={32} color="#fff" />
                <Text style={styles.skipText}>10</Text>
              </TouchableOpacity>
              
              {onNext && (
                <TouchableOpacity onPress={onNext} style={styles.controlButton}>
                  <Ionicons name="play-skip-forward" size={32} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(playbackState.position)}
                </Text>
                
                <Slider
                  style={styles.progressSlider}
                  minimumValue={0}
                  maximumValue={1}
                  value={playbackState.duration > 0 ? playbackState.position / playbackState.duration : 0}
                  onValueChange={handleSeek}
                  minimumTrackTintColor="#E50914"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                />
                
                <Text style={styles.timeText}>
                  {formatTime(playbackState.duration)}
                </Text>
              </View>
              
              <View style={styles.bottomRightControls}>
                <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                  <Ionicons 
                    name={playbackState.isMuted ? "volume-mute" : "volume-high"} 
                    size={20} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
                  <Ionicons name="expand" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {renderQualityMenu()}
      {renderSubtitleMenu()}
      {renderSettingsMenu()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bufferingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bufferingText: {
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
  episodeInfo: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  bottomRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    padding: 8,
    position: 'relative',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229,9,20,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  progressSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
  },
  settingsContainer: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedMenuItem: {
    backgroundColor: 'rgba(229,9,20,0.2)',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedMenuItemText: {
    color: '#E50914',
    fontWeight: '600',
  },
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  speedButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  selectedSpeedButton: {
    backgroundColor: '#E50914',
  },
  speedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSpeedButtonText: {
    color: '#fff',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  settingButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
});
