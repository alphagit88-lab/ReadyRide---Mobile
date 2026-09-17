import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import EmptyState from '../components/common/EmptyState';
import SelectSheet from '../components/common/SelectSheet';

export default function PaymentsScreen({
  token,
  apiUrl,
  user,
  onPayPress,
}: {
  token: string | null;
  apiUrl: string;
  user: any;
  onPayPress: () => void;
}) {
  const [payments, setPayments] = useState<any[]>([]);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDriverId, setFilterDriverId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchPayments();
      if (user?.role === 'company') {
        fetchVehiclesAndDrivers();
      }
    }
  }, [token, filterVehicleId, filterDriverId]);

  const fetchVehiclesAndDrivers = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        fetch(`${apiUrl}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/drivers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const vData = await vRes.json();
      const dData = await dRes.json();
      if (Array.isArray(vData)) setVehicles(vData);
      if (Array.isArray(dData)) setDrivers(dData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      let url = `${apiUrl}/payments?`;
      if (filterVehicleId) {
        url += `vehicle_id=${filterVehicleId}&`;
      }
      if (filterDriverId) {
        url += `driver_id=${filterDriverId}&`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/payments/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) {
        fetchPayments();
        Alert.alert('Success', 'Payment approved');
      } else {
        Alert.alert('Error', 'Failed to approve payment');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const getSelectedVehicleName = () => {
    if (!filterVehicleId) return 'All vehicles';
    const v = vehicles.find(item => item.id.toString() === filterVehicleId);
    return v ? `${v.name} (${v.license_plate})` : 'Unknown Vehicle';
  };

  const getSelectedDriverName = () => {
    if (!filterDriverId) return 'All drivers';
    const d = drivers.find(item => item.id.toString() === filterDriverId);
    return d ? d.name : 'Unknown Driver';
  };

  const getVehicleName = (id: any) => {
    if (!id) return 'Unknown';
    const v = vehicles.find(item => item.id.toString() === id.toString());
    return v ? v.name : `ID: ${id}`;
  };

  const getDriverName = (id: any) => {
    if (!id) return 'Unknown';
    const d = drivers.find(item => item.id.toString() === id.toString());
    return d ? d.name : `ID: ${id}`;
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Payments"
        subtitle={
          user?.role === 'driver'
            ? 'Review your submissions and send a new payment from the dashboard.'
            : 'Filter records, review slips, and approve pending payments.'
        }
        action={
          user?.role === 'driver' ? (
            <TouchableOpacity style={styles.payButton} onPress={onPayPress} activeOpacity={0.85}>
              <Text style={styles.payButtonText}>Pay now</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.cardContainer}>
        {user?.role === 'company' && (
          <View style={styles.filterBlock}>
            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.filterDropdownButton} onPress={() => setVehicleModalVisible(true)}>
                <Text style={[styles.filterDropdownButtonText, !filterVehicleId && { color: palette.textMuted }]} numberOfLines={1}>
                  {getSelectedVehicleName()}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterDropdownButton} onPress={() => setDriverModalVisible(true)}>
                <Text style={[styles.filterDropdownButtonText, !filterDriverId && { color: palette.textMuted }]} numberOfLines={1}>
                  {getSelectedDriverName()}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
            {(filterVehicleId || filterDriverId) ? (
              <TouchableOpacity
                style={styles.clearFilters}
                onPress={() => {
                  setFilterVehicleId('');
                  setFilterDriverId('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear filters">
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <FlatList
          data={payments}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 40 }} />
            ) : (
              <EmptyState
                icon="💳"
                title="No payments found"
                message={
                  user?.role === 'driver'
                    ? 'When you submit a payment, it will show up here with its status.'
                    : 'Try another filter, or wait for a driver to submit a payment.'
                }
              />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardMainRow}>
                <View style={styles.cardLeftCol}>
                  <View style={[
                    styles.pill,
                    item.status === 'approved' ? styles.pillApproved :
                      item.status === 'past_due' ? styles.pillPastDue : styles.pillPending,
                  ]}>
                    <Text style={styles.pillText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.cardTitle}>
                    Rs. {parseFloat(item.amount || '0').toFixed(2)}
                  </Text>
                </View>

                <View style={styles.cardRightCol}>
                  <View style={styles.cardDetailRow}>
                    <Text style={styles.cardDetailText}>{item.payment_date}</Text>
                    <Text style={styles.cardDetailIcon}>📅</Text>
                  </View>
                  {user?.role === 'company' && (
                    <>
                      <View style={styles.cardDetailRow}>
                        <Text style={styles.cardDetailText} numberOfLines={1}>{getVehicleName(item.vehicle_id)}</Text>
                        <Text style={styles.cardDetailIcon}>🚛</Text>
                      </View>
                      <View style={styles.cardDetailRow}>
                        <Text style={styles.cardDetailText} numberOfLines={1}>{getDriverName(item.driver_id)}</Text>
                        <Text style={styles.cardDetailIcon}>👤</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {((user?.role === 'company' && item.slip_path) || (user?.role === 'company' && item.status === 'pending')) && (
                <View style={styles.cardFooter}>
                  {user?.role === 'company' && item.slip_path && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        const fullUrl = apiUrl.replace('/api', '') + '/storage/' + item.slip_path;
                        console.log(fullUrl);
                        if (fullUrl.toLowerCase().endsWith('.pdf')) {
                          Linking.openURL(fullUrl);
                        } else {
                          setSelectedSlipUrl(fullUrl);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="View payment slip">
                      <Text style={styles.actionButtonText}>View Slip</Text>
                    </TouchableOpacity>
                  )}
                  {user?.role === 'company' && item.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Approve payment">
                      <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        />
      </View>

      <SelectSheet
        visible={vehicleModalVisible}
        title="Select vehicle"
        selectedId={filterVehicleId}
        onSelect={setFilterVehicleId}
        onClose={() => setVehicleModalVisible(false)}
        options={[
          { id: '', label: 'All vehicles' },
          ...vehicles.map(v => ({
            id: v.id.toString(),
            label: `${v.name} (${v.license_plate})`,
          })),
        ]}
      />

      <SelectSheet
        visible={driverModalVisible}
        title="Select driver"
        selectedId={filterDriverId}
        onSelect={setFilterDriverId}
        onClose={() => setDriverModalVisible(false)}
        options={[
          { id: '', label: 'All drivers' },
          ...drivers.map(d => ({
            id: d.id.toString(),
            label: `${d.name} (ID: ${d.id})`,
          })),
        ]}
      />

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedSlipUrl} animationType="fade" transparent={true}>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={() => setSelectedSlipUrl(null)}>
            <Text style={styles.imageViewerCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedSlipUrl && (
            <Image source={{ uri: selectedSlipUrl }} style={styles.imageViewerImage} resizeMode="contain" />
          )}
        </View>
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

  payButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    minHeight: 40,
    justifyContent: 'center',
  },
  payButtonText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  filterBlock: { marginBottom: spacing.lg },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  clearFilters: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 6, paddingHorizontal: 2 },
  clearFiltersText: { color: palette.primaryStrong, fontSize: 14, fontWeight: '800' },
  filterDropdownButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 48,
  },
  filterDropdownButtonText: {
    fontSize: 14,
    color: palette.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  dropdownIcon: { fontSize: 11, color: palette.textSecondary },

  listContent: { paddingBottom: 100, paddingHorizontal: 0, flexGrow: 1 },
  card: {
    backgroundColor: palette.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    ...require('../theme/shape').shadowPresets.soft,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeftCol: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  cardRightCol: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardDetailIcon: {
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  cardDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textSecondary,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },

  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 0,
  },
  pillPending: {
    backgroundColor: palette.warning + '20',
  },
  pillApproved: {
    backgroundColor: palette.success + '20',
  },
  pillPastDue: {
    backgroundColor: palette.danger + '20',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textPrimary,
    letterSpacing: 0.5,
  },

  actionButton: {
    backgroundColor: palette.gray100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  approveButton: {
    backgroundColor: palette.success,
  },
  approveButtonText: {
    color: '#fff',
  },

  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.pill,
  },
  imageViewerCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },
});
