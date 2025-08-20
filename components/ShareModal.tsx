
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShareService, ShareContent } from '@/services/shareService';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  content: ShareContent;
}

const { height } = Dimensions.get('window');

export function ShareModal({ visible, onClose, content }: ShareModalProps) {
  const handleShareOption = async (option: string) => {
    try {
      switch (option) {
        case 'whatsapp':
          await ShareService.shareToWhatsApp(content);
          break;
        case 'telegram':
          await ShareService.shareToTelegram(content);
          break;
        case 'more':
          await ShareService.shareContent(content);
          break;
        case 'copy':
          await ShareService.copyToClipboard(content.message);
          Alert.alert('Success', 'Content copied to clipboard!');
          break;
      }
      onClose();
    } catch (error) {
      console.error('Share option failed:', error);
      Alert.alert('Error', 'Failed to share content. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.backdrop} />
          
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1a1a1a', '#2a2a2a']}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <Text style={styles.title}>Share Content</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle} numberOfLines={2}>
                {content.title}
              </Text>
            </LinearGradient>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleShareOption('whatsapp')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>WhatsApp</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleShareOption('telegram')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#0088cc' }]}>
                  <Ionicons name="paper-plane" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>Telegram</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleShareOption('more')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#007AFF' }]}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>More Options</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleShareOption('copy')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#FF9500' }]}>
                  <Ionicons name="copy-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>Copy to Clipboard</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    minHeight: 300,
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  optionsContainer: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  cancelButton: {
    margin: 20,
    marginTop: 10,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
