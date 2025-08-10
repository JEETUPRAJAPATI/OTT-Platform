
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.22;

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
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoContainer}
      >
        <Image 
          source={{ uri: logoUrl }} 
          style={styles.logo}
          resizeMode="contain"
        />
      </LinearGradient>
      <Text style={styles.name} numberOfLines={1}>
        {provider.provider_name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 15,
    alignItems: 'center',
    marginBottom: 5,
  },
  logoContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: CARD_WIDTH / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  logo: {
    width: '65%',
    height: '65%',
    borderRadius: (CARD_WIDTH * 0.65) / 2,
  },
  name: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
