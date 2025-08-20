
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Conditional import for file download service
let fileDownloadService: any = null;

if (Platform.OS !== 'web') {
  try {
    const fileDownloadModule = require('@/services/fileDownloadService');
    fileDownloadService = fileDownloadModule.fileDownloadService || fileDownloadModule.default;
  } catch (error) {
    console.warn('File download service not available:', error);
  }
}

interface DownloadSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export function DownloadSettings({ visible, onClose }: DownloadSettingsProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [customPath, setCustomPath] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && fileDownloadService) {
      loadCurrentPath();
    }
  }, [visible]);

  const loadCurrentPath = async () => {
    try {
      if (fileDownloadService) {
        const path = await fileDownloadService.getCurrentDownloadPath();
        setCurrentPath(path);
        setCustomPath(path);
      }
    } catch (error) {
      console.error('Error loading current path:', error);
    }
  };

  const handleSetCustomPath = async () => {
    if (!customPath.trim()) {
      Alert.alert('Invalid Path', 'Please enter a valid download path.');
      return;
    }

    if (!fileDownloadService) {
      Alert.alert('Not Supported', 'Download path settings are only available on mobile devices.');
      return;
    }

    setLoading(true);
    try {
      const success = await fileDownloadService.setCustomDownloadPath(customPath.trim());
      
      if (success) {
        setCurrentPath(customPath.trim());
        Alert.alert(
          'Success',
          'Download path has been updated successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to set download path. Please check if the path is valid and accessible.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error setting custom path:', error);
      Alert.alert(
        'Error',
        'Failed to set download path. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    Alert.alert(
      'Reset to Default',
      'Are you sure you want to reset the download path to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (fileDownloadService) {
              setLoading(true);
              try {
                await fileDownloadService.resetToDefaultPath();
                await loadCurrentPath();
                Alert.alert('Success', 'Download path has been reset to default.');
              } catch (error) {
                console.error('Error resetting path:', error);
                Alert.alert('Error', 'Failed to reset download path.');
              } finally {
                setLoading(false);
              }
            }
          }
        }
      ]
    );
  };

  const getCommonPaths = () => {
    if (Platform.OS === 'android') {
      return [
        '/storage/emulated/0/Download',
        '/storage/emulated/0/Movies',
        '/storage/emulated/0/Documents/Movies',
        '/sdcard/Download',
        '/sdcard/Movies'
      ];
    } else {
      return [
        '/var/mobile/Containers/Data/Application/Documents/Downloads',
        '/var/mobile/Containers/Data/Application/Documents/Movies'
      ];
    }
  };

  if (!fileDownloadService || Platform.OS === 'web') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Download Settings</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.notSupportedContainer}>
              <Ionicons name="information-circle" size={48} color="#FFA500" />
              <Text style={styles.notSupportedTitle}>Not Available</Text>
              <Text style={styles.notSupportedText}>
                Download path settings are only available on mobile devices.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.9)', 'rgba(20, 20, 20, 0.95)']}
          style={styles.modalContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Download Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Path Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Download Path</Text>
              <View style={styles.currentPathContainer}>
                <Ionicons name="folder" size={20} color="#00D4AA" />
                <Text style={styles.currentPathText} numberOfLines={2}>
                  {currentPath || 'Loading...'}
                </Text>
              </View>
            </View>

            {/* Custom Path Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Set Custom Path</Text>
              <Text style={styles.sectionDescription}>
                Enter a custom path where you want to save downloaded movies.
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.pathInput}
                  value={customPath}
                  onChangeText={setCustomPath}
                  placeholder="Enter custom download path..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleSetCustomPath}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#00D4AA', '#007A88']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="save" size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>
                      {loading ? 'Setting...' : 'Set Path'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleResetToDefault}
                  disabled={loading}
                >
                  <View style={styles.secondaryButtonContent}>
                    <Ionicons name="refresh" size={18} color="#FF9800" />
                    <Text style={styles.secondaryButtonText}>Reset to Default</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Common Paths Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Common Paths</Text>
              <Text style={styles.sectionDescription}>
                Tap on a path to use it as your download location.
              </Text>
              
              {getCommonPaths().map((path, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.commonPathItem}
                  onPress={() => setCustomPath(path)}
                >
                  <Ionicons name="folder-outline" size={16} color="#888" />
                  <Text style={styles.commonPathText}>{path}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#555" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Tips Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tips</Text>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle" size={16} color="#4CAF50" />
                <Text style={styles.tipText}>
                  Make sure the path exists and is writable.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="warning" size={16} color="#FFA500" />
                <Text style={styles.tipText}>
                  Downloads folder is the recommended location for compatibility.
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="shield-checkmark" size={16} color="#2196F3" />
                <Text style={styles.tipText}>
                  Some paths may require additional permissions.
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  currentPathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  currentPathText: {
    color: '#00D4AA',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'monospace',
  },
  inputContainer: {
    marginBottom: 16,
  },
  pathInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    fontFamily: 'monospace',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  primaryButton: {
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  commonPathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  commonPathText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'monospace',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  notSupportedContainer: {
    alignItems: 'center',
    padding: 40,
  },
  notSupportedTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  notSupportedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
