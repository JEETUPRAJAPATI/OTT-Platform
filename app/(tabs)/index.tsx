
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { PlatformLogo } from '@/components/PlatformLogo';
import { platforms } from '@/data/ottPlatforms';

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  const handlePlatformPress = (platformId: string) => {
    router.push(`/platform/${platformId}`);
  };

  if (showSplash) {
    return <SplashScreen onAnimationEnd={() => setShowSplash(false)} />;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            RK SWOT
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Explore content from your favorite OTT platforms
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.platformsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Choose Platform
          </ThemedText>
          <FlatList
            data={platforms}
            renderItem={({ item }) => (
              <PlatformLogo
                platform={item}
                onPress={() => handlePlatformPress(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.platformGrid}
            scrollEnabled={false}
          />
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  platformsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  platformGrid: {
    justifyContent: 'center',
  },
});
