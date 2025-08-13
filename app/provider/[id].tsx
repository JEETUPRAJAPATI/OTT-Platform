
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { tmdbService, TMDbMovie, TMDbTVShow } from "@/services/tmdbApi";
import { TMDbContentCard } from "@/components/TMDbContentCard";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2;

export default function ProviderContentScreen() {
  const {
    id: providerId,
    name: providerName,
    type = "movie",
  } = useLocalSearchParams();
  const router = useRouter();
  const [content, setContent] = useState<(TMDbMovie | TMDbTVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentType, setContentType] = useState<"movie" | "tv">(
    type as "movie" | "tv",
  );

  useEffect(() => {
    loadContent(true);
  }, [contentType]);

  const loadContent = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await tmdbService.getContentByProvider(
        parseInt(providerId as string),
        contentType,
        "US",
        currentPage,
      );

      if (reset) {
        setContent(response.results);
      } else {
        setContent((prev) => [...prev, ...response.results]);
      }

      setTotalPages(response.total_pages);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error loading provider content:", error);
      Alert.alert("Error", "Failed to load content. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleContentPress = (item: TMDbMovie | TMDbTVShow) => {
    const type = (item as any).title ? "movie" : "tv";
    router.push(`/tmdb-content/${item.id}?type=${type}`);
  };

  const handleBackPress = () => {
    console.log("Back button pressed");
    router.back();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadContent(true);
  };

  const loadMore = () => {
    if (!loadingMore && page <= totalPages) {
      loadContent(false);
    }
  };

  const renderContent = ({ item }: { item: TMDbMovie | TMDbTVShow }) => {
    const mediaType = (item as any).title ? "movie" : "tv";
    return (
      <TMDbContentCard
        content={item}
        type={mediaType}
        onPress={() => handleContentPress(item)}
        style={{ width: cardWidth, marginBottom: 20 }}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E50914" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            contentType === "movie" && styles.activeToggle,
          ]}
          onPress={() => setContentType("movie")}
        >
          <Text
            style={[
              styles.toggleText,
              contentType === "movie" && styles.activeToggleText,
            ]}
          >
            Movies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            contentType === "tv" && styles.activeToggle,
          ]}
          onPress={() => setContentType("tv")}
        >
          <Text
            style={[
              styles.toggleText,
              contentType === "tv" && styles.activeToggleText,
            ]}
          >
            TV Shows
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.resultCount}>
        {content.length} {contentType === "movie" ? "movies" : "TV shows"} found
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: (providerName as string) || "Provider Content",
            headerStyle: { backgroundColor: "#000" },
            headerTintColor: "#fff",
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: (providerName as string) || "Provider Content",
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={content}
        renderItem={renderContent}
        keyExtractor={(item) => `${contentType}-${item.id}`}
        numColumns={2}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
            progressBackgroundColor="#000"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backButton: {
    marginLeft: 10,
    padding: 8,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "#E50914",
  },
  toggleText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  activeToggleText: {
    color: "#fff",
  },
  resultCount: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  separator: {
    height: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
