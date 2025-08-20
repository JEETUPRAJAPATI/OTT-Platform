import React from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShareService } from '../services/shareService';

interface ShareButtonProps {
  content: any;
  type: 'movie' | 'tv' | 'person';
  size?: number;
  color?: string;
  style?: any;
  onPress?: () => void;
}

export function ShareButton({ 
  content, 
  type, 
  size = 24, 
  color = '#fff',
  style,
  onPress 
}: ShareButtonProps) {
  const handlePress = async (e?: any) => {
    if (e) {
      e.stopPropagation();
    }

    console.log('ShareButton pressed for:', content?.title || content?.name);

    if (onPress) {
      onPress();
      return;
    }

    if (!content) {
      Alert.alert('Error', 'No content available to share');
      return;
    }

    try {
      const shareContent = ShareService.generateTMDbShareContent(content, type);
      console.log('ShareButton generated content:', shareContent);
      ShareService.showShareOptions(shareContent);
    } catch (error) {
      console.error('ShareButton error:', error);
      Alert.alert('Error', 'Could not share content');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.shareButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="share-outline" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});