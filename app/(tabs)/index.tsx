import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  FlatList,
  RefreshControl,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Text,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SplashScreen } from '@/components/SplashScreen';
import { MovieSlider } from '@/components/MovieSlider';
import { SliderBanner } from '@/components/SliderBanner';
import { tmdbService, TMDbMovie, TMDbTVShow } from '@/services/tmdbApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Content state
  const [trendingContent, setTrendingContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [topInIndiaContent, setTopInIndiaContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [popularContent, setPopularContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [newReleases, setNewReleases] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [actionMovies, setActionMovies] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [southIndianMovies, setSouthIndianMovies] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [criticsChoice, setCriticsChoice] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [familyPicks, setFamilyPicks] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [romanticHits, setRomanticHits] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [awardWinners, setAwardWinners] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [heroBannerContent, setHeroBannerContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);

  useEffect(() => {
    loadAllContent();
  }, []);

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const removeDuplicates = (arrays: any[][]) => {
    const used = new Set();
    return arrays.map(array =>
      array.filter(item => {
        const key = `${item.id}-${item.title || item.name}`;
        if (used.has(key)) return false;
        used.add(key);
        return true;
      })
    );
  };

  const loadAllContent = async () => {
    try {
      setIsLoading(true);

      // Load all content in parallel
      const [
        trending,
        popular,
        upcoming,
        topRated,
        actionContent,
        thrillerContent,
        southContent,
        hindiContent
      ] = await Promise.all([
        tmdbService.getTrending('all', 'week'),
        tmdbService.getPopularMovies(),
        tmdbService.getUpcomingMovies(),
        tmdbService.getTopRatedMovies(),
        tmdbService.getMoviesByGenre(28), // Action
        tmdbService.getMoviesByGenre(53), // Thriller
        tmdbService.getSouthIndianMovies(),
        tmdbService.getHindiMovies()
      ]);

      // Get additional content for variety
      const [
        familyContent,
        romanceContent,
        dramaContent
      ] = await Promise.all([
        tmdbService.getMoviesByGenre(10751), // Family
        tmdbService.getMoviesByGenre(10749), // Romance
        tmdbService.getMoviesByGenre(18) // Drama
      ]);

      // Remove duplicates across all arrays
      const [
        cleanTrending,
        cleanPopular,
        cleanUpcoming,
        cleanTopRated,
        cleanAction,
        cleanThriller,
        cleanSouth,
        cleanHindi,
        cleanFamily,
        cleanRomance,
        cleanDrama
      ] = removeDuplicates([
        trending,
        popular,
        upcoming,
        topRated,
        actionContent,
        thrillerContent,
        southContent,
        hindiContent,
        familyContent,
        romanceContent,
        dramaContent
      ]);

      // Set content with shuffled arrays (except Top 10 India)
      setTrendingContent(shuffleArray(cleanTrending).slice(0, 20));
      setTopInIndiaContent(cleanHindi.slice(0, 10)); // Keep original order for rankings
      setPopularContent(shuffleArray(cleanPopular).slice(0, 20));
      setNewReleases(shuffleArray(cleanUpcoming).slice(0, 20));
      setActionMovies(shuffleArray(cleanAction).slice(0, 20));
      setThrillerMovies(shuffleArray(cleanThriller).slice(0, 20));
      setSouthIndianMovies(shuffleArray(cleanSouth).slice(0, 20));
      setCriticsChoice(shuffleArray(cleanTopRated).slice(0, 20));
      setFamilyPicks(shuffleArray(cleanFamily).slice(0, 20));
      setRomanticHits(shuffleArray(cleanRomance).slice(0, 20));
      setAwardWinners(shuffleArray(cleanDrama).slice(0, 20));
      setHeroBannerContent(cleanTrending.slice(0, 5));

    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllContent();
    setRefreshing(false);
  };

  const handleContentPress = (item: TMDbMovie | TMDbTVShow) => {
    const type = (item as any).title ? 'movie' : 'tv';
    router.push(`/tmdb-content/${item.id}?type=${type}`);
  };

  const handleViewAll = (section: string, data: (TMDbMovie | TMDbTVShow)[]) => {
    // Navigate to discover page with genre filter
    const genreMapping: { [key: string]: number } = {
      'Action Movies': 28,
      'Thrillers': 53,
      'Family Picks': 10751,
      'Romantic Hits': 10749,
      'Award Winners': 18
    };

    if (genreMapping[section]) {
      router.push({
        pathname: '/(tabs)/discover',
        params: { genre: genreMapping[section] }
      });
    } else {
      router.push('/(tabs)/discover');
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF453A" />
        }
      >
        {/* Hero Banner Section */}
        {heroBannerContent.length > 0 && (
          <SliderBanner
            content={heroBannerContent}
            onContentPress={handleContentPress}
            onWatchNow={handleContentPress}
          />
        )}

        {/* Content Sections */}
        <View style={styles.sectionsContainer}>
          {/* Trending Now */}
          <MovieSlider
            title="Trending Now"
            data={trendingContent}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Trending Now', trendingContent)}
          />

          {/* Top 10 in India */}
          <MovieSlider
            title="Top 10 in India"
            data={topInIndiaContent}
            onContentPress={handleContentPress}
            showRankings={true}
            onViewAll={() => handleViewAll('Top 10 in India', topInIndiaContent)}
          />

          {/* Popular on Rk Shot */}
          <MovieSlider
            title="Popular on Rk Shot"
            data={popularContent}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Popular on Rk Shot', popularContent)}
          />

          {/* New Release */}
          <MovieSlider
            title="New Release"
            data={newReleases}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('New Release', newReleases)}
          />

          {/* Action Movies */}
          <MovieSlider
            title="Action Movies"
            data={actionMovies}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Action Movies', actionMovies)}
          />

          {/* Thrillers */}
          <MovieSlider
            title="Thrillers"
            data={thrillerMovies}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Thrillers', thrillerMovies)}
          />

          {/* South Indian Movies */}
          <MovieSlider
            title="South Indian Movies"
            data={southIndianMovies}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('South Indian Movies', southIndianMovies)}
          />

          {/* Critics Choice */}
          <MovieSlider
            title="Critics Choice"
            data={criticsChoice}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Critics Choice', criticsChoice)}
          />

          {/* Family Picks */}
          <MovieSlider
            title="Family Picks"
            data={familyPicks}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Family Picks', familyPicks)}
          />

          {/* Romantic Hits */}
          <MovieSlider
            title="Romantic Hits"
            data={romanticHits}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Romantic Hits', romanticHits)}
          />

          {/* Award Winners */}
          <MovieSlider
            title="Award Winners"
            data={awardWinners}
            onContentPress={handleContentPress}
            onViewAll={() => handleViewAll('Award Winners', awardWinners)}
          />
        </View>

        {/* Bottom Spacer */}
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
  scrollView: {
    flex: 1,
  },
  sectionsContainer: {
    paddingTop: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});