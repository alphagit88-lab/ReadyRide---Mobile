import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';

export default function SettingsScreen({ token, apiUrl }: { token: string | null; apiUrl: string }) {
  const [conditions, setConditions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setConditions(data.conditions ?? '');
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccessfully(false);
    try {
      const res = await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: 'conditions', value: conditions }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save');
      }
      setSavedSuccessfully(true);
      setTimeout(() => setSavedSuccessfully(false), 3000);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Settings"
        subtitle="Manage company-wide configurations."
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.body}
        keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📋</Text>
                <View>
                  <Text style={styles.sectionTitle}>Driver Conditions</Text>
                  <Text style={styles.sectionSubtitle}>Visible to all drivers under your company.</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.label}>Conditions Text</Text>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={12}
                  textAlignVertical="top"
                  placeholder="Enter your conditions, rules, or terms here…"
                  placeholderTextColor={palette.textMuted}
                  value={conditions}
                  onChangeText={text => {
                    setConditions(text);
                    setSavedSuccessfully(false);
                  }}
                />
                <Text style={styles.charCount}>{conditions.length} characters</Text>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={palette.textPrimary} />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {savedSuccessfully ? '✓ Saved!' : 'Save Conditions'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionIcon: { fontSize: 28 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: palette.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.4,
  },
  textarea: {
    backgroundColor: palette.gray50,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 15,
    fontWeight: '500',
    color: palette.textPrimary,
    minHeight: 220,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  saveBtn: {
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveBtnText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});
