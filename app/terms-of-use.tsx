
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfUseScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Use</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using RK SWOT, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Use govern your use of the RK SWOT application and services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Use License</Text>
          <Text style={styles.text}>
            Permission is granted to use RK SWOT for personal, non-commercial transitory viewing only. This includes the license to:
          </Text>
          <Text style={styles.bulletPoint}>• Browse and discover movie and TV content</Text>
          <Text style={styles.bulletPoint}>• Create personal favorites and watchlists</Text>
          <Text style={styles.bulletPoint}>• Write reviews and ratings</Text>
          <Text style={styles.bulletPoint}>• Access content information and recommendations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restrictions</Text>
          <Text style={styles.text}>
            You are restricted from all of the following:
          </Text>
          <Text style={styles.bulletPoint}>• Modifying or copying the app materials</Text>
          <Text style={styles.bulletPoint}>• Using the materials for commercial purposes</Text>
          <Text style={styles.bulletPoint}>• Attempting to reverse engineer the software</Text>
          <Text style={styles.bulletPoint}>• Removing copyright or proprietary notations</Text>
          <Text style={styles.bulletPoint}>• Uploading or sharing inappropriate content</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Content</Text>
          <Text style={styles.text}>
            When you post reviews, ratings, or other content to RK SWOT:
          </Text>
          <Text style={styles.bulletPoint}>• You retain ownership of your content</Text>
          <Text style={styles.bulletPoint}>• You grant us license to display and distribute it</Text>
          <Text style={styles.bulletPoint}>• You ensure content is appropriate and lawful</Text>
          <Text style={styles.bulletPoint}>• We may remove content that violates guidelines</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer</Text>
          <Text style={styles.text}>
            The materials in RK SWOT are provided on an 'as is' basis. RK SWOT makes no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitations</Text>
          <Text style={styles.text}>
            In no event shall RK SWOT or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use RK SWOT, even if RK SWOT or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accuracy of Materials</Text>
          <Text style={styles.text}>
            The materials appearing in RK SWOT could include technical, typographical, or photographic errors. RK SWOT does not warrant that any of the materials on its app are accurate, complete, or current. RK SWOT may make changes to the materials contained in its app at any time without notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Governing Law</Text>
          <Text style={styles.text}>
            These terms and conditions are governed by and construed in accordance with applicable laws, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.text}>
            If you have any questions about these Terms of Use, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>📧 legal@rkswot.com</Text>
          <Text style={styles.contactInfo}>🌐 www.rkswot.com/terms</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These terms may be updated from time to time. Continued use of the app constitutes acceptance of updated terms.
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
