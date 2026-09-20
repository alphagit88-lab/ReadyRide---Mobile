import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';

export default function ConditionsScreen({ token, apiUrl }: { token: string | null; apiUrl: string }) {
  const [conditions, setConditions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConditions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setConditions(data.conditions ?? '');
    } catch (err) {
      console.error('Failed to fetch conditions', err);
      setConditions('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchConditions();
  }, [token]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Conditions"
        subtitle="Terms and rules set by your company."
      />

      <View style={styles.body}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {conditions && conditions.trim().length > 0 ? (
                <Text style={styles.conditionsText}>{conditions}</Text>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyTitle}>No conditions set</Text>
                  <Text style={styles.emptySubtitle}>
                    Your company hasn't published any conditions yet.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.textPrimary },
  body: {
    flex: 1,
    backgroundColor: palette.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: -8,
    zIndex: 10,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.gray50,
  },
  cardHeaderIcon: { fontSize: 18 },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  conditionsText: {
    fontSize: 15,
    color: palette.textPrimary,
    fontWeight: '500',
    lineHeight: 24,
    padding: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
