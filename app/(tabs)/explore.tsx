
import React, { useState } from 'react';
import { ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ContentCard } from '@/components/ContentCard';
import { contentData, platforms, Content } from '@/data/ottPlatforms';

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const filteredContent = selectedPlatform === 'all' 
    ? contentData 
    : contentData.filter(content => content.platform === selectedPlatform);

  const handleContentPress = (content: Content) => {
    router.push(`/content/${content.id}`);
  };

  const topRatedContent = [...contentData]
    .sort((a, b) => b.imdbRating - a.imdbRating)
    .slice(0, 4);

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Explore Content
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Discover movies and series across platforms
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Top Rated
          </ThemedText>
          <FlatList
            data={topRatedContent}
            renderItem={({ item }) => (
              <ContentCard
                content={item}
                onPress={() => handleContentPress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.contentGrid}
            scrollEnabled={false}
          />
        </ThemedView>

        <ThemedView style={styles.filterSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Browse by Platform
          </ThemedText>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPlatform === 'all' && styles.activeFilterChip
              ]}
              onPress={() => setSelectedPlatform('all')}
            >
              <ThemedText style={[
                styles.filterChipText,
                selectedPlatform === 'all' && styles.activeFilterChipText
              ]}>
                All Platforms
              </ThemedText>
            </TouchableOpacity>
            
            {platforms.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.filterChip,
                  selectedPlatform === platform.id && styles.activeFilterChip,
                  selectedPlatform === platform.id && { backgroundColor: platform.color }
                ]}
                onPress={() => setSelectedPlatform(platform.id)}
              >
                <ThemedText style={[
                  styles.filterChipText,
                  selectedPlatform === platform.id && styles.activeFilterChipText
                ]}>
                  {platform.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        <FlatList
          data={filteredContent}
          renderItem={({ item }) => (
            <ContentCard
              content={item}
              onPress={() => handleContentPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.contentGrid}
          scrollEnabled={false}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  contentGrid: {
    paddingBottom: 10,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
});
