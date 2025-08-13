
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutUsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <Text style={styles.appName}>RK SWOT</Text>
          <Text style={styles.tagline}>Your Ultimate Entertainment Hub</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About RK SWOT</Text>
          <Text style={styles.text}>
            RK SWOT is your ultimate movie and TV show streaming companion. Discover, watch, and organize your favorite content all in one place. Our app brings together the best of entertainment with powerful features designed for movie and TV enthusiasts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>🎬 Extensive movie and TV show database</Text>
            <Text style={styles.feature}>❤️ Personal favorites and watchlist</Text>
            <Text style={styles.feature}>⭐ Ratings and reviews system</Text>
            <Text style={styles.feature}>🔍 Advanced search across all platforms</Text>
            <Text style={styles.feature}>📱 Cross-platform availability</Text>
            <Text style={styles.feature}>🎯 Personalized recommendations</Text>
            <Text style={styles.feature}>📥 Download management</Text>
            <Text style={styles.feature}>🎭 Actor and crew information</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            To provide movie and TV enthusiasts with a comprehensive, user-friendly platform that makes discovering, organizing, and enjoying entertainment content effortless and enjoyable.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version Information</Text>
          <Text style={styles.text}>Version: 1.0.0</Text>
          <Text style={styles.text}>Build: 2025.01</Text>
          <Text style={styles.text}>Platform: React Native</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            Have questions or feedback? We'd love to hear from you!
          </Text>
          <Text style={styles.contactInfo}>📧 info@rkswot.com</Text>
          <Text style={styles.contactInfo}>🌐 www.rkswot.com</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 RK SWOT. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E50914',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  featureList: {
    marginTop: 8,
  },
  feature: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 28,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 16,
    color: '#E50914',
    marginTop: 8,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
