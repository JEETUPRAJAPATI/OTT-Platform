
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
      case 'streaming': return '#FF6B35';
      default: return '#666';
    }
  };

  const getPlatformTypeIcon = (isLegitimate: boolean) => {
    return isLegitimate ? 'shield-checkmark' : 'globe-outline';
  };

  const getPlatformTypeColor = (isLegitimate: boolean) => {
    return isLegitimate ? '#4CAF50' : '#FF6B35';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { borderColor: getCategoryColor(platform.category) }]}>
            <Text style={styles.logo}>{platform.logo}</Text>
          </View>
          <View style={styles.platformInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{platform.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getPlatformTypeColor(platform.isLegitimate) + '20', borderColor: getPlatformTypeColor(platform.isLegitimate) + '40' }]}>
                <Ionicons 
                  name={getPlatformTypeIcon(platform.isLegitimate)} 
                  size={12} 
                  color={getPlatformTypeColor(platform.isLegitimate)} 
                />
              </View>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {platform.description}
            </Text>
            {platform.baseUrl && (
              <Text style={styles.platformUrl} numberOfLines={1}>
                {platform.baseUrl.replace('https://', '').replace('http://', '').replace('www.', '')}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actionSection}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.leftFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(platform.category) + '20', borderColor: getCategoryColor(platform.category) + '40' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(platform.category) }]}>
              {platform.category}
            </Text>
          </View>
        </View>
        <View style={styles.rightFooter}>
          {platform.features.slice(0, 2).map((feature, index) => (
            <View key={index} style={styles.featureBadge}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {!platform.isLegitimate && (
        <View style={styles.externalNotice}>
          <Ionicons name="information-circle" size={14} color="#FF6B35" />
          <Text style={styles.externalNoticeText}>External platform - opens in browser</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  logo: {
    fontSize: 28,
  },
  platformInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  platformUrl: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  actionSection: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftFooter: {
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rightFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  featureBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  externalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  externalNoticeText: {
    color: '#FF6B35',
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});
