
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { DirectFileDownloader } from './DirectFileDownloader';

export function ExampleUsage() {
  const handleDownloadComplete = (filePath: string) => {
    console.log('File downloaded to:', filePath);
  };

  const handleDownloadError = (error: string) => {
    console.error('Download failed:', error);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Direct File Download Example</Text>
      
      <DirectFileDownloader
        downloadUrl="https://ia600100.us.archive.org/4/items/DrawnTogetherComplete/s04%2FThe%20Drawn%20Together%20Movie%20The%20Movie!%20(2010).ia.mp4?download=1"
        fileName="Drawn_Together_Movie"
        onDownloadComplete={handleDownloadComplete}
        onDownloadError={handleDownloadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});
