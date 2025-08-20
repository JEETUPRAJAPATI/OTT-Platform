
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tmdbService } from '@/services/tmdbApi';
import { TMDbContentCard } from '@/components/TMDbContentCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string;
  deathday: string | null;
  place_of_birth: string;
  profile_path: string;
  known_for_department: string;
  popularity: number;
  gender: number;
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string;
}

interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  character?: string;
  job?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

export default function PersonDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [movieCredits, setMovieCredits] = useState<PersonCredit[]>([]);
  const [tvCredits, setTvCredits] = useState<PersonCredit[]>([]);
  const [combinedCredits, setCombinedCredits] = useState<PersonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');

  useEffect(() => {
    if (id) {
      loadPersonDetails();
    }
  }, [id]);

  const loadPersonDetails = async () => {
    try {
      setLoading(true);
      const personData = await tmdbService.getPersonDetails(Number(id));
      
      setPerson(personData);
      
      // Extract credits from the person data
      const movieCreds = personData.movie_credits?.cast || [];
      const tvCreds = personData.tv_credits?.cast || [];
      const combinedCreds = personData.combined_credits?.cast || [];
      
      // Sort by popularity/release date
      setMovieCredits(movieCreds.sort((a, b) => b.vote_average - a.vote_average).slice(0, 20));
      setTvCredits(tvCreds.sort((a, b) => b.vote_average - a.vote_average).slice(0, 20));
      setCombinedCredits(combinedCreds.sort((a, b) => b.popularity - a.popularity).slice(0, 30));
      
    } catch (error) {
      console.error('Error loading person details:', error);
      Alert.alert('Error', 'Failed to load person details');
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (credit: PersonCredit) => {
    const contentType = credit.media_type || (credit.title ? 'movie' : 'tv');
    router.push(`/tmdb-content/${credit.id}?type=${contentType}`);
  };

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1: return 'Female';
      case 2: return 'Male';
      case 3: return 'Non-binary';
      default: return 'Not specified';
    }
  };

  const calculateAge = (birthday: string, deathday?: string | null) => {
    if (!birthday) return null;
    
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    const age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  };

  const getCurrentCredits = () => {
    switch (activeTab) {
      case 'movies': return movieCredits;
      case 'tv': return tvCredits;
      default: return combinedCredits;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Person not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: profileUrl }}
            style={styles.backgroundImage}
            blurRadius={10}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)', '#000']}
              style={styles.heroGradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Person Details</Text>
                <View style={styles.headerButton} />
              </View>

              {/* Person Info */}
              <View style={styles.heroContent}>
                <View style={styles.profileContainer}>
                  <Image source={{ uri: profileUrl }} style={styles.profileImage} />
                </View>

                <View style={styles.personInfo}>
                  <Text style={styles.personName} numberOfLines={2}>{person.name}</Text>
                  
                  <View style={styles.metaInfo}>
                    <Text style={styles.department}>{person.known_for_department}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.gender}>{getGenderText(person.gender)}</Text>
                  </View>

                  {person.birthday && (
                    <View style={styles.ageInfo}>
                      <Text style={styles.ageText}>
                        {person.deathday ? 'Lived' : 'Age'}: {calculateAge(person.birthday, person.deathday)} years
                      </Text>
                      {person.deathday && (
                        <Text style={styles.deathInfo}>
                          ({new Date(person.birthday).getFullYear()} - {new Date(person.deathday).getFullYear()})
                        </Text>
                      )}
                    </View>
                  )}

                  {person.place_of_birth && (
                    <View style={styles.birthplaceContainer}>
                      <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.birthplace} numberOfLines={2}>
                        {person.place_of_birth}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Biography Section */}
        {person.biography && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <Text style={styles.biography}>{person.biography}</Text>
          </View>
        )}

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.detailsGrid}>
            {person.birthday && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Birthday</Text>
                <Text style={styles.detailValue}>
                  {new Date(person.birthday).toLocaleDateString()}
                </Text>
              </View>
            )}

            {person.deathday && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Death</Text>
                <Text style={styles.detailValue}>
                  {new Date(person.deathday).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Known For</Text>
              <Text style={styles.detailValue}>{person.known_for_department}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Popularity</Text>
              <Text style={styles.detailValue}>{person.popularity.toFixed(1)}</Text>
            </View>

            {person.also_known_as && person.also_known_as.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Also Known As</Text>
                <Text style={styles.detailValue}>
                  {person.also_known_as.slice(0, 3).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known For</Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                All ({combinedCredits.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
              onPress={() => setActiveTab('movies')}
            >
              <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>
                Movies ({movieCredits.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tv' && styles.activeTab]}
              onPress={() => setActiveTab('tv')}
            >
              <Text style={[styles.tabText, activeTab === 'tv' && styles.activeTabText]}>
                TV Shows ({tvCredits.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Credits Grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.creditsContainer}
          >
            {getCurrentCredits().map((credit) => (
              <TouchableOpacity
                key={`${credit.id}-${credit.media_type}`}
                style={styles.creditItem}
                onPress={() => handleContentPress(credit)}
              >
                <Image
                  source={{
                    uri: credit.poster_path
                      ? `https://image.tmdb.org/t/p/w300${credit.poster_path}`
                      : 'https://via.placeholder.com/300x450?text=No+Image'
                  }}
                  style={styles.creditPoster}
                />
                <Text style={styles.creditTitle} numberOfLines={2}>
                  {credit.title || credit.name}
                </Text>
                {credit.character && (
                  <Text style={styles.creditCharacter} numberOfLines={1}>
                    as {credit.character}
                  </Text>
                )}
                <View style={styles.creditMeta}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.creditRating}>
                    {credit.vote_average ? credit.vote_average.toFixed(1) : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: screenHeight * 0.6,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  heroContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  profileContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  profileImage: {
    width: 130,
    height: 195,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  personInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  personName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  department: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginHorizontal: 12,
  },
  gender: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  ageInfo: {
    marginBottom: 8,
  },
  ageText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  deathInfo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  birthplaceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  birthplace: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  biography: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#E50914',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  creditsContainer: {
    paddingVertical: 8,
  },
  creditItem: {
    width: 120,
    marginRight: 16,
  },
  creditPoster: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  creditTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 16,
  },
  creditCharacter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  creditMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  creditRating: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginLeft: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
