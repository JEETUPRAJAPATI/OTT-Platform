
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.25;

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface OTTPlatformCardProps {
  provider: WatchProvider;
  onPress: (provider: WatchProvider) => void;
  style?: any;
}

export function OTTPlatformCard({ provider, onPress, style }: OTTPlatformCardProps) {
  const logoUrl = `https://image.tmdb.org/t/p/w200${provider.logo_path}`;

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={() => onPress(provider)}
      activeOpacity={0.8}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: logoUrl }} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {provider.provider_name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 16,
    alignItems: 'center',
  },
  logoContainer: {
    width: CARD_WIDTH * 0.8,
    height: CARD_WIDTH * 0.8,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: '70%',
    height: '70%',
  },
  name: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
});
