import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import EmptyState from '../components/common/EmptyState';
import { getVehicleIcon } from '../utils/vehicleIcons';
import SelectSheet from '../components/common/SelectSheet';

export default function VehiclesScreen({ 
  vehicles, 
  isLoading,
  onSaveVehicle,
  onRefreshVehicles,
  token,
  apiUrl
}: { 
  vehicles: any[], 
  isLoading?: boolean,
  onSaveVehicle: (vehicle: any) => Promise<void>,
  onRefreshVehicles?: () => void,
  token: string | null,
  apiUrl: string
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [vName, setVName] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vType, setVType] = useState('bike');
  const [vDriverId, setVDriverId] = useState('');
  const [vPaymentAmount, setVPaymentAmount] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);

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
          if (Array.isArray(data)) {
              setDrivers(data);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const openAdd = () => {
    setEditVehicle(null);
    setVName('');
    setVPlate('');
    setVType('bike');
    setVDriverId('');
    setVPaymentAmount('');
    setModalVisible(true);
  };

  const openEdit = (vehicle: any) => {
    setEditVehicle(vehicle);
    setVName(vehicle.name);
    setVPlate(vehicle.license_plate);
    setVType(vehicle.vehicle_type || 'bike');
    setVDriverId(vehicle.driver_id ? vehicle.driver_id.toString() : '');
    setVPaymentAmount(vehicle.driver_payment_amount ? vehicle.driver_payment_amount.toString() : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const data: any = { id: editVehicle?.id, name: vName, license_plate: vPlate, vehicle_type: vType };
    if (vDriverId) data.driver_id = vDriverId;
    if (vPaymentAmount) data.driver_payment_amount = vPaymentAmount;

    await onSaveVehicle(data);
    setModalVisible(false);
  };
  
  const handleDeleteVehicle = (vehicle: any) => {
    Alert.alert('Delete Vehicle', `Are you sure you want to delete ${vehicle.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${apiUrl}/vehicles/${vehicle.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
              const resData = await res.json();
              throw new Error(resData.message || 'Failed to delete vehicle');
            }
            if (onRefreshVehicles) {
              onRefreshVehicles();
            }
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  };
  
  const getSelectedDriverName = () => {
    if (!vDriverId) return 'Select a driver...';
    const driver = drivers.find(d => d.id.toString() === vDriverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const getDriverName = (driverId: any) => {
    if (!driverId) return 'None';
    const driver = drivers.find(d => d.id.toString() === driverId.toString());
    return driver ? driver.name : 'Unknown Driver';
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Vehicles"
        subtitle="Add vehicles, assign drivers, and set the daily payment."
        action={
          <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.cardContainer}>
        <FlatList
          data={vehicles}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState
                icon="🚛"
                title="No vehicles yet"
                message="Tap Add to register the first vehicle in your ReadyRide fleet."
              />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: palette.gray100 }]}>
                <Text style={{ fontSize: 22 }}>{getVehicleIcon(item.vehicle_type)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.license_plate}</Text>
                </View>
                <Text style={styles.cardSub}>Driver: {getDriverName(item.driver_id)}</Text>
                <Text style={styles.cardSub}>Daily payment: Rs. {item.driver_payment_amount || '0.00'}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, styles.editBtn]} onPress={() => openEdit(item)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`}>
                  <Text style={styles.actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteBtn]} onPress={() => handleDeleteVehicle(item)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`}>
                  <Text style={styles.actionIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <SelectSheet
        visible={driverModalVisible}
        title="Select driver"
        selectedId={vDriverId}
        onSelect={setVDriverId}
        onClose={() => setDriverModalVisible(false)}
        options={[
          {id: '', label: 'None'},
          ...drivers.map(driver => ({
            id: driver.id.toString(),
            label: `${driver.name} (ID: ${driver.id})`,
          })),
        ]}
      />

      {/* Add/Edit Vehicle Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editVehicle ? 'Edit vehicle' : 'Add vehicle'}</Text>
            <Text style={styles.modalHint}>Name and plate are required. Driver assignment is optional.</Text>
            
            <Text style={styles.label}>Vehicle name</Text>
            <TextInput style={styles.input} placeholder="e.g. Ford Transit" placeholderTextColor={palette.textMuted} value={vName} onChangeText={setVName} />
            
            <Text style={styles.label}>License plate</Text>
            <TextInput style={styles.input} placeholder="e.g. ABC-123" placeholderTextColor={palette.textMuted} value={vPlate} onChangeText={setVPlate} autoCapitalize="characters" />

            <Text style={styles.label}>Vehicle type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['bike', 'car', 'threewheeler', 'van', 'other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, vType === type && styles.typePillActive]}
                    onPress={() => setVType(type)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.typePillText, vType === type && styles.typePillTextActive]}>
                      {type === 'threewheeler' ? 'Three-Wheeler' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <Text style={styles.label}>Assign driver</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setDriverModalVisible(true)}>
                <Text style={[styles.dropdownButtonText, !vDriverId && { color: palette.textMuted }]}>
                    {getSelectedDriverName()}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            
            <Text style={styles.label}>Driver daily payment</Text>
            <TextInput style={styles.input} placeholder="e.g. 50.00" placeholderTextColor={palette.textMuted} value={vPaymentAmount} onChangeText={setVPaymentAmount} keyboardType="numeric" />
            
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
  avatar: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: palette.primaryStrong, fontSize: 18, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: palette.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
  cardSub: { fontSize: 13, color: palette.textSecondary, marginTop: 4, fontWeight: '500' },

  pill: { backgroundColor: palette.gray100, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.gray200 },
  pillText: { fontSize: 12, fontWeight: '700', color: palette.gray700, letterSpacing: 0.3 },

  typePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface },
  typePillActive: { backgroundColor: palette.textPrimary, borderColor: palette.textPrimary },
  typePillText: { fontSize: 13, fontWeight: '700', color: palette.textSecondary },
  typePillTextActive: { color: palette.primary },

  actionRow: { flexDirection: 'row', gap: 6 },
  actionButton: { width: 34, height: 34, borderRadius: radii.md, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  editBtn: { backgroundColor: palette.info + '15', borderColor: palette.info + '30' },
  deleteBtn: { backgroundColor: palette.danger + '15', borderColor: palette.danger + '30' },
  actionIcon: { fontSize: 14 },

  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: `${palette.textPrimary}70`, padding: spacing.lg },
  modalContent: { backgroundColor: palette.surface, padding: spacing.xl, borderRadius: radii.xl, borderWidth: 1.5, borderColor: palette.border, ...require('../theme/shape').shadowPresets.card },
  modalTitle: { fontSize: 22, fontWeight: '800', color: palette.textPrimary, marginBottom: spacing.xs, letterSpacing: -0.3 },
  modalHint: { fontSize: 14, lineHeight: 20, color: palette.textSecondary, marginBottom: spacing.xl, fontWeight: '400' },

  label: { color: palette.textSecondary, fontSize: 13, fontWeight: '800', marginBottom: spacing.xs, marginLeft: 2, letterSpacing: 0.5 },
  input: { backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, padding: spacing.md, fontSize: 16, fontWeight: '500', color: palette.textPrimary, marginBottom: spacing.lg },

  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: palette.gray50, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  dropdownButtonText: { fontSize: 16, color: palette.textPrimary, fontWeight: '500' },
  dropdownIcon: { fontSize: 12, color: palette.textSecondary },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  cancelButton: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.pill, backgroundColor: palette.gray100 },
  cancelButtonText: { color: palette.gray700, fontSize: 15, fontWeight: '700' },
  saveButton: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: radii.pill, backgroundColor: palette.primary },
  saveButtonText: { color: palette.textPrimary, fontSize: 15, fontWeight: '800' },
});
