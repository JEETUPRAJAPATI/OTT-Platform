
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Switch, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      Alert.alert('Success', 'Logged in successfully!');
    } else {
      Alert.alert('Error', 'Please enter a username');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => setIsLoggedIn(false) }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setIsLoggedIn(false);
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          }
        }
      ]
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'We value your privacy. Your data is secure with us and we do not share it with third parties.',
      [{ text: 'OK' }]
    );
  };

  const showRateApp = () => {
    Alert.alert(
      'Rate App',
      'How would you rate RK SWOT?',
      [
        { text: '⭐ 1 Star' },
        { text: '⭐⭐ 2 Stars' },
        { text: '⭐⭐⭐ 3 Stars' },
        { text: '⭐⭐⭐⭐ 4 Stars' },
        { text: '⭐⭐⭐⭐⭐ 5 Stars' }
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#1a1a1a']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={100} color="rgba(255,255,255,0.3)" />
            </View>
            <ThemedText style={styles.welcomeText}>Welcome to RK SWOT</ThemedText>
            <ThemedText style={styles.subtitleText}>Sign in to access your content</ThemedText>
          </View>
        </LinearGradient>

        <ThemedView style={styles.content}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => setShowLoginModal(true)}
          >
            <LinearGradient
              colors={['#E50914', '#B8070F']}
              style={styles.gradientButton}
            >
              <Ionicons name="log-in" size={24} color="#fff" />
              <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.featuresSection}>
            <ThemedText style={styles.featuresTitle}>Why sign in?</ThemedText>
            <View style={styles.feature}>
              <Ionicons name="download" size={24} color="#E50914" />
              <ThemedText style={styles.featureText}>Download content for offline viewing</ThemedText>
            </View>
            <View style={styles.feature}>
              <Ionicons name="bookmark" size={24} color="#E50914" />
              <ThemedText style={styles.featureText}>Save your favorites</ThemedText>
            </View>
            <View style={styles.feature}>
              <Ionicons name="sync" size={24} color="#E50914" />
              <ThemedText style={styles.featureText}>Sync across devices</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Login Modal */}
        <Modal
          visible={showLoginModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Sign In</ThemedText>
                <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TouchableOpacity style={styles.modalButton} onPress={handleLogin}>
                <ThemedText style={styles.modalButtonText}>Sign In</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => setShowEditProfile(true)}
          >
            <Ionicons name="person-circle" size={100} color="#E50914" />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <ThemedText style={styles.username}>{username || 'User'}</ThemedText>
          <ThemedText style={styles.userEmail}>{email}</ThemedText>
        </View>
      </LinearGradient>

      <ThemedView style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowEditProfile(true)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person" size={24} color="#E50914" />
              <ThemedText style={styles.menuItemText}>Edit Profile</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={showPrivacyPolicy}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#E50914" />
              <ThemedText style={styles.menuItemText}>Privacy Policy</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications" size={24} color="#E50914" />
              <ThemedText style={styles.menuItemText}>Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#E50914' }}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="download" size={24} color="#E50914" />
              <ThemedText style={styles.menuItemText}>Auto Download</ThemedText>
            </View>
            <Switch
              value={autoDownload}
              onValueChange={setAutoDownload}
              trackColor={{ false: '#767577', true: '#E50914' }}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App</ThemedText>
          
          <TouchableOpacity style={styles.menuItem} onPress={showRateApp}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="star" size={24} color="#E50914" />
              <ThemedText style={styles.menuItemText}>Rate & Review</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle" size={24} color="#E50914" />
              <ThemedText style={styles.menuItemText}>About</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerMenuItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={24} color="#FF3B30" />
            <ThemedText style={styles.dangerMenuText}>Delete Account</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerMenuItem} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#FF3B30" />
            <ThemedText style={styles.dangerMenuText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Profile</ThemedText>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowEditProfile(false);
                Alert.alert('Success', 'Profile updated!');
              }}
            >
              <ThemedText style={styles.modalButtonText}>Save Changes</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E50914',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loginButton: {
    marginVertical: 30,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  featuresSection: {
    marginTop: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
  },
  dangerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  dangerMenuText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
