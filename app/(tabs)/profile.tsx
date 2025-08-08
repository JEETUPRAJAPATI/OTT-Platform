
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Switch,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userService, User, UserPreferences } from '@/services/userService';
import { downloadService } from '@/services/downloadService';
import { TMDbContentCard } from '@/components/TMDbContentCard';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, available: 0 });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const currentUser = userService.getCurrentUser();
    setUser(currentUser);
    setPreferences(currentUser?.preferences || null);
    setWatchlist(userService.getWatchlist());
    setFavorites(userService.getFavorites());
    setStorageInfo(downloadService.getStorageInfo());
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    if (preferences) {
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);
      userService.updateUserPreferences(updatedPreferences);
    }
  };

  const clearWatchlist = () => {
    Alert.alert(
      'Clear Watchlist',
      'Are you sure you want to remove all items from your watchlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            watchlist.forEach(item => {
              userService.removeFromWatchlist(item.contentId, item.contentType);
            });
            loadUserData();
          }
        }
      ]
    );
  };

  const clearFavorites = () => {
    Alert.alert(
      'Clear Favorites',
      'Are you sure you want to remove all items from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            favorites.forEach(item => {
              userService.removeFromFavorites(item.contentId, item.contentType);
            });
            loadUserData();
          }
        }
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your data including watchlist, favorites, viewing history, and downloads. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            userService.clearAllData();
            downloadService.clearAllDownloads();
            loadUserData();
          }
        }
      ]
    );
  };

  const formatStorageUsed = () => {
    const usedGB = storageInfo.used / 1024;
    const totalGB = storageInfo.total / 1024;
    return `${usedGB.toFixed(1)} GB of ${totalGB.toFixed(0)} GB used`;
  };

  const getStoragePercentage = () => {
    return (storageInfo.used / storageInfo.total) * 100;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <Image
          source={{ uri: user?.avatar || 'https://via.placeholder.com/100x100/E50914/white?text=U' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Auto-play</Text>
            <Text style={styles.preferenceDescription}>Automatically play next episode</Text>
          </View>
          <Switch
            value={preferences?.autoplay || false}
            onValueChange={(value) => updatePreference('autoplay', value)}
            trackColor={{ false: '#333', true: '#E50914' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Subtitles</Text>
            <Text style={styles.preferenceDescription}>Show subtitles by default</Text>
          </View>
          <Switch
            value={preferences?.subtitles || false}
            onValueChange={(value) => updatePreference('subtitles', value)}
            trackColor={{ false: '#333', true: '#E50914' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Parental Control</Text>
            <Text style={styles.preferenceDescription}>Filter adult content</Text>
          </View>
          <Switch
            value={preferences?.parentalControl || false}
            onValueChange={(value) => updatePreference('parentalControl', value)}
            trackColor={{ false: '#333', true: '#E50914' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Quality</Text>
            <Text style={styles.preferenceDescription}>
              Current: {preferences?.quality?.toUpperCase() || 'AUTO'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Storage Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.storageContainer}>
          <View style={styles.storageHeader}>
            <Ionicons name="phone-portrait" size={16} color="#fff" />
            <Text style={styles.storageText}>{formatStorageUsed()}</Text>
          </View>
          <View style={styles.storageBar}>
            <View style={[styles.storageProgress, { width: `${getStoragePercentage()}%` }]} />
          </View>
          <TouchableOpacity 
            style={styles.manageStorageButton}
            onPress={() => router.push('/downloads')}
          >
            <Text style={styles.manageStorageText}>Manage Downloads</Text>
            <Ionicons name="chevron-forward" size={16} color="#E50914" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Watchlist */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Watchlist ({watchlist.length})</Text>
          {watchlist.length > 0 && (
            <TouchableOpacity onPress={clearWatchlist}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {watchlist.length === 0 ? (
          <Text style={styles.emptyText}>No items in watchlist</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {watchlist.slice(0, 10).map((item) => (
              <TMDbContentCard
                key={item.id}
                content={{
                  id: item.contentId,
                  poster_path: item.posterPath,
                  title: item.title,
                  name: item.title,
                  vote_average: 0,
                  overview: '',
                  release_date: '',
                  first_air_date: '',
                  backdrop_path: '',
                  genre_ids: [],
                  original_language: '',
                  popularity: 0
                }}
                type={item.contentType}
                onPress={() => router.push(`/content/${item.contentId}?type=${item.contentType}`)}
                style={styles.contentCard}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Favorites */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Favorites ({favorites.length})</Text>
          {favorites.length > 0 && (
            <TouchableOpacity onPress={clearFavorites}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>No favorites yet</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.slice(0, 10).map((item) => (
              <TMDbContentCard
                key={item.id}
                content={{
                  id: item.contentId,
                  poster_path: item.posterPath,
                  title: item.title,
                  name: item.title,
                  vote_average: 0,
                  overview: '',
                  release_date: '',
                  first_air_date: '',
                  backdrop_path: '',
                  genre_ids: [],
                  original_language: '',
                  popularity: 0
                }}
                type={item.contentType}
                onPress={() => router.push(`/content/${item.contentId}?type=${item.contentType}`)}
                style={styles.contentCard}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/downloads')}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Downloads</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="time" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Viewing History</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Ionicons name="trash" size={20} color="#ff4444" />
          <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>Clear All Data</Text>
          <Ionicons name="chevron-forward" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#999',
  },
  storageContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  storageText: {
    fontSize: 14,
    color: '#999',
  },
  storageBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storageProgress: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  manageStorageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageStorageText: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '600',
  },
  contentCard: {
    marginRight: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  dangerButton: {
    borderBottomColor: 'rgba(255,68,68,0.2)',
  },
});
