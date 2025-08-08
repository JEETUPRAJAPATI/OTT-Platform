import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userService } from '../services/userService';

// Define the API base URL and keys
const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMDQwNWI5ZjEzODNlMTE4ZjljZmE4NmQ3Yjc0ZTJiOSIsIm5iZiI6MTc1NDU1NTAwNy4xNjQsInN1YiI6IjY4OTQ2MjdmMzQ4MDE5NWFhNDY2ZTZmNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gH2CFYya3S8QwYBUFhuEKcP4JWoMPnAeaRPDAE03Rik';
const ACCOUNT_ID = '22206352';

export function Footer() {
  const router = useRouter();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleSocialPress = (url: string) => {
    Linking.openURL(url);
  };

  const handleFavorites = async () => {
    router.push('/favorites');
  };

  const handleWatchlist = async () => {
    router.push('/watchlist');
  };

  const handleRatings = () => {
    router.push('/ratings');
  };

  const handleReviews = () => {
    router.push('/reviews');
  };

  const handleAbout = () => {
    Alert.alert(
      'About RKSWOT',
      'RKSWOT is your ultimate OTT platform for movies and TV shows. Discover, watch, and enjoy content from around the world.\n\nVersion: 1.0.0\nDeveloped by RKSWOT Team',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'We respect your privacy and are committed to protecting your personal data. All user preferences and viewing history are stored locally on your device.\n\nWe do not collect or share personal information with third parties.',
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
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
          <Text style={styles.modalTitle}>Settings</Text>
          <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.settingItem} onPress={handleFavorites}>
            <Ionicons name="heart-outline" size={20} color="#E50914" />
            <Text style={styles.settingText}>My Favorites</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleWatchlist}>
            <Ionicons name="bookmark-outline" size={20} color="#4ECDC4" />
            <Text style={styles.settingText}>My Watchlist</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleRatings}>
            <Ionicons name="star-outline" size={20} color="#FFD700" />
            <Text style={styles.settingText}>My Ratings</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleReviews}>
            <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
            <Text style={styles.settingText}>My Reviews</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.settingText}>About</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-outline" size={20} color="#34C759" />
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
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
            <TouchableOpacity style={styles.quickAccessButton} onPress={handleSettings}>
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
              <Ionicons name="logo-github" size={24} color="#333" />
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
            Your ultimate OTT platform for movies and TV shows
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={handleAbout}>
            <Text style={styles.linkText}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPolicy}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024 RKSWOT. All rights reserved.
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
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
  },
  description: {
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  linkButton: {
    marginTop: 5,
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
  },
  footerText: {
    color: '#888',
    fontSize: 12,
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 10,
    gap: 15,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
});