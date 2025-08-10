
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
      <Text style={styles.title}>Native File Download Examples</Text>
      <Text style={styles.subtitle}>Using react-native-fs for native downloads</Text>
      
      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example 1: CSPAN Ukrainian Presidents Video</Text>
        <DirectFileDownloader
          downloadUrl="https://archive.org/download/CSPAN2_20231114_080600_Ukrainian_Presidents_Chief_of_Staff_on_War_with_Russia/CSPAN2_20231114_080600_Ukrainian_Presidents_Chief_of_Staff_on_War_with_Russia.mp4?download=1"
          fileName="Ukrainian_Presidents_Chief_of_Staff_on_War_with_Russia.mp4"
          onDownloadComplete={handleDownloadComplete}
          onDownloadError={handleDownloadError}
        />
      </View>

      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example 2: Movie Download</Text>
        <DirectFileDownloader
          downloadUrl="https://ia600100.us.archive.org/4/items/DrawnTogetherComplete/s04%2FThe%20Drawn%20Together%20Movie%20The%20Movie!%20(2010).ia.mp4?download=1"
          fileName="Drawn_Together_Movie_2010.mp4"
          onDownloadComplete={handleDownloadComplete}
          onDownloadError={handleDownloadError}
        />
      </View>

      <View style={styles.noteSection}>
        <Text style={styles.noteTitle}>📱 Platform Features:</Text>
        <Text style={styles.noteText}>• 🌐 Web: Browser-based downloads to default folder</Text>
        <Text style={styles.noteText}>• 📱 Mobile: Native downloads to Downloads/Documents folder</Text>
        <Text style={styles.noteText}>• 📊 Real-time progress tracking (mobile only)</Text>
        <Text style={styles.noteText}>• 🔄 Background download support (mobile only)</Text>
        <Text style={styles.noteText}>• 🔒 Automatic permission handling (mobile only)</Text>
        <Text style={styles.noteText}>• ⚡ File conflict resolution (mobile only)</Text>
        <Text style={styles.noteText}>• 💾 Storage space checking (mobile only)</Text>
        <Text style={styles.noteText}>• 📁 Supports large files (2GB+)</Text>
        <Text style={styles.noteText}>• ❌ Cancel download functionality (mobile only)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  exampleSection: {
    marginBottom: 30,
  },
  exampleTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    marginTop: 20,
  },
  noteTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
