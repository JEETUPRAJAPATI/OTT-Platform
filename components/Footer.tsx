
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function Footer() {
  const router = useRouter();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleSocialPress = (url: string) => {
    Linking.openURL(url);
  };

  const handleFavorites = () => {
    setShowSettingsModal(false);
    router.push('/favorites');
  };

  const handleWatchlist = () => {
    setShowSettingsModal(false);
    router.push('/watchlist');
  };

  const handleDownloads = () => {
    setShowSettingsModal(false);
    Alert.alert('Downloads', 'Downloads feature is available in the main navigation.');
  };

  const handleRatings = () => {
    setShowSettingsModal(false);
    router.push('/ratings');
  };

  const handleReviews = () => {
    setShowSettingsModal(false);
    router.push('/reviews');
  };

  const handleAbout = () => {
    setShowSettingsModal(false);
    Alert.alert(
      'About RKSWOT',
      'RKSWOT is your ultimate OTT platform for movies and TV shows. Discover, watch, and enjoy content from around the world.\n\nVersion: 2.0.0\nDeveloped by RKSWOT Team\n\nFeatures:\n• TMDb API Integration\n• Favorites & Watchlist\n• Advanced Search\n• High-Quality Streaming',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    setShowSettingsModal(false);
    Alert.alert(
      'Privacy Policy',
      'We respect your privacy and are committed to protecting your personal data.\n\nData Collection:\n• We only collect data necessary for app functionality\n• User preferences are stored securely\n• No personal data is shared with third parties\n\nTMDb Integration:\n• Movie/TV data provided by The Movie Database (TMDb)\n• User ratings and lists are managed through TMDb API\n\nContact: support@rkswot.com',
      [{ text: 'OK' }]
    );
  };

  const SettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Settings & More</Text>
          <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.sectionHeader}>My Library</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleFavorites}>
            <View style={styles.settingIcon}>
              <Ionicons name="heart" size={22} color="#E50914" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Favorites</Text>
              <Text style={styles.settingSubText}>Movies you love</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleWatchlist}>
            <View style={styles.settingIcon}>
              <Ionicons name="bookmark" size={22} color="#4ECDC4" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Watchlist</Text>
              <Text style={styles.settingSubText}>Movies to watch later</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleRatings}>
            <View style={styles.settingIcon}>
              <Ionicons name="star" size={22} color="#FFD700" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Ratings</Text>
              <Text style={styles.settingSubText}>Your movie ratings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleReviews}>
            <View style={styles.settingIcon}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#FF6B35" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Reviews</Text>
              <Text style={styles.settingSubText}>Your movie reviews</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />
          
          <Text style={styles.sectionHeader}>App Info</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle" size={22} color="#007AFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>About RKSWOT</Text>
              <Text style={styles.settingSubText}>App version & info</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#34C759" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Privacy Policy</Text>
              <Text style={styles.settingSubText}>How we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity style={styles.quickAccessButton} onPress={handleFavorites}>
              <Ionicons name="heart" size={20} color="#E50914" />
              <Text style={styles.quickAccessText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessButton} onPress={handleWatchlist}>
              <Ionicons name="bookmark" size={20} color="#4ECDC4" />
              <Text style={styles.quickAccessText}>Watchlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessButton} onPress={() => setShowSettingsModal(true)}>
              <Ionicons name="settings" size={20} color="#666" />
              <Text style={styles.quickAccessText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress('https://twitter.com/rkswot')}
            >
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress('https://github.com/rkswot')}
            >
              <Ionicons name="logo-github" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress('https://instagram.com/rkswot')}
            >
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RKSWOT</Text>
          <Text style={styles.description}>
            Your ultimate movie companion{'\n'}
            Powered by TMDb
          </Text>
          <View style={styles.linkContainer}>
            <TouchableOpacity style={styles.linkButton} onPress={handleAbout}>
              <Ionicons name="information-circle-outline" size={16} color="#4ECDC4" />
              <Text style={styles.linkText}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPolicy}>
              <Ionicons name="shield-outline" size={16} color="#4ECDC4" />
              <Text style={styles.linkText}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024 RKSWOT. All rights reserved.
        </Text>
        <Text style={styles.footerSubText}>
          Movie data provided by TMDb
        </Text>
      </View>

      <SettingsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    paddingTop: 40,
    paddingBottom: 20,
    marginTop: 40,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  section: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickAccessContainer: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    gap: 10,
  },
  quickAccessText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  socialButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
  },
  description: {
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  linkContainer: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  linkText: {
    color: '#4ECDC4',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
  footerSubText: {
    color: '#666',
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 15,
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubText: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
});
