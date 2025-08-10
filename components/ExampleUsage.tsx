
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
        <Text style={styles.exampleTitle}>Example 1: Movie Download</Text>
        <DirectFileDownloader
          downloadUrl="https://ia600100.us.archive.org/4/items/DrawnTogetherComplete/s04%2FThe%20Drawn%20Together%20Movie%20The%20Movie!%20(2010).ia.mp4?download=1"
          fileName="Drawn_Together_Movie_2010.mp4"
          onDownloadComplete={handleDownloadComplete}
          onDownloadError={handleDownloadError}
        />
      </View>

      <View style={styles.exampleSection}>
        <Text style={styles.exampleTitle}>Example 2: Sample Video</Text>
        <DirectFileDownloader
          downloadUrl="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
          fileName="Sample_Video_720p.mp4"
          onDownloadComplete={handleDownloadComplete}
          onDownloadError={handleDownloadError}
        />
      </View>

      <View style={styles.noteSection}>
        <Text style={styles.noteTitle}>📱 Native Features:</Text>
        <Text style={styles.noteText}>• Downloads to device Downloads folder (Android) or Documents folder (iOS)</Text>
        <Text style={styles.noteText}>• Real-time progress tracking with speed calculation</Text>
        <Text style={styles.noteText}>• Background download support</Text>
        <Text style={styles.noteText}>• Automatic permission handling</Text>
        <Text style={styles.noteText}>• File conflict resolution (overwrite/rename/skip)</Text>
        <Text style={styles.noteText}>• Storage space checking before download</Text>
        <Text style={styles.noteText}>• Supports large files (2GB+)</Text>
        <Text style={styles.noteText}>• Cancel download functionality</Text>
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
