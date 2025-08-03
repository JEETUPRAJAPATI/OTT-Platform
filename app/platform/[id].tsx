
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ContentCard } from '@/components/ContentCard';
import { contentData, platforms, Content } from '@/data/ottPlatforms';

export default function PlatformScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'movie' | 'series'>('all');

  const platform = platforms.find(p => p.id === id);
  const platformContent = contentData.filter(content => content.platform === id);

  const filteredContent = platformContent.filter(content => {
    if (selectedFilter === 'all') return true;
    return content.type === selectedFilter;
  });

  const handleContentPress = (content: Content) => {
    router.push(`/content/${content.id}`);
  };

  if (!platform) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Platform not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: platform.color }]}>
            {platform.name}
          </ThemedText>
          <ThemedText style={styles.contentCount}>
            {filteredContent.length} {selectedFilter === 'all' ? 'items' : selectedFilter + 's'} available
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.filterContainer}>
          {['all', 'movie', 'series'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && [styles.activeFilter, { backgroundColor: platform.color }]
              ]}
              onPress={() => setSelectedFilter(filter as 'all' | 'movie' | 'series')}
            >
              <ThemedText style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
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
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  activeFilter: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  contentGrid: {
    paddingBottom: 20,
  },
});
