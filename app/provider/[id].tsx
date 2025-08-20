
import React, { useState, useEffect, useCallback } from "react";
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
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const [totalResults, setTotalResults] = useState(0);
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
        setContent([]);
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
      setTotalResults(response.total_results);
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

  const handleContentPress = useCallback((item: TMDbMovie | TMDbTVShow) => {
    const type = (item as any).title ? "movie" : "tv";
    router.push(`/tmdb-content/${item.id}?type=${type}`);
  }, [router]);

  const handleBackPress = useCallback(() => {
    console.log("Back button pressed");
    router.back();
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(true);
  }, [contentType]);

  const loadMore = useCallback(() => {
    if (!loadingMore && page <= totalPages && content.length > 0) {
      loadContent(false);
    }
  }, [loadingMore, page, totalPages, content.length]);

  const renderContentItem = useCallback(({ item, index }: { item: TMDbMovie | TMDbTVShow; index: number }) => (
    <View style={[styles.itemContainer, { width: cardWidth }]}>
      <TMDbContentCard
        content={item}
        type={(item as any).title ? "movie" : "tv"}
        onPress={() => handleContentPress(item)}
        style={{ width: cardWidth, marginBottom: 20 }}
      />
    </View>
  ), [handleContentPress]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E50914" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{providerName || "Provider Content"}</Text>
      </View>
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
        {totalResults > 0 ? totalResults : content.length} {contentType === "movie" ? "movies" : "TV shows"} found
        {!loading && content.length > 0 && (
          <Text style={styles.loadingMoreText}>
            {` (loading more...)`}
          </Text>
        )}
      </Text>
    </View>
  ), [handleBackPress, providerName, contentType, totalResults, content.length, loading]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: cardWidth * 1.5 + 20,
    offset: (cardWidth * 1.5 + 20) * Math.floor(index / 2),
    index,
  }), []);

  const keyExtractor = useCallback((item: TMDbMovie | TMDbTVShow, index: number) => 
    `${(item as any).title ? 'movie' : 'tv'}-${item.id}-${index}`, []);

  if (loading && content.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={content}
        renderItem={renderContentItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.row}
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={getItemLayout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#000",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginLeft: 0,
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
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
  loadingMoreText: {
    color: "#666",
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemContainer: {
    flex: 1,
    maxWidth: cardWidth,
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
