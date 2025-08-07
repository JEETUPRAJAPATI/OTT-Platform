import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Image, FlatList, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ContentCard } from '@/components/ContentCard';
import { platforms, contentData, Content } from '@/data/ottPlatforms';
import { Ionicons } from '@expo/vector-icons';

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
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>
              Platform not found
            </ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {platform.name}
        </ThemedText>
      </View>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.platformHeader}>
          <Image source={{ uri: platform.logo }} style={styles.platformLogo} />
          <ThemedText type="title" style={styles.platformName}>
            {platform.name}
          </ThemedText>
          <ThemedText style={styles.platformDescription}>
            {platform.description}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  platformHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  platformLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    resizeMode: 'contain',
  },
  platformName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  platformDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
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