
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Review } from '@/services/apiService';

export default function ReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    contentId: '',
    title: '',
    review: '',
    rating: 0,
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await apiService.getReviews();
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewForm.title || !reviewForm.review || reviewForm.rating === 0) {
      Alert.alert('Error', 'Please fill all fields and provide a rating');
      return;
    }

    try {
      await apiService.addReview(
        reviewForm.contentId || 'sample-content',
        reviewForm.title,
        reviewForm.review,
        reviewForm.rating,
        'movie'
      );

      setReviewForm({ contentId: '', title: '', review: '', rating: 0 });
      loadReviews();
      Alert.alert('Success', 'Review submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
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
              name={star <= rating ? 'star' : 'star-outline'}
              size={24}
              color={star <= rating ? '#FFD700' : '#666'}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Reviews & Ratings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Add Review Form */}
        <View style={styles.reviewForm}>
          <Text style={styles.formTitle}>Write a Review</Text>

          <TextInput
            style={styles.input}
            placeholder="Movie/Show Title"
            placeholderTextColor="#666"
            value={reviewForm.title}
            onChangeText={(text) => setReviewForm(prev => ({ ...prev, title: text }))}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your review..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            value={reviewForm.review}
            onChangeText={(text) => setReviewForm(prev => ({ ...prev, review: text }))}
          />

          <Text style={styles.ratingLabel}>Your Rating:</Text>
          {renderStars(reviewForm.rating, (rating) => setReviewForm(prev => ({ ...prev, rating })))}

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
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  reviewForm: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#E50914',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewItem: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  reviewText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
});
