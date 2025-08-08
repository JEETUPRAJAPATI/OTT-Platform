
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FooterProps {
  onFavoritePress?: () => void;
  onWatchlistPress?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onFavoritePress,
  onWatchlistPress
}) => {
  const router = useRouter();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleSettingsPress = () => {
    setShowSettingsModal(true);
  };

  const handleAbout = () => {
    Alert.alert(
      'About RKSWOT',
      'RKSWOT is a comprehensive OTT platform providing access to movies, TV shows, and more. Built with React Native and powered by TMDb API.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'We respect your privacy. Your viewing data is stored locally on your device and is not shared with third parties.',
      [{ text: 'OK' }]
    );
  };

  const handleRating = () => {
    Alert.alert(
      'Rate Our App',
      'Thank you for using RKSWOT! Please rate us on the app store.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => console.log('Opening rating page') }
      ]
    );
  };

  const handleReview = () => {
    Alert.alert(
      'Write a Review',
      'Share your experience with RKSWOT. Your feedback helps us improve!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Write Review', onPress: () => console.log('Opening review page') }
      ]
    );
  };

  const SettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsOptions}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowSettingsModal(false);
                onFavoritePress?.();
              }}
            >
              <Ionicons name="heart" size={20} color="#E50914" />
              <Text style={styles.settingText}>My Favorites</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowSettingsModal(false);
                onWatchlistPress?.();
              }}
            >
              <Ionicons name="bookmark" size={20} color="#fff" />
              <Text style={styles.settingText}>My Watchlist</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowSettingsModal(false);
                handleAbout();
              }}
            >
              <Ionicons name="information-circle" size={20} color="#fff" />
              <Text style={styles.settingText}>About</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowSettingsModal(false);
                handlePrivacyPolicy();
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.settingText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowSettingsModal(false);
                handleRating();
              }}
            >
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.settingText}>Rate App</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => {
                setShowSettingsModal(false);
                handleReview();
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={styles.settingText}>Write Review</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/(tabs)/')}
        >
          <Ionicons name="home" size={24} color="#999" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/(tabs)/discover')}
        >
          <Ionicons name="compass" size={24} color="#999" />
          <Text style={styles.footerText}>Discover</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/(tabs)/downloads')}
        >
          <Ionicons name="download" size={24} color="#999" />
          <Text style={styles.footerText}>Downloads</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="person" size={24} color="#999" />
          <Text style={styles.footerText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings" size={24} color="#E50914" />
          <Text style={[styles.footerText, { color: '#E50914' }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <SettingsModal />
    </>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsOptions: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
});
