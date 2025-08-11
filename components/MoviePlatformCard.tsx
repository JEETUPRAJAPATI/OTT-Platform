
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoviePlatform } from '@/data/legitimateMoviePlatforms';

interface MoviePlatformCardProps {
  platform: MoviePlatform;
  onPress: (platform: MoviePlatform) => void;
}

export function MoviePlatformCard({ platform, onPress }: MoviePlatformCardProps) {
  const handlePress = () => {
    onPress(platform);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'archive': return '#4CAF50';
      case 'educational': return '#2196F3';
      case 'indie': return '#FF9800';
      case 'classic': return '#9C27B0';
      default: return '#666';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>{platform.logo}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{platform.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {platform.description}
          </Text>
          <Text style={styles.platformUrl} numberOfLines={1}>
            {platform.baseUrl}
          </Text>
        </View>
        <View style={styles.rightSection}>
          {platform.isLegitimate ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            </View>
          ) : (
            <View style={styles.externalBadge}>
              <Ionicons name="link" size={16} color="#FF9800" />
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(platform.category) }]}>
          <Text style={styles.categoryText}>{platform.category}</Text>
        </View>
        <View style={styles.features}>
          {platform.features.slice(0, 2).map((feature, index) => (
            <View key={index} style={styles.featureBadge}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logo: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  rightSection: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  verifiedBadge: {
    marginRight: 8,
  },
  externalBadge: {
    marginRight: 8,
  },
  platformUrl: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  features: {
    flexDirection: 'row',
    gap: 6,
  },
  featureBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
});
