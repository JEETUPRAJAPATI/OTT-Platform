
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="platform/[id]" 
          options={{ 
            title: 'Platform Content',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="content/[id]" 
          options={{ 
            title: 'Content Details',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="tmdb-content/[id]" 
          options={{ 
            title: 'Movie/TV Details',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="provider/[id]" 
          options={{ 
            title: 'Provider Content',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="about-us" 
          options={{ 
            title: 'About Us',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="privacy-policy" 
          options={{ 
            title: 'Privacy Policy',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="terms-of-use" 
          options={{ 
            title: 'Terms of Use',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="support" 
          options={{ 
            title: 'Support',
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
