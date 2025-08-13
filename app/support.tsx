
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const router = useRouter();
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      question: "How do I add movies to my watchlist?",
      answer: "Navigate to any movie or TV show details page and tap the bookmark icon to add it to your watchlist. You can view your watchlist from the Settings menu."
    },
    {
      question: "Can I download content for offline viewing?",
      answer: "The download feature helps you manage and organize download links from various platforms. Please ensure you only download content you have legal rights to access."
    },
    {
      question: "How do I rate and review content?",
      answer: "On any content details page, you'll find rating stars and a review section. Tap to rate and write your review. Your reviews will be saved in your profile."
    },
    {
      question: "Why isn't a movie or show appearing in search?",
      answer: "We use TMDb database which is comprehensive but may not include very new releases or obscure titles immediately. The database is regularly updated."
    },
    {
      question: "How do I sync my data across devices?",
      answer: "Your favorites, watchlist, and reviews are automatically synced when you're connected to the internet. Make sure you're using the same account across devices."
    },
    {
      question: "Can I customize my recommendations?",
      answer: "Your recommendations improve as you rate more content and add items to your favorites. The system learns from your preferences over time."
    }
  ];

  const supportOptions = [
    {
      title: "Email Support",
      description: "Get help via email",
      icon: "mail",
      color: "#E50914",
      action: () => Linking.openURL('mailto:support@rkswot.com?subject=RK SWOT Support Request')
    },
    {
      title: "FAQ",
      description: "Find quick answers",
      icon: "help-circle",
      color: "#32CD32",
      action: () => {}
    },
    {
      title: "Feature Request",
      description: "Suggest new features",
      icon: "bulb",
      color: "#FFD700",
      action: () => Linking.openURL('mailto:features@rkswot.com?subject=Feature Request')
    },
    {
      title: "Bug Report",
      description: "Report technical issues",
      icon: "bug",
      color: "#FF6347",
      action: () => Linking.openURL('mailto:bugs@rkswot.com?subject=Bug Report')
    }
  ];

  const handleSubmitContact = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailBody = `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`;
    const mailtoURL = `mailto:support@rkswot.com?subject=${encodeURIComponent(contactForm.subject)}&body=${encodeURIComponent(emailBody)}`;
    
    Linking.openURL(mailtoURL);
    
    setContactForm({ name: '', email: '', subject: '', message: '' });
    Alert.alert('Success', 'Your message has been prepared in your email client.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>How can we help you today?</Text>

        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.optionsGrid}>
            {supportOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionCard}
                onPress={option.action}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setSelectedFAQ(selectedFAQ === index ? null : index)}
            >
              <View style={styles.faqQuestion}>
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons 
                  name={selectedFAQ === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </View>
              {selectedFAQ === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactForm}>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#666"
              value={contactForm.name}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              value={contactForm.email}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, email: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Subject"
              placeholderTextColor="#666"
              value={contactForm.subject}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
            />
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Describe your issue or question..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={contactForm.message}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitContact}>
              <Text style={styles.submitButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Ways to Reach Us</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactItem}>📧 support@rkswot.com</Text>
            <Text style={styles.contactItem}>🌐 www.rkswot.com/help</Text>
            <Text style={styles.contactItem}>⏰ Response time: 24-48 hours</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            We're here to help! Don't hesitate to reach out with any questions or concerns.
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E50914',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    fontWeight: '500',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#ccc',
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 22,
  },
  contactForm: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#E50914',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactInfo: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
  },
  contactItem: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
  },
  footer: {
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
