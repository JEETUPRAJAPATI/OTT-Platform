
import { Platform, Alert, Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import React from 'react';

// Conditional import for react-native-share
let Share: any = null;
try {
  Share = require('react-native-share');
} catch (error) {
  console.log('react-native-share not available, using Expo sharing');
}

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
  type?: 'movie' | 'tv' | 'person';
}

export class ShareService {
  private static showModalCallback: ((content: ShareContent) => void) | null = null;

  static setModalCallback(callback: (content: ShareContent) => void) {
    this.showModalCallback = callback;
  }

  static async shareContent(content: ShareContent): Promise<boolean> {
    try {
      const shareOptions = {
        title: content.title,
        message: content.message,
        url: content.url || '',
      };

      if (Share && Platform.OS !== 'web') {
        // Use react-native-share for native platforms
        const result = await Share.open(shareOptions);
        return result.success || false;
      } else if (Sharing.isAvailableAsync) {
        // Fallback to Expo sharing
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(content.message, {
            dialogTitle: content.title,
          });
          return true;
        }
      }

      // Web fallback or when no sharing is available
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: content.title,
          text: content.message,
          url: content.url,
        });
        return true;
      }

      // Last resort: copy to clipboard
      await this.copyToClipboard(content.message);
      Alert.alert('Copied to Clipboard', 'Content has been copied to your clipboard');
      return true;

    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share content. Please try again.');
      return false;
    }
  }

  static async shareToWhatsApp(content: ShareContent): Promise<boolean> {
    try {
      const message = encodeURIComponent(content.message);
      const whatsappUrl = `whatsapp://send?text=${message}`;

      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        Alert.alert(
          'WhatsApp not found',
          'WhatsApp is not installed on your device. Would you like to share using other apps?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share via other apps', onPress: () => this.shareContent(content) }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      return this.shareContent(content);
    }
  }

  static async shareToTelegram(content: ShareContent): Promise<boolean> {
    try {
      const message = encodeURIComponent(content.message);
      const telegramUrl = `tg://msg?text=${message}`;

      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
        return true;
      } else {
        return this.shareContent(content);
      }
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
      return this.shareContent(content);
    }
  }

  static async shareToFacebook(content: ShareContent): Promise<boolean> {
    try {
      const shareOptions = {
        social: Share?.Social?.FACEBOOK,
        title: content.title,
        message: content.message,
        url: content.url,
      };

      if (Share && Share.shareSingle) {
        const result = await Share.shareSingle(shareOptions);
        return result.success || false;
      } else {
        return this.shareContent(content);
      }
    } catch (error) {
      console.error('Error sharing to Facebook:', error);
      return this.shareContent(content);
    }
  }

  static async shareToTwitter(content: ShareContent): Promise<boolean> {
    try {
      const shareOptions = {
        social: Share?.Social?.TWITTER,
        title: content.title,
        message: content.message,
        url: content.url,
      };

      if (Share && Share.shareSingle) {
        const result = await Share.shareSingle(shareOptions);
        return result.success || false;
      } else {
        return this.shareContent(content);
      }
    } catch (error) {
      console.error('Error sharing to Twitter:', error);
      return this.shareContent(content);
    }
  }

  static async shareToInstagram(content: ShareContent): Promise<boolean> {
    try {
      const shareOptions = {
        social: Share?.Social?.INSTAGRAM,
        title: content.title,
        message: content.message,
        url: content.url,
      };

      if (Share && Share.shareSingle) {
        const result = await Share.shareSingle(shareOptions);
        return result.success || false;
      } else {
        return this.shareContent(content);
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error);
      return this.shareContent(content);
    }
  }

  static async copyToClipboard(text: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } else {
        const { Clipboard } = await import('@react-native-clipboard/clipboard');
        Clipboard.setString(text);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  static generateTMDbShareContent(item: any, type: 'movie' | 'tv' | 'person'): ShareContent {
    const baseUrl = 'https://www.themoviedb.org';
    let title: string;
    let message: string;
    let url: string;

    switch (type) {
      case 'movie':
        title = item.title || item.original_title || 'Unknown Movie';
        url = `${baseUrl}/movie/${item.id}`;
        message = `🎬 Check out "${title}" on TMDb!\n\n⭐ Rating: ${item.vote_average?.toFixed(1) || 'N/A'}/10\n📅 Release: ${item.release_date || 'TBA'}\n\n${item.overview ? item.overview.substring(0, 150) + '...' : ''}\n\n🔗 ${url}\n\n#Movies #TMDb #Cinema`;
        break;

      case 'tv':
        title = item.name || item.original_name || 'Unknown TV Show';
        url = `${baseUrl}/tv/${item.id}`;
        message = `📺 Check out "${title}" on TMDb!\n\n⭐ Rating: ${item.vote_average?.toFixed(1) || 'N/A'}/10\n📅 First Air: ${item.first_air_date || 'TBA'}\n\n${item.overview ? item.overview.substring(0, 150) + '...' : ''}\n\n🔗 ${url}\n\n#TVShows #TMDb #Television`;
        break;

      case 'person':
        title = item.name || 'Unknown Person';
        url = `${baseUrl}/person/${item.id}`;
        message = `🌟 Check out ${title} on TMDb!\n\n🎭 Known for: ${item.known_for_department || 'Acting'}\n⭐ Popularity: ${item.popularity?.toFixed(0) || 'N/A'}\n\n🔗 ${url}\n\n#Celebrity #TMDb #Entertainment`;
        break;

      default:
        title = 'Content from TMDb';
        url = baseUrl;
        message = `Check out this amazing content on TMDb! 🎬\n\n🔗 ${url}\n\n#Movies #TMDb #Entertainment`;
    }

    return {
      title,
      message,
      url,
      type,
    };
  }

  static showShareOptions(content: ShareContent): void {
    console.log('ShareService.showShareOptions called with:', {
      title: content.title,
      type: content.type,
      hasUrl: !!content.url,
      platform: Platform.OS
    });
    
    try {
      // For web platform, try native sharing first if available
      if (Platform.OS === 'web') {
        console.log('Web platform detected, checking navigator.share...');
        
        if (typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function') {
          console.log('Native web sharing available, attempting to share...');
          navigator.share({
            title: content.title,
            text: content.message,
            url: content.url,
          }).then(() => {
            console.log('Web share successful');
          }).catch((error) => {
            console.log('Web share failed, falling back to Alert:', error);
            this.showAlertDialog(content);
          });
          return;
        } else {
          console.log('Native web sharing not available, showing alert dialog');
        }
      }
      
      // For all other cases, show alert dialog immediately
      console.log('Showing alert dialog for platform:', Platform.OS);
      this.showAlertDialog(content);
    } catch (error) {
      console.error('Error showing share options:', error);
      this.showAlertDialog(content);
    }
  }

  private static showAlertDialog(content: ShareContent): void {
    console.log('Showing alert dialog for:', content.title);
    
    // For web platform, create a custom modal-like experience
    if (Platform.OS === 'web') {
      // Immediate fallback to copy functionality on web
      this.copyToClipboard(content.message).then(() => {
        Alert.alert('Share Options', 'Content copied to clipboard!\n\nYou can now paste it in your favorite app.', [
          {
            text: 'OK',
            style: 'default'
          }
        ]);
      }).catch(() => {
        Alert.alert('Share Content', content.message, [
          {
            text: 'Close',
            style: 'cancel'
          }
        ]);
      });
      return;
    }

    // For mobile platforms, use custom modal if available
    if (this.showModalCallback) {
      this.showModalCallback(content);
      return;
    }

    // Fallback to Alert for mobile platforms
    Alert.alert(
      'Share Content',
      `Share "${content.title}"`,
      [
        {
          text: 'WhatsApp',
          onPress: async () => {
            console.log('WhatsApp share selected for:', content.title);
            try {
              await this.shareToWhatsApp(content);
            } catch (error) {
              console.error('WhatsApp share failed:', error);
            }
          },
        },
        {
          text: 'Telegram',
          onPress: async () => {
            console.log('Telegram share selected for:', content.title);
            try {
              await this.shareToTelegram(content);
            } catch (error) {
              console.error('Telegram share failed:', error);
            }
          },
        },
        {
          text: 'More Options',
          onPress: async () => {
            console.log('More options selected for:', content.title);
            try {
              // Use the native share dialog directly
              if (Share && Platform.OS !== 'web') {
                const shareOptions = {
                  title: content.title,
                  message: content.message,
                  url: content.url || '',
                };
                await Share.open(shareOptions);
              } else {
                // Fallback to Expo sharing
                const Sharing = require('expo-sharing');
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(content.message, {
                    dialogTitle: content.title,
                  });
                } else {
                  Alert.alert('Not Available', 'Sharing is not available on this device.');
                }
              }
            } catch (error) {
              console.error('Share failed:', error);
              Alert.alert('Error', 'Failed to open share options.');
            }
          },
        },
        {
          text: 'Copy to Clipboard',
          onPress: async () => {
            console.log('Copy text selected for:', content.title);
            try {
              await this.copyToClipboard(content.message);
              Alert.alert('Success', 'Content copied to clipboard!');
            } catch (error) {
              console.error('Copy failed:', error);
              Alert.alert('Error', 'Failed to copy content.');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }
}
