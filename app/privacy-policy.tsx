
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.text}>
            Welcome to RK SWOT. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our app and tell you about your privacy rights and how the law protects you.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.text}>
            We collect minimal data necessary to provide our services:
          </Text>
          <Text style={styles.bulletPoint}>• Your viewing preferences and watchlist</Text>
          <Text style={styles.bulletPoint}>• Ratings and reviews you provide</Text>
          <Text style={styles.bulletPoint}>• Search history within the app</Text>
          <Text style={styles.bulletPoint}>• Device information for app optimization</Text>
          <Text style={styles.bulletPoint}>• Usage analytics to improve our service</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.text}>
            Your data is used solely to enhance your experience:
          </Text>
          <Text style={styles.bulletPoint}>• Provide personalized recommendations</Text>
          <Text style={styles.bulletPoint}>• Save your favorites and watchlist</Text>
          <Text style={styles.bulletPoint}>• Improve app functionality</Text>
          <Text style={styles.bulletPoint}>• Send relevant notifications (if enabled)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.text}>
            We implement industry-standard security measures to protect your personal information:
          </Text>
          <Text style={styles.bulletPoint}>• Encrypted data transmission</Text>
          <Text style={styles.bulletPoint}>• Secure server storage</Text>
          <Text style={styles.bulletPoint}>• Regular security audits</Text>
          <Text style={styles.bulletPoint}>• Limited access to personal data</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.text}>
            We integrate with trusted third-party services to provide you with the best experience:
          </Text>
          <Text style={styles.bulletPoint}>• TMDb API for movie and TV show data</Text>
          <Text style={styles.bulletPoint}>• Analytics services for app improvement</Text>
          <Text style={styles.bulletPoint}>• Cloud storage for data synchronization</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.text}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access your personal data</Text>
          <Text style={styles.bulletPoint}>• Correct inaccurate data</Text>
          <Text style={styles.bulletPoint}>• Delete your data</Text>
          <Text style={styles.bulletPoint}>• Withdraw consent</Text>
          <Text style={styles.bulletPoint}>• Data portability</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.text}>
            For privacy concerns or questions about this policy, contact us at:
          </Text>
          <Text style={styles.contactInfo}>📧 privacy@rkswot.com</Text>
          <Text style={styles.contactInfo}>🌐 www.rkswot.com/privacy</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This privacy policy may be updated from time to time. We will notify you of any significant changes.
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
    paddingTop: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 16,
    color: '#E50914',
    marginTop: 8,
  },
  footer: {
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
