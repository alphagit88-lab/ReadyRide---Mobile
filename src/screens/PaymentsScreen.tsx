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
  ScrollView,
} from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import EmptyState from '../components/common/EmptyState';
import SelectSheet from '../components/common/SelectSheet';
import ImageViewer from '../components/common/ImageViewer';
import { getVehicleIcon } from '../utils/vehicleIcons';

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(user?.role === 'driver' ? 'calendar' : 'list');

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [loadingSlipId, setLoadingSlipId] = useState<number | null>(null);

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

  const getVehicleType = (id: any) => {
    if (!id) return undefined;
    const v = vehicles.find(item => item.id.toString() === id.toString());
    return v?.vehicle_type;
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
                  if (viewMode === 'calendar') setViewMode('list');
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear filters">
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <View style={styles.segmentControl}>
          {user?.role === 'driver' ? (
            <>
              <TouchableOpacity
                style={[styles.segmentBtn, viewMode === 'calendar' && styles.segmentBtnActive]}
                onPress={() => setViewMode('calendar')}
              >
                <Text style={[styles.segmentText, viewMode === 'calendar' && styles.segmentTextActive]}>Calendar View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>List View</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>List View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  viewMode === 'calendar' && styles.segmentBtnActive,
                  !filterDriverId && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (!filterDriverId) {
                    Alert.alert('Filter Required', 'Please select a specific driver to view their calendar.');
                    return;
                  }
                  setViewMode('calendar');
                }}
              >
                <Text style={[styles.segmentText, viewMode === 'calendar' && styles.segmentTextActive]}>Calendar View</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {viewMode === 'list' ? (
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
                          <Text style={styles.cardDetailIcon}>{getVehicleIcon(getVehicleType(item.vehicle_id))}</Text>
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
                        onPress={async () => {
                          setLoadingSlipId(item.id);
                          const fullUrl = apiUrl.replace('/api', '') + '/storage/' + item.slip_path;
                          if (fullUrl.toLowerCase().endsWith('.pdf')) {
                            await Linking.openURL(fullUrl);
                            setLoadingSlipId(null);
                          } else {
                            await Image.prefetch(fullUrl).catch(() => { });
                            setSelectedSlipUrl(fullUrl);
                            setLoadingSlipId(null);
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="View payment slip">
                        {loadingSlipId === item.id ? (
                          <ActivityIndicator size="small" color={palette.primary} />
                        ) : (
                          <Text style={styles.actionButtonText}>View Slip</Text>
                        )}
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
        ) : (
          <ScrollView style={{ marginBottom: 50 }}>
            <PaymentCalendar payments={payments} user={user} selectedDriver={user?.role === 'company' ? drivers.find(d => d.id.toString() === filterDriverId) : null} />
          </ScrollView>
        )}
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
        onSelect={(id) => {
          setFilterDriverId(id);
          if (!id && viewMode === 'calendar') setViewMode('list');
        }}
        onClose={() => setDriverModalVisible(false)}
        options={[
          { id: '', label: 'All drivers' },
          ...drivers.map(d => ({
            id: d.id.toString(),
            label: `${d.name} (ID: ${d.id})`,
          })),
        ]}
      />

      <ImageViewer uri={selectedSlipUrl} onClose={() => setSelectedSlipUrl(null)} />
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

  filterBlock: { marginBottom: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  clearFilters: { alignSelf: 'flex-start', marginTop: 5, paddingVertical: 6, paddingHorizontal: 2 },
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

  segmentControl: {
    flexDirection: 'row',
    backgroundColor: palette.gray100,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.md,
  },
  segmentBtnActive: {
    backgroundColor: palette.surface,
    ...require('../theme/shape').shadowPresets.soft,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  segmentTextActive: {
    color: palette.primaryStrong,
    fontWeight: '700',
  },
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


  // Calendar styles
  calendarContainer: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  calendarNav: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
    paddingHorizontal: spacing.sm,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%', // 100/7
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  dayDateNum: {
    fontSize: 8,
    fontWeight: '700',
    color: palette.textPrimary,
    position: 'absolute',
    top: 3,
    left: 5,
  },
  dayStatusIcon: {
    fontSize: 16,
    fontWeight: '900',
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  dayToday: {
    // no color override — status color takes priority
  },
  dayTodayNum: {
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  dayApproved: {
    backgroundColor: palette.success + '30',
    borderWidth: 1.5,
    borderColor: palette.success,
  },
  dayPending: {
    backgroundColor: palette.warning + '30',
    borderWidth: 1.5,
    borderColor: palette.warning,
  },
  dayPastDue: {
    backgroundColor: palette.danger + '30',
    borderWidth: 1.5,
    borderColor: palette.danger,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendApproved: { backgroundColor: palette.success + '30', borderWidth: 1, borderColor: palette.success },
  legendPending: { backgroundColor: palette.warning + '30', borderWidth: 1, borderColor: palette.warning },
  legendPastDue: { backgroundColor: palette.danger + '30', borderWidth: 1, borderColor: palette.danger },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
});

function PaymentCalendar({ payments, user, selectedDriver }: { payments: any[], user: any, selectedDriver?: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const today = new Date();

  const targetUser = user?.role === 'company' && selectedDriver ? selectedDriver : user;
  const startDateObj = targetUser?.start_date ? new Date(targetUser.start_date) : null;

  const canGoPrev = !startDateObj || new Date(year, month - 1, 1) >= new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
  const canGoNext = new Date(year, month + 1, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);

  const prevMonth = () => { if (canGoPrev) setCurrentDate(new Date(year, month - 1, 1)); };
  const nextMonth = () => { if (canGoNext) setCurrentDate(new Date(year, month + 1, 1)); };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map payments by date (YYYY-MM-DD)
  const paymentMap: Record<string, string> = {};
  payments.forEach(p => {
    if (p.payment_date) {
      paymentMap[p.payment_date] = p.status;
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let status = paymentMap[dateStr];

    const startDateStr = targetUser?.start_date || null;

    if (!status && dateStr <= todayStr && (!startDateStr || dateStr >= startDateStr)) {
      status = 'past_due';
    }

    const innerStyle: any[] = [styles.dayInner];
    let icon: string | null = null;

    if (status === 'approved') {
      innerStyle.push(styles.dayApproved);
      icon = '✓';
    } else if (status === 'pending') {
      innerStyle.push(styles.dayPending);
    } else if (status === 'past_due' || status === 'missed') {
      innerStyle.push(styles.dayPastDue);
      icon = '✕';
    }

    const isToday = dateStr === todayStr;

    cells.push(
      <View key={d} style={styles.dayCell}>
        <View style={[...innerStyle, isToday && styles.dayToday]}>
          <Text style={[styles.dayDateNum, isToday && styles.dayTodayNum]}>{d}</Text>
          {icon && (
            <Text style={[styles.dayStatusIcon, { color: status === 'approved' ? palette.success : palette.danger }]}>
              {icon}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={prevMonth} disabled={!canGoPrev}>
          <Text style={[styles.calendarNav, !canGoPrev && { opacity: 0.2 }]}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.calendarTitle}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} disabled={!canGoNext}>
          <Text style={[styles.calendarNav, !canGoNext && { opacity: 0.2 }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weekDaysRow}>
        {weekDays.map(wd => <Text key={wd} style={styles.weekDayText}>{wd}</Text>)}
      </View>
      <View style={styles.daysGrid}>
        {cells}
      </View>
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendApproved]}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: palette.success }}>✓</Text>
          </View>
          <Text style={styles.legendText}>Approved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendPending]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendPastDue]}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: palette.danger }}>✕</Text>
          </View>
          <Text style={styles.legendText}>Past Due</Text>
        </View>
      </View>
    </View>
  );
}
