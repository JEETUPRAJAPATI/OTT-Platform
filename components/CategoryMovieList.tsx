import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { tmdbService, TMDbMovie } from "@/services/tmdbApi";
import { TMDbContentCard } from "./TMDbContentCard";
import { Category } from "./CategorySlider";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2;

interface CategoryMovieListProps {
  category: Category | null;
  onMoviePress: (movie: TMDbMovie) => void;
}

export function CategoryMovieList({
  category,
  onMoviePress,
}: CategoryMovieListProps) {
  const [movies, setMovies] = useState<TMDbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const flatListRef = useRef<FlatList>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (category) {
      fetchMoviesByCategory(category, true);
    }
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [category]);

  useEffect(() => {
    if (movies.length > 0) {
      startAutoScroll();
    }
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [movies]);

  const startAutoScroll = () => {
    // Keep auto-scroll but remove manual arrows
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
  };

  const fetchMoviesByCategory = async (
    selectedCategory: Category,
    reset = false,
  ) => {
    try {
      setLoading(true);

      if (reset) {
        setMovies([]);
        setPage(1);
        setHasMorePages(true);
      }

      const currentPage = reset ? 1 : page;
      let response;

      if (selectedCategory.country) {
        // For Hollywood
        response = await tmdbService.getRegionalContent(
          selectedCategory.country,
          "movie",
          currentPage,
        );
      } else if (selectedCategory.language) {
        // For language-based categories
        const filters = {
          with_original_language: selectedCategory.language,
          sort_by: "popularity.desc",
          page: currentPage,
        };
        response = await tmdbService.advancedMovieSearch(filters);
      } else {
        response = [];
      }

      if (response && response.length > 0) {
        if (reset) {
          setMovies(response);
        } else {
          setMovies((prev) => [...prev, ...response]);
        }

        // Update pagination state
        setPage(currentPage + 1);
        setHasMorePages(response.length === 20); // Assume more pages if we get full page

        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error("Error fetching movies by category:", error);
      setMovies([]);
      setHasMorePages(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMorePages && category) {
      fetchMoviesByCategory(category, false);
    }
  };

  const handleScrollBeginDrag = () => {
    // Stop auto scroll when user starts manually scrolling
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // Resume auto scroll after user stops scrolling
    setTimeout(() => {
      startAutoScroll();
    }, 3000); // Wait 3 seconds before resuming auto scroll
  };

  const renderSkeletonItem = () => (
    <View style={[styles.skeletonCard, { width: cardWidth }]}>
      <View style={styles.skeletonPoster} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonRating} />
    </View>
  );

  const renderMovieItem = useCallback(({
    item,
    index,
  }: {
    item: TMDbMovie;
    index: number;
  }) => (
    <TMDbContentCard
      content={item}
      type="movie"
      onPress={() => onMoviePress(item)}
      style={[styles.movieCard, { width: cardWidth }]}
      showShareButton={true}
    />
  ), [onMoviePress]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: cardWidth * 1.5 + 16, // height + margin
    offset: (cardWidth * 1.5 + 16) * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: TMDbMovie, index: number) => 
    `movie-${item.id}-${index}`, []);

  const memoizedMovies = useMemo(() => movies, [movies]);

  const renderLoadMoreButton = () => {
    if (!hasMorePages) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMore}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#E50914" />
        ) : (
          <Text style={styles.loadMoreText}>Load More</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && movies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{category?.name} Movies</Text>
        <FlatList
          data={Array(6).fill(null)}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, index) => `skeleton-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={10}
        />
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  countText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 20,
  },
  movieCard: {
    marginBottom: 16,
  },
  loadMoreButton: {
    width: 120,
    height: cardWidth * 1.5,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  loadMoreText: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  // Skeleton styles
  skeletonCard: {
    marginBottom: 16,
  },
  skeletonPoster: {
    width: "100%",
    height: cardWidth * 1.5,
    backgroundColor: "#333",
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: "80%",
    height: 16,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonRating: {
    width: "50%",
    height: 12,
    backgroundColor: "#333",
    borderRadius: 4,
  },
});
