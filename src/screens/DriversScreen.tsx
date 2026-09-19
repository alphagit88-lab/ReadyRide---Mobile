import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Linking, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import EmptyState from '../components/common/EmptyState';
import DocumentPicker from 'react-native-document-picker';
import ImageViewer from '../components/common/ImageViewer';

const DRIVER_DOCS = [
  { key: 'driving_license', label: 'Driving License Copy' },
  { key: 'nic', label: 'NIC Copy' },
  { key: 'police_verification', label: 'Police/Gov Verification' },
  { key: 'proof_of_address', label: 'Proof of Address (Utility Bill)' },
  { key: 'passport_photo_1', label: 'Passport Size Photo 1' },
  { key: 'passport_photo_2', label: 'Passport Size Photo 2' },
];

const GUARANTOR_DOCS = [
  { key: 'guarantor_declaration', label: 'Guarantor Declaration' },
  { key: 'guarantor_nic', label: "Guarantor's NIC Copy" },
  { key: 'guarantor_proof_of_address', label: "Guarantor's Proof of Address" },
];

export default function DriversScreen({ token, apiUrl }: { token: string | null, apiUrl: string }) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'documents'>('basic');
  const [editDriver, setEditDriver] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [paymentTime, setPaymentTime] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // Step 2 docs: key -> { uri, name, type }
  const [docFiles, setDocFiles] = useState<Record<string, any>>({});
  const [newDriverId, setNewDriverId] = useState<number | null>(null);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [loadingDocIndex, setLoadingDocIndex] = useState<number | null>(null);

  useEffect(() => {
    if (token) fetchDrivers();
  }, [token]);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const formatTimeDisplay = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const openAdd = () => {
    setEditDriver(null); setName(''); setEmail(''); setPassword('');
    setStartDate(null); setPaymentTime(null); setDocFiles({}); setNewDriverId(null);
    setActiveTab('basic'); setModalVisible(true);
  };

  const openEdit = (driver: any) => {
    setEditDriver(driver); setName(driver.name || ''); setEmail(driver.email || ''); setPassword('');
    setStartDate(driver.start_date ? new Date(driver.start_date) : null);
    setPaymentTime(driver.payment_time ? (() => { const d = new Date(); const [h, m] = driver.payment_time.split(':'); d.setHours(+h, +m); return d; })() : null);
    setActiveTab('basic'); setDocFiles({}); setNewDriverId(null); setModalVisible(true);
  };



  const pickDoc = async (docKey: string, method: 'camera' | 'gallery' | 'pdf') => {
    try {
      if (method === 'camera') {
        const { launchCamera } = require('react-native-image-picker');
        launchCamera({ mediaType: 'photo', quality: 0.85, saveToPhotos: false }, (response: any) => {
          if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
            const asset = response.assets[0];
            setDocFiles(prev => ({ ...prev, [docKey]: { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.type || 'image/jpeg' } }));
          }
        });
      } else if (method === 'gallery') {
        const res = await DocumentPicker.pick({ type: [DocumentPicker.types.images], allowMultiSelection: false });
        setDocFiles(prev => ({ ...prev, [docKey]: res[0] }));
      } else {
        const res = await DocumentPicker.pick({ type: [DocumentPicker.types.pdf], allowMultiSelection: false });
        setDocFiles(prev => ({ ...prev, [docKey]: res[0] }));
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) console.error(err);
    }
  };

  const handleUploadDocs = async () => {
    if (!name || !email || (!editDriver && !password)) {
      setActiveTab('basic');
      Alert.alert('Error', 'Please fill in all required fields (Name, Email' + (!editDriver ? ', Password' : '') + ').');
      return;
    }

    const entries = Object.entries(docFiles).filter(([_, f]) => f);

    // Validate required docs for NEW driver only
    if (!editDriver) {
      const allRequiredKeys = [...DRIVER_DOCS, ...GUARANTOR_DOCS].map(d => d.key);
      const missingDocs = allRequiredKeys.filter(k => !docFiles[k]);
      if (missingDocs.length > 0) {
        Alert.alert('Required Documents', 'Please upload all driver and guarantor documents before saving.');
        setActiveTab('documents');
        return;
      }
    }

    setIsUploading(true);
    try {
      // 1. Create or Update Driver
      const body: any = { name, email };
      if (password) body.password = password;
      if (startDate) body.start_date = startDate.toISOString().split('T')[0];
      if (paymentTime) body.payment_time = formatTime(paymentTime);

      const url = editDriver ? `${apiUrl}/drivers/${editDriver.id}` : `${apiUrl}/drivers`;
      const method = editDriver ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save driver');
      }

      const savedDriver = await res.json();
      const targetDriverId = editDriver ? editDriver.id : savedDriver.id;

      // 2. Upload documents one by one to avoid corruption/timeout
      for (const [docKey, file] of entries) {
        const formData = new FormData();
        formData.append(`documents[0][type]`, docKey);
        formData.append(`documents[0][file]`, { uri: file.uri, name: file.name, type: file.type || 'application/octet-stream' } as any);

        const docRes = await fetch(`${apiUrl}/drivers/${targetDriverId}/documents`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (!docRes.ok) {
          console.warn(`Failed to upload ${docKey}`);
        }
      }

      setModalVisible(false);
      fetchDrivers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDriver = (driver: any) => {
    Alert.alert('Delete Driver', `Are you sure you want to delete ${driver.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${apiUrl}/drivers/${driver.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Failed to delete driver'); }
            fetchDrivers();
          } catch (err: any) { Alert.alert('Error', err.message); }
        }
      }
    ]);
  };

  const DocUploadRow = ({ docKey, label }: { docKey: string; label: string }) => {
    const file = docFiles[docKey];
    return (
      <View style={styles.docRow}>
        <Text style={[styles.docLabel, file && { color: palette.primaryStrong }]}>{file ? '✅ ' : ''}{label}</Text>
        {file && <Text style={styles.docFileName} numberOfLines={1}>{file.name}</Text>}
        <View style={styles.docIconRow}>
          <TouchableOpacity style={[styles.docIconBtn, isUploading && { opacity: 0.5 }]} onPress={() => pickDoc(docKey, 'camera')} activeOpacity={0.8} disabled={isUploading}>
            <Text style={styles.docIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.docIconBtn, isUploading && { opacity: 0.5 }]} onPress={() => pickDoc(docKey, 'gallery')} activeOpacity={0.8} disabled={isUploading}>
            <Text style={styles.docIcon}>🖼️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.docIconBtn, isUploading && { opacity: 0.5 }]} onPress={() => pickDoc(docKey, 'pdf')} activeOpacity={0.8} disabled={isUploading}>
            <Text style={styles.docIcon}>📄</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Drivers"
        subtitle="Create driver logins and keep contact details up to date."
        action={
          <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.cardContainer}>
        <FlatList
          data={drivers}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState icon="👤" title="No drivers yet" message="Add a driver to give them access to ReadyRide payments." />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || 'D').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.pill}><Text style={styles.pillText}>{item.email}</Text></View>
                {(item.start_date || item.payment_time) && (
                  <View style={styles.metaRow}>
                    {item.start_date && <Text style={styles.metaText}>📅 {item.start_date}</Text>}
                    {item.payment_time && <Text style={styles.metaText}>⏰ Due {item.payment_time.slice(0, 5)}</Text>}
                  </View>
                )}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, styles.editBtn]} onPress={() => openEdit(item)} activeOpacity={0.85}>
                  <Text style={styles.actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteBtn]} onPress={() => handleDeleteDriver(item)} activeOpacity={0.85}>
                  <Text style={styles.actionIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editDriver ? 'Edit driver' : 'Add driver'}</Text>
              <Text style={styles.modalHint}>Enter details and upload required documents.</Text>

              <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'basic' && styles.tabBtnActive]} onPress={() => setActiveTab('basic')}>
                  <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>Basic Info</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]} onPress={() => setActiveTab('documents')}>
                  <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Documents</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'basic' ? (
                <>
                  <Text style={styles.label}>Driver name</Text>
                  <TextInput style={styles.input} placeholder="e.g. John Doe" placeholderTextColor={palette.textMuted} value={name} onChangeText={setName} />

                  <Text style={styles.label}>Email address</Text>
                  <TextInput style={styles.input} placeholder="e.g. john@example.com" placeholderTextColor={palette.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

                  <Text style={styles.label}>{editDriver ? 'New password (optional)' : 'Password'}</Text>
                  <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor={palette.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

                  <Text style={styles.label}>Start date</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStartDatePicker(true)}>
                    <Text style={styles.pickerBtnText}>{startDate ? formatDate(startDate) : 'Select start date'}</Text>
                    <Text style={styles.pickerBtnIcon}>📅</Text>
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker value={startDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, d) => { setShowStartDatePicker(false); if (d) setStartDate(d); }} />
                  )}

                  <Text style={styles.label}>Daily payment due time</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                    <Text style={styles.pickerBtnText}>{paymentTime ? formatTimeDisplay(paymentTime) : 'Select due time'}</Text>
                    <Text style={styles.pickerBtnIcon}>⏰</Text>
                  </TouchableOpacity>
                  {showTimePicker && (
                    <DateTimePicker value={paymentTime || new Date()} mode="time" is24Hour={false} display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, d) => { setShowTimePicker(false); if (d) setPaymentTime(d); }} />
                  )}

                  {editDriver?.documents && editDriver.documents.length > 0 && (
                    <View style={{ marginTop: spacing.lg }}>
                      <Text style={styles.sectionHeader}>Uploaded Documents</Text>
                      {(() => {
                        const orderedKeys = [...DRIVER_DOCS, ...GUARANTOR_DOCS].map(d => d.key);
                        const sortedDocs = [...editDriver.documents].sort((a: any, b: any) => orderedKeys.indexOf(a.document_type) - orderedKeys.indexOf(b.document_type));
                        const allDocsMap = Object.fromEntries([...DRIVER_DOCS, ...GUARANTOR_DOCS].map(d => [d.key, d.label]));

                        return sortedDocs.map((doc: any, i: number) => {
                          const label = allDocsMap[doc.document_type] || doc.document_type;
                          const fullUrl = apiUrl.replace('/api', '') + '/storage/' + doc.file_path;
                          return (
                            <View key={i} style={styles.uploadedDocRow}>
                              <Text style={[styles.docLabel, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>{label}</Text>
                              <TouchableOpacity 
                                style={{ minWidth: 60, alignItems: 'flex-end', paddingVertical: 4 }} 
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
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: palette.primaryStrong }}>View</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        });
                      })()}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.sectionHeader}>Driver Documents</Text>
                  {DRIVER_DOCS.map(doc => <DocUploadRow key={doc.key} docKey={doc.key} label={doc.label} />)}

                  <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>Guarantor Documents</Text>
                  {GUARANTOR_DOCS.map(doc => <DocUploadRow key={doc.key} docKey={doc.key} label={doc.label} />)}
                </>
              )}

              <View style={[styles.modalActions, { marginTop: spacing.xl }]}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)} disabled={isUploading}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, isUploading && { opacity: 0.6 }]} onPress={handleUploadDocs} disabled={isUploading}>
                  <Text style={styles.saveButtonText}>{isUploading ? 'Saving...' : 'Save Driver'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ImageViewer uri={selectedDocUrl} onClose={() => setSelectedDocUrl(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.textPrimary },
  cardContainer: {
    flex: 1, backgroundColor: palette.background, borderTopLeftRadius: 8, borderTopRightRadius: 8,
    marginTop: -8, paddingTop: spacing.xl, paddingHorizontal: spacing.xl, zIndex: 10,
    ...require('../theme/shape').shadowPresets.card,
  },
  addButton: { backgroundColor: palette.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md, minHeight: 40, justifyContent: 'center' },
  addButtonText: { color: palette.textPrimary, fontSize: 14, fontWeight: '800' },
  listContent: { paddingBottom: 100, paddingHorizontal: 0, flexGrow: 1 },
  card: { backgroundColor: palette.surface, padding: spacing.lg, marginBottom: spacing.md, borderRadius: radii.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: palette.border, ...require('../theme/shape').shadowPresets.soft },
  avatar: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: palette.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: palette.accent, fontSize: 18, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: palette.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  metaText: { fontSize: 12, color: palette.textMuted, fontWeight: '600' },
  pill: { backgroundColor: palette.gray100, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.gray200 },
  pillText: { fontSize: 12, fontWeight: '700', color: palette.gray700, letterSpacing: 0.3 },
  actionRow: { flexDirection: 'row', gap: 6 },
  actionButton: { width: 34, height: 34, borderRadius: radii.md, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  editBtn: { backgroundColor: palette.info + '15', borderColor: palette.info + '30' },
  deleteBtn: { backgroundColor: palette.danger + '15', borderColor: palette.danger + '30' },
  actionIcon: { fontSize: 14 },

  tabContainer: { flexDirection: 'row', marginBottom: spacing.lg, backgroundColor: palette.gray50, borderRadius: radii.md, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.sm },
  tabBtnActive: { backgroundColor: palette.surface, ...require('../theme/shape').shadowPresets.soft },
  tabText: { fontSize: 14, fontWeight: '600', color: palette.textMuted },
  tabTextActive: { color: palette.primaryStrong, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: `${palette.textPrimary}70`, padding: spacing.lg },
  modalContent: { backgroundColor: palette.surface, padding: spacing.xl, borderRadius: radii.md, borderWidth: 1.5, borderColor: palette.border, ...require('../theme/shape').shadowPresets.card },
  modalTitle: { fontSize: 22, fontWeight: '800', color: palette.textPrimary, marginBottom: spacing.xs, letterSpacing: -0.3 },
  modalHint: { fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: spacing.xl, fontWeight: '400' },
  label: { color: palette.textSecondary, fontSize: 13, fontWeight: '800', marginBottom: spacing.xs, marginLeft: 2, letterSpacing: 0.5 },
  input: { backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.md, padding: spacing.md, fontSize: 16, fontWeight: '500', color: palette.textPrimary, marginBottom: spacing.lg },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
  pickerBtnText: { fontSize: 15, fontWeight: '600', color: palette.textPrimary },
  pickerBtnIcon: { fontSize: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  cancelButton: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.md, backgroundColor: palette.gray100 },
  cancelButtonText: { color: palette.gray700, fontSize: 15, fontWeight: '700' },
  saveButton: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.md, backgroundColor: palette.primary },
  saveButtonText: { color: palette.textPrimary, fontSize: 15, fontWeight: '800' },

  // Step 2 Doc Uploads
  sectionHeader: { fontSize: 13, fontWeight: '900', color: palette.textPrimary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm, borderBottomWidth: 1.5, borderBottomColor: palette.border, paddingBottom: spacing.xs },
  docRow: { marginBottom: spacing.md },
  docLabel: { fontSize: 13, fontWeight: '700', color: palette.textSecondary, marginBottom: 6 },
  docFileName: { fontSize: 12, color: palette.primaryStrong, fontWeight: '600', marginBottom: 6 },
  docIconRow: { flexDirection: 'row', gap: 8 },
  docIconBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.gray200, borderStyle: 'dashed', borderRadius: radii.md, paddingVertical: 10, minHeight: 40 },
  docIcon: { fontSize: 16 },
  uploadedDocRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border },
});
