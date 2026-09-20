import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator, Linking, Image } from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import ImageViewer from '../components/common/ImageViewer';

export default function AccountScreen({ token, apiUrl }: { token: string | null, apiUrl: string }) {

  const formatTime = (time: string) => {
    if (!time) return time;
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(hour12).padStart(2, '0')}:${minute} ${ampm}`;
  };

  const [profile, setProfile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [loadingDocIndex, setLoadingDocIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'documents'>('basic');
  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password, password_confirmation: passwordConfirmation })
      });

      const data = await res.json(); console.log(data)
      if (!res.ok) throw new Error(data.message || 'Failed to update password');

      Alert.alert('Success', 'Password updated successfully');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Account"
        subtitle="View your profile and update your password."
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardContainer}
        keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View style={{ paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : profile ? (
            <>
              <View style={styles.card}>
                <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(profile.name || 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{profile.name}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{profile.email}</Text>
              </View>

              <View style={[styles.tabContainer, { width: '100%', marginTop: spacing.md }]}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'basic' && styles.tabBtnActive]} onPress={() => setActiveTab('basic')}>
                  <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>Basic Info</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]} onPress={() => setActiveTab('documents')}>
                  <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Documents</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'basic' ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Type</Text>
                    <Text style={styles.infoValue}>{profile.role === 'company' ? 'Company Admin' : 'Driver'}</Text>
                  </View>
                  {profile.start_date && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Start Date</Text>
                      <Text style={styles.infoValue}>{profile.start_date}</Text>
                    </View>
                  )}
                  {profile.payment_time && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Payment Time</Text>
                      <Text style={[styles.infoValue, { textTransform: 'uppercase' }]}>{formatTime(profile.payment_time)}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={{ width: '100%' }}>
                  {(() => {
                    const renderDocs = (keys: string[], title: string) => {
                      const docs = (profile.documents || []).filter((d: any) => keys.includes(d.document_type));
                      if (docs.length === 0) return null;
                      const sortedDocs = [...docs].sort((a: any, b: any) => keys.indexOf(a.document_type) - keys.indexOf(b.document_type));
                      
                      return (
                        <View style={{ marginBottom: spacing.lg }}>
                          <Text style={[styles.infoLabel, { marginBottom: spacing.sm, marginLeft: 4 }]}>{title}</Text>
                          <View style={{ backgroundColor: palette.gray50, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, padding: spacing.sm }}>
                            {sortedDocs.map((doc: any, i: number) => {
                              const label = doc.document_type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                              const fullUrl = apiUrl.replace('/api', '') + '/storage/' + doc.file_path;
                              return (
                                <View key={i} style={[styles.infoRow, i === 0 && { borderTopWidth: 0, paddingTop: 0 }, i === sortedDocs.length - 1 && { paddingBottom: 0 }]}>
                                  <Text style={styles.infoLabel}>{label}</Text>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      setLoadingDocIndex(i);
                                      if (fullUrl.toLowerCase().endsWith('.pdf')) {
                                        await Linking.openURL(fullUrl);
                                        setLoadingDocIndex(null);
                                      } else {
                                        await Image.prefetch(fullUrl).catch(() => {});
                                        setSelectedDocUrl(fullUrl);
                                        setLoadingDocIndex(null);
                                      }
                                    }}
                                  >
                                    {loadingDocIndex === i ? (
                                      <ActivityIndicator size="small" color={palette.primaryStrong} />
                                    ) : (
                                      <Text style={[styles.infoValue, { color: palette.primaryStrong }]}>View</Text>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    };

                    const DRIVER_KEYS = ['driving_license', 'nic', 'police_verification', 'proof_of_address', 'passport_photo_1', 'passport_photo_2'];
                    const GUARANTOR_KEYS = ['guarantor_declaration', 'guarantor_nic', 'guarantor_proof_of_address'];

                    const driverContent = renderDocs(DRIVER_KEYS, 'Driver Documents');
                    const guarantorContent = renderDocs(GUARANTOR_KEYS, 'Guarantor Documents');

                    if (!driverContent && !guarantorContent) {
                      return <Text style={{ color: palette.textMuted, textAlign: 'center', marginVertical: spacing.lg }}>No documents uploaded.</Text>;
                    }

                    return (
                      <>
                        {driverContent}
                        {guarantorContent}
                      </>
                    );
                  })()}
                </View>
              )}
            </View>

            {activeTab === 'basic' && (
              <>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <View style={styles.formCard}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor={palette.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />

                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor={palette.textMuted}
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry
                  />

                  <TouchableOpacity
                    style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                    onPress={handleUpdatePassword}
                    disabled={isSaving}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ImageViewer uri={selectedDocUrl} onClose={() => setSelectedDocUrl(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.textPrimary },
  cardContainer: {
    flex: 1,
    backgroundColor: palette.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: -8,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    zIndex: 10,
    ...require('../theme/shape').shadowPresets.card,
  },
  scrollContent: { paddingBottom: 100 },
  card: {
    backgroundColor: palette.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
    marginBottom: spacing.xl
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { color: palette.primaryStrong, fontSize: 36, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', color: palette.textPrimary, marginBottom: spacing.xs },
  pill: { backgroundColor: palette.gray100, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.gray200, marginBottom: spacing.lg },
  pillText: { fontSize: 13, fontWeight: '700', color: palette.gray700 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: palette.border },
  infoLabel: { fontSize: 14, color: palette.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 14, color: palette.textPrimary, fontWeight: '700', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: palette.textPrimary, marginBottom: spacing.md, marginLeft: 4 },
  formCard: { backgroundColor: palette.surface, padding: spacing.xl, borderRadius: radii.xl, borderWidth: 2, borderColor: palette.border },
  label: { color: palette.textSecondary, fontSize: 13, fontWeight: '800', marginBottom: spacing.xs, marginLeft: 2, letterSpacing: 0.5 },
  input: { backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.md, padding: spacing.md, fontSize: 16, fontWeight: '500', color: palette.textPrimary, marginBottom: spacing.lg },
  saveButton: { backgroundColor: palette.primary, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.md, marginTop: spacing.sm },
  saveButtonText: { color: palette.textPrimary, fontSize: 15, fontWeight: '800' },
  tabContainer: { flexDirection: 'row', backgroundColor: palette.gray100, borderRadius: radii.pill, padding: 4, marginBottom: spacing.xl, borderWidth: 1, borderColor: palette.gray200 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.pill },
  tabBtnActive: { backgroundColor: palette.surface, ...require('../theme/shape').shadowPresets.sm },
  tabText: { fontSize: 14, fontWeight: '700', color: palette.textSecondary },
  tabTextActive: { color: palette.textPrimary, fontWeight: '800' },
});
