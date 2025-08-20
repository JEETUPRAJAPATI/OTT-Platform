import { Tabs } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  apiService,
  FavoriteItem,
  WatchlistItem,
  Review,
} from "@/services/apiService";
import { TMDbContentCard } from "@/components/TMDbContentCard";
import { ShareModal } from "@/components/ShareModal";
import { ShareService, ShareContent } from "@/services/shareService";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_READ_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMDQwNWI5ZjEzODNlMTE4ZjljZmE4NmQ3Yjc0ZTJiOSIsIm5iZiI6MTc1NDU1NTAwNy4xNjQsInN1YiI6IjY4OTQ2MjdmMzQ4MDE5NWFhNDY2ZTZmNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gH2CFYya3S8QwYBUFhuEKcP4JWoMPnAeaRPDAE03Rik";
const ACCOUNT_ID = "22206352";

const { height: screenHeight } = Dimensions.get("window");

function CustomTabBar() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSettingsTab, setSelectedSettingsTab] = useState<
    "favorites" | "watchlist" | "about" | "privacy" | "reviews" | null
  >(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    contentId: "",
    title: "",
    review: "",
    rating: 0,
  });

  const loadRatedMovies = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/account/${ACCOUNT_ID}/rated/movies?language=en-US&sort_by=created_at.desc&page=1`,
        {
          headers: {
            Authorization: `Bearer ${API_READ_ACCESS_TOKEN}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setRatedMovies(data.results || []);
      }
    } catch (error) {
      console.error("Error loading rated movies:", error);
    }
  };

  const loadData = async () => {
    try {
      const [favoritesData, watchlistData, reviewsData] = await Promise.all([
        apiService.getFavorites(),
        apiService.getWatchlist(),
        apiService.getReviews(),
        loadRatedMovies(),
      ]);

      setFavorites(favoritesData);
      setWatchlist(watchlistData);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const openSettings = () => {
    setShowSettings(true);
    loadData();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSettings = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSettings(false);
    });
  };

  const removeFromFavorites = async (contentId: string) => {
    try {
      await apiService.removeFromFavorites(contentId);
      setFavorites((prev) =>
        prev.filter((item) => item.contentId !== contentId),
      );
      Alert.alert("Success", "Removed from favorites");
    } catch (error) {
      Alert.alert("Error", "Failed to remove from favorites");
    }
  };

  const removeFromWatchlist = async (contentId: string) => {
    try {
      await apiService.removeFromWatchlist(contentId);
      setWatchlist((prev) =>
        prev.filter((item) => item.contentId !== contentId),
      );
      Alert.alert("Success", "Removed from watchlist");
    } catch (error) {
      Alert.alert("Error", "Failed to remove from watchlist");
    }
  };

  const submitReview = async () => {
    if (!reviewForm.title || !reviewForm.review || reviewForm.rating === 0) {
      Alert.alert("Error", "Please fill all fields and provide a rating");
      return;
    }

    try {
      await apiService.addReview(
        reviewForm.contentId || "sample-content",
        reviewForm.title,
        reviewForm.review,
        reviewForm.rating,
        "movie",
      );

      setReviewForm({ contentId: "", title: "", review: "", rating: 0 });
      loadData();
      Alert.alert("Success", "Review submitted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to submit review");
    }
  };

  const renderStars = (rating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={24}
              color={star <= rating ? "#FFD700" : "#666"}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFavorites = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>My Favorites ({favorites.length})</Text>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubText}>
            Add movies and shows to your favorites
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromFavorites(item.contentId)}
              >
                <Ionicons name="close-circle" size={24} color="#E50914" />
              </TouchableOpacity>
              <TMDbContentCard
                content={{
                  id: parseInt(item.contentId),
                  title: item.title,
                  poster_path: item.posterPath,
                  vote_average: 0,
                  overview: "",
                  release_date: "",
                  first_air_date: "",
                  genre_ids: [],
                  original_language: "",
                  popularity: 0,
                  backdrop_path: "",
                }}
                onPress={() =>
                  router.push(
                    `/tmdb-content/${item.contentId}?type=${item.contentType}`,
                  )
                }
                style={styles.card}
              />
            </View>
          )}
        />
      )}
    </View>
  );

  const renderWatchlist = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>My Watchlist ({watchlist.length})</Text>
      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={60} color="#666" />
          <Text style={styles.emptyText}>No items in watchlist</Text>
          <Text style={styles.emptySubText}>
            Add movies and shows to watch later
          </Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWatchlist(item.contentId)}
              >
                <Ionicons name="close-circle" size={24} color="#E50914" />
              </TouchableOpacity>
              <TMDbContentCard
                content={{
                  id: parseInt(item.contentId),
                  title: item.title,
                  poster_path: item.posterPath,
                  vote_average: 0,
                  overview: "",
                  release_date: "",
                  first_air_date: "",
                  genre_ids: [],
                  original_language: "",
                  popularity: 0,
                  backdrop_path: "",
                }}
                onPress={() =>
                  router.push(
                    `/tmdb-content/${item.contentId}?type=${item.contentType}`,
                  )
                }
                style={styles.card}
              />
            </View>
          )}
        />
      )}
    </View>
  );

  const renderReviews = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Reviews & Ratings</Text>

      {/* Add Review Form */}
      <View style={styles.reviewForm}>
        <Text style={styles.formTitle}>Write a Review</Text>

        <TextInput
          style={styles.input}
          placeholder="Movie/Show Title"
          placeholderTextColor="#666"
          value={reviewForm.title}
          onChangeText={(text) =>
            setReviewForm((prev) => ({ ...prev, title: text }))
          }
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your review..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          value={reviewForm.review}
          onChangeText={(text) =>
            setReviewForm((prev) => ({ ...prev, review: text }))
          }
        />

        <Text style={styles.ratingLabel}>Your Rating:</Text>
        {renderStars(reviewForm.rating, (rating) =>
          setReviewForm((prev) => ({ ...prev, rating })),
        )}

        <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>{item.title}</Text>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.reviewText}>{item.review}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </View>
  );

  const renderAbout = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>About RK SWOT</Text>
      <View style={styles.aboutContent}>
        <Text style={styles.aboutText}>
          RK SWOT is your ultimate movie and TV show streaming companion.
          Discover, watch, and organize your favorite content all in one place.
        </Text>
        <Text style={styles.aboutText}>
          Features: • Extensive movie and TV show database • Personal favorites
          and watchlist • Ratings and reviews • Discover trending content •
          Search across all platforms
        </Text>
        <Text style={styles.aboutText}>Version: 1.0.0</Text>
      </View>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Privacy Policy</Text>
      <ScrollView style={styles.privacyContent}>
        <Text style={styles.privacyText}>
          <Text style={styles.privacyHeader}>Data Collection</Text>
          {"\n\n"}
          We collect minimal data necessary to provide our services. This
          includes your viewing preferences, ratings, and reviews.
          {"\n\n"}
          <Text style={styles.privacyHeader}>Data Usage</Text>
          {"\n\n"}
          Your data is used solely to enhance your experience and provide
          personalized recommendations.
          {"\n\n"}
          <Text style={styles.privacyHeader}>Data Security</Text>
          {"\n\n"}
          We implement industry-standard security measures to protect your
          personal information.
          {"\n\n"}
          <Text style={styles.privacyHeader}>Contact</Text>
          {"\n\n"}
          For privacy concerns, contact us at privacy@rkswot.com
        </Text>
      </ScrollView>
    </View>
  );

  const settingsTabs = [
    { key: "favorites", label: "Favorites", icon: "heart", color: "#E50914" },
    {
      key: "watchlist",
      label: "Watchlist",
      icon: "bookmark",
      color: "#8A2BE2",
    },
    {
      key: "downloads",
      label: "Downloads",
      icon: "download",
      color: "#00D4AA",
    },
    { key: "reviews", label: "Reviews", icon: "star", color: "#FFD700" },
    {
      key: "about",
      label: "About Us",
      icon: "information-circle",
      color: "#32CD32",
    },
    {
      key: "privacy",
      label: "Privacy Policy",
      icon: "shield-checkmark",
      color: "#1E90FF",
    },
    {
      key: "terms",
      label: "Terms of Use",
      icon: "document-text",
      color: "#FF6347",
    },
    { key: "support", label: "Support", icon: "help-circle", color: "#FFA500" },
  ];

  const handleSettingsOption = (option: string) => {
    closeSettings();

    switch (option) {
      case "favorites":
        router.push("/favorites");
        break;
      case "watchlist":
        router.push("/watchlist");
        break;
      case "downloads":
        router.push("/downloads");
        break;
      case "reviews":
        router.push("/reviews");
        break;
      case "about":
        router.push("/about-us");
        break;
      case "privacy":
        router.push("/privacy-policy");
        break;
      case "terms":
        router.push("/terms-of-use");
        break;
      case "support":
        router.push("/support");
        break;
    }
  };

  const handleShare = (contentToShare: ShareContent | null) => {
    if (contentToShare) {
      setShareContent(contentToShare);
      setIsShareModalVisible(true);
    }
  };

  const handleCloseShareModal = () => {
    setIsShareModalVisible(false);
    setShareContent(null);
  };

  return (
    <>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/")}
        >
          <Ionicons name="home" size={24} color="#666" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/movies")}
        >
          <Ionicons name="film" size={24} color="#666" />
          <Text style={styles.footerText}>Movies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/discover")}
        >
          <Ionicons name="compass" size={24} color="#666" />
          <Text style={styles.footerText}>Discover</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search" size={24} color="#666" />
          <Text style={styles.footerText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={openSettings}>
          <Ionicons name="settings" size={24} color="#666" />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="none"
        onRequestClose={closeSettings}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.settingsModal,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <SafeAreaView style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={closeSettings}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Settings Options List */}
              <ScrollView
                style={styles.settingsContent}
                showsVerticalScrollIndicator={false}
              >
                {settingsTabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.settingsOption}
                    onPress={() => handleSettingsOption(tab.key)}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: `${tab.color}20` },
                          ]}
                        >
                          <Ionicons
                            name={tab.icon as any}
                            size={24}
                            color={tab.color}
                          />
                        </View>
                        <Text style={styles.optionText}>{tab.label}</Text>
                      </View>

                      {tab.key === "favorites" && favorites.length > 0 && (
                        <View
                          style={[
                            styles.countBadge,
                            { backgroundColor: tab.color },
                          ]}
                        >
                          <Text style={styles.countText}>
                            {favorites.length}
                          </Text>
                        </View>
                      )}
                      {tab.key === "watchlist" && watchlist.length > 0 && (
                        <View
                          style={[
                            styles.countBadge,
                            { backgroundColor: tab.color },
                          ]}
                        >
                          <Text style={styles.countText}>
                            {watchlist.length}
                          </Text>
                        </View>
                      )}
                      {tab.key === "reviews" && reviews.length > 0 && (
                        <View
                          style={[
                            styles.countBadge,
                            { backgroundColor: tab.color },
                          ]}
                        >
                          <Text style={styles.countText}>{reviews.length}</Text>
                        </View>
                      )}

                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
      {/* Share Modal */}
      {shareContent && (
        <ShareModal
          visible={isShareModalVisible}
          onClose={handleCloseShareModal}
          content={shareContent}
        />
      )}
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        }}
        tabBar={() => <CustomTabBar />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="movies"
          options={{
            title: "Movies",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="film.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: "Discover",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="chevron.left.forwardslash.chevron.right"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={28}
                name={focused ? "magnifyingglass" : "magnifyingglass"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  settingsModal: {
    backgroundColor: "#000",
    height: screenHeight * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    backgroundColor: "#111",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  settingsContent: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsOption: {
    backgroundColor: "#111",
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  optionText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  tabContent: {
    flex: 1,
    paddingTop: 8,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  gridItem: {
    flex: 1,
    margin: 8,
    position: "relative",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
  },
  card: {
    width: "100%",
  },
  reviewForm: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  ratingLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  star: {
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: "#E50914",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewItem: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  reviewText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  aboutContent: {
    flex: 1,
  },
  aboutText: {
    fontSize: 16,
    color: "#ccc",
    lineHeight: 24,
    marginBottom: 16,
  },
  privacyContent: {
    flex: 1,
  },
  privacyText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 22,
  },
  privacyHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
