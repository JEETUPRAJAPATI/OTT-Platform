
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image } from 'react-native';
import { Platform } from '../data/ottPlatforms';
import { ThemedText } from './ThemedText';

interface PlatformLogoProps {
  platform: Platform;
  onPress: () => void;
}

export function PlatformLogo({ platform, onPress }: PlatformLogoProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={[styles.logoContainer, { backgroundColor: platform.logo ? '#fff' : platform.color }]}>
        {platform.logo ? (
          <Image 
            source={{ uri: platform.logo }} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        ) : (
          <ThemedText style={styles.logoText}>
            {platform.name.charAt(0)}
          </ThemedText>
        )}
      </View>
      <ThemedText style={styles.platformName} numberOfLines={2}>
        {platform.name}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 16,
    width: 100,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  platformName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
