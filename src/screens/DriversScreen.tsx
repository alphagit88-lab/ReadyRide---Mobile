import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import EmptyState from '../components/common/EmptyState';

export default function DriversScreen({ token, apiUrl }: { token: string | null, apiUrl: string }) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
        fetchDrivers();
    }
  }, [token]);

  const fetchDrivers = async () => {
    try {
        const res = await fetch(`${apiUrl}/drivers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error(err);
    }
  };

  const openAdd = () => {
    setEditDriver(null);
    setName('');
    setEmail('');
    setPassword('');
    setModalVisible(true);
  };

  const openEdit = (driver: any) => {
    setEditDriver(driver);
    setName(driver.name);
    setEmail(driver.email);
    setPassword('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !email || (!editDriver && !password)) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
    }
    try {
        const url = editDriver ? `${apiUrl}/drivers/${editDriver.id}` : `${apiUrl}/drivers`;
        const method = editDriver ? 'PUT' : 'POST';
        const body: any = { name, email };
        if (password) body.password = password;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to save driver');
        }

        setModalVisible(false);
        fetchDrivers();
    } catch (err: any) {
        Alert.alert('Error', err.message || 'Something went wrong');
    }
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
            <EmptyState
              icon="👤"
              title="No drivers yet"
              message="Add a driver to give them access to ReadyRide payments."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || 'D').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => openEdit(item)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editDriver ? 'Edit driver' : 'Add driver'}</Text>
            <Text style={styles.modalHint}>
              {editDriver ? 'Leave password blank to keep the current one.' : 'The driver will sign in with this email and password.'}
            </Text>
            
            <Text style={styles.label}>Driver name</Text>
            <TextInput style={styles.input} placeholder="e.g. John Doe" placeholderTextColor={palette.textMuted} value={name} onChangeText={setName} />
            
            <Text style={styles.label}>Email address</Text>
            <TextInput style={styles.input} placeholder="e.g. john@example.com" placeholderTextColor={palette.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            
            <Text style={styles.label}>{editDriver ? 'New password (optional)' : 'Password'}</Text>
            <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor={palette.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.textPrimary }, // Dark background behind header
  cardContainer: {
    flex: 1,
    backgroundColor: palette.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -8, // slight overlap adjustment since ScreenHeader has -40
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    zIndex: 10,
    ...require('../theme/shape').shadowPresets.card,
  },

  addButton: { backgroundColor: palette.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, minHeight: 40, justifyContent: 'center' },
  addButtonText: { color: palette.textPrimary, fontSize: 14, fontWeight: '800' },

  listContent: { paddingBottom: 100, paddingHorizontal: 0, flexGrow: 1 },
  card: { backgroundColor: palette.surface, padding: spacing.lg, marginBottom: spacing.md, borderRadius: radii.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: palette.border, ...require('../theme/shape').shadowPresets.soft },
  avatar: { width: 48, height: 48, borderRadius: radii.pill, backgroundColor: palette.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: palette.accent, fontSize: 18, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: palette.textPrimary, marginBottom: 4, letterSpacing: -0.3 },

  pill: { backgroundColor: palette.gray100, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.gray200 },
  pillText: { fontSize: 12, fontWeight: '700', color: palette.gray700, letterSpacing: 0.3 },

  editButton: { backgroundColor: palette.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 2, borderColor: palette.border },
  editButtonText: { color: palette.primaryStrong, fontSize: 14, fontWeight: '800' },

  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: `${palette.textPrimary}70`, padding: spacing.lg },
  modalContent: { backgroundColor: palette.surface, padding: spacing.xl, borderRadius: radii.xl, borderWidth: 1.5, borderColor: palette.border, ...require('../theme/shape').shadowPresets.card },
  modalTitle: { fontSize: 22, fontWeight: '800', color: palette.textPrimary, marginBottom: spacing.xs, letterSpacing: -0.3 },
  modalHint: { fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: spacing.xl, fontWeight: '400' },

  label: { color: palette.textSecondary, fontSize: 13, fontWeight: '800', marginBottom: spacing.xs, marginLeft: 2, letterSpacing: 0.5 },
  input: { backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, padding: spacing.md, fontSize: 16, fontWeight: '500', color: palette.textPrimary, marginBottom: spacing.lg },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  cancelButton: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.pill, backgroundColor: palette.gray100 },
  cancelButtonText: { color: palette.gray700, fontSize: 15, fontWeight: '700' },
  saveButton: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.pill, backgroundColor: palette.primary },
  saveButtonText: { color: palette.textPrimary, fontSize: 15, fontWeight: '800' },
});
