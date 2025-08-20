
import React from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { DirectFileDownloader } from './DirectFileDownloader';

export function ExampleUsage() {
  const handleDownloadComplete = (filePath: string) => {
    console.log('File downloaded to:', filePath);
    Alert.alert(
      'Download Complete',
      `File successfully downloaded to:\n${filePath}`,
      [{ text: 'OK' }]
    );
  };

  const handleDownloadError = (error: string) => {
    console.error('Download failed:', error);
    Alert.alert(
      'Download Error',
      `Download failed: ${error}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Native Large File Downloader</Text>
      <Text style={styles.subtitle}>Downloads files over 2GB with full progress tracking</Text>
      
      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example 1: Large Movie File (Archive.org)</Text>
        <DirectFileDownloader
          downloadUrl="https://archive.org/download/Big_Buck_Bunny_4K/Big_Buck_Bunny_4K.webm?download=1"
          fileName="Big_Buck_Bunny_4K.webm"
          onDownloadComplete={handleDownloadComplete}
          onDownloadError={handleDownloadError}
        />
      </View>

      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example 2: HD Movie Download</Text>
        <DirectFileDownloader
          downloadUrl="https://ia800100.us.archive.org/4/items/DrawnTogetherComplete/s04%2FThe%20Drawn%20Together%20Movie%20The%20Movie!%20(2010).ia.mp4?download=1"
          fileName="Drawn_Together_Movie_2010.mp4"
          onDownloadComplete={handleDownloadComplete}
          onDownloadError={handleDownloadError}
        />
      </View>

      <View style={styles.noteSection}>
        <Text style={styles.noteTitle}>📱 Native Features:</Text>
        <Text style={styles.noteText}>• 🔄 Automatic HTTPS redirect resolution</Text>
        <Text style={styles.noteText}>• 📊 Real-time progress tracking with speed & ETA</Text>
        <Text style={styles.noteText}>• 🗂️ Downloads to device Downloads folder (Android)</Text>
        <Text style={styles.noteText}>• 📁 Accessible via Files app (iOS Documents/Downloads)</Text>
        <Text style={styles.noteText}>• 💾 Handles files over 2GB without memory issues</Text>
        <Text style={styles.noteText}>• 🔄 Background download support</Text>
        <Text style={styles.noteText}>• 🔒 Automatic permission handling</Text>
        <Text style={styles.noteText}>• ⚡ File conflict resolution (overwrite/rename/skip)</Text>
        <Text style={styles.noteText}>• 💽 Storage space checking before download</Text>
        <Text style={styles.noteText}>• ❌ Cancel download functionality</Text>
        <Text style={styles.noteText}>• 📲 Only works on native Android/iOS devices</Text>
      </View>

      <View style={styles.warningSection}>
        <Text style={styles.warningTitle}>⚠️ Requirements:</Text>
        <Text style={styles.warningText}>• Must run on physical Android/iOS device</Text>
        <Text style={styles.warningText}>• Does NOT work in web browsers or React Native Web</Text>
        <Text style={styles.warningText}>• Requires react-native-fs package</Text>
        <Text style={styles.warningText}>• Storage permissions handled automatically</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  exampleSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 12,
  },
  noteSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 12,
  },
  noteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  warningSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 12,
  },
  warningText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
});
