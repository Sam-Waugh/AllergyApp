import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchResearchFeed } from '../store/slices/researchSlice';
import { Colors } from '../constants/Colors';
import { TopBar } from '../components/modern';

export default function ResearchScreen() {
  const dispatch = useAppDispatch();
  const { articles, isLoading } = useAppSelector((state) => state.research);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    dispatch(fetchResearchFeed());
  }, [dispatch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar 
        title="Allergy Research" 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[{ paddingBottom: insets.bottom + 20 }]}
      >
        {/* Research Header */}
        <View style={styles.headerSection}>
          <Ionicons name="analytics-outline" size={28} color={Colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Latest Research</Text>
            <Text style={styles.headerSubtitle}>Evidence-based allergy information curated for you</Text>
          </View>
        </View>
        {articles.map((article) => (
          <TouchableOpacity key={article.id} style={styles.articleCard}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleSource}>{article.source}</Text>
            <Text style={styles.articleSummary}>{article.summary}</Text>
            {article.aiSummary && (
              <View style={styles.aiSummaryContainer}>
                <Text style={styles.aiSummaryLabel}>AI Summary:</Text>
                <Text style={styles.aiSummaryText}>{article.aiSummary}</Text>
              </View>
            )}
            <Text style={styles.articleDate}>
              {new Date(article.publishedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
        
        {articles.length === 0 && !isLoading && (
          <View style={styles.section}>
            <Text style={styles.emptyText}>Loading research articles...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.surface,
    margin: 10,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleCard: {
    backgroundColor: Colors.surface,
    margin: 10,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  articleSource: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  aiSummaryContainer: {
    backgroundColor: Colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  aiSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  aiSummaryText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  articleDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontStyle: 'italic',
    padding: 20,
  },
});
