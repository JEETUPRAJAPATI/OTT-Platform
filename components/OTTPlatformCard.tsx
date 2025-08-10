
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

  // Platform-specific colors for better visual appeal
  const getPlatformColors = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('netflix')) return ['#E50914', '#8B0000'];
    if (lowerName.includes('disney')) return ['#113CCF', '#0066CC'];
    if (lowerName.includes('amazon') || lowerName.includes('prime')) return ['#00A8E1', '#0073AA'];
    if (lowerName.includes('hulu')) return ['#1CE783', '#00B359'];
    if (lowerName.includes('hbo')) return ['#8A2BE2', '#6A1B9A'];
    if (lowerName.includes('apple')) return ['#000000', '#333333'];
    if (lowerName.includes('paramount')) return ['#0066CC', '#004499'];
    if (lowerName.includes('peacock')) return ['#FFD700', '#FFA500'];
    if (lowerName.includes('crunchyroll')) return ['#FF6600', '#CC5200'];
    if (lowerName.includes('youtube')) return ['#FF0000', '#CC0000'];
    return ['#1a1a1a', '#0d0d0d']; // Default dark gradient
  };

  const [primaryColor, secondaryColor] = getPlatformColors(provider.provider_name);

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={() => onPress(provider)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[primaryColor, secondaryColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: logoUrl }} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Shine effect overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shineOverlay}
        />
      </LinearGradient>
      
      <View style={styles.nameContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {provider.provider_name}
        </Text>
      </View>
      
      {/* Premium badge for popular platforms */}
      {(provider.display_priority <= 5) && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>✨</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: 14,
    alignItems: 'center',
  },
  gradientContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  logoContainer: {
    width: '75%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logo: {
    width: '90%',
    height: '90%',
    borderRadius: 8,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  nameContainer: {
    marginTop: 10,
    width: CARD_WIDTH,
    paddingHorizontal: 4,
  },
  name: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  premiumText: {
    fontSize: 10,
    lineHeight: 12,
  },
});
