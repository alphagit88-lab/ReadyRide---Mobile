import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar, ActivityIndicator } from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii, shadowPresets } from '../theme/shape';
import { getVehicleIcon } from '../utils/vehicleIcons';

export default function DashboardScreen({
  vehicleCount,
  isVehiclesLoading,
  onLogout,
  user,
  paymentDateObj,
  setPaymentDateObj,
  slipFile,
  onAttachmentOption,
  onPayNow,
  isSubmitting,
  paymentAmount,
  setPaymentAmount,
  onShowDatePicker,
  formatDateForDisplay,
  todayStatus,
  onNavigateToVehicles,
  dateStatus,
  dateStatusLoading,
  dateStatusError,
}: {
  vehicleCount: number;
  isVehiclesLoading?: boolean;
  dateStatus?: any;
  dateStatusLoading?: boolean;
  dateStatusError?: boolean;
  onLogout: () => void;
  user: any;
  paymentDateObj?: Date;
  setPaymentDateObj?: (date: Date) => void;
  slipFile?: any;
  onAttachmentOption?: (id: string) => void;
  onPayNow?: () => void;
  isSubmitting?: boolean;
  paymentAmount?: string;
  setPaymentAmount?: (amount: string) => void;
  onShowDatePicker?: () => void;
  formatDateForDisplay?: (date: Date) => string;
  todayStatus?: any;
  onNavigateToVehicles?: () => void;
}) {
  const isDriver = user?.role === 'driver';
  const isCompany = user?.role === 'company';
  const vehicle = user?.vehicle;
  const hasPaidToday = !!todayStatus?.has_paid_today;

  const handlePrevDate = () => {
    if (paymentDateObj && setPaymentDateObj) {
      const newDate = new Date(paymentDateObj);
      newDate.setDate(newDate.getDate() - 1);
      setPaymentDateObj(newDate);
    }
  };

  const handleNextDate = () => {
    if (paymentDateObj && setPaymentDateObj) {
      const newDate = new Date(paymentDateObj);
      newDate.setDate(newDate.getDate() + 1);
      setPaymentDateObj(newDate);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Dark Hero Header ── */}
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.headerCopy}>
              <Text style={styles.brand}>ReadyRide</Text>
              <Text style={styles.greeting}>
                {isDriver ? 'Welcome back' : 'Company overview'}
              </Text>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>{user?.name ?? 'User'}</Text>
                {isDriver && vehicle && (
                  <View style={styles.inlineVehicleCol}>
                    <Text style={styles.inlineVehicleName} numberOfLines={1}>{vehicle.name}</Text>
                    <Text style={styles.inlineVehiclePlate}>{vehicle.license_plate}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8} hitSlop={6}>
              <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roleRow}>
            <View style={[styles.roleBadge, isDriver ? styles.roleBadgeDriver : styles.roleBadgeCompany]}>
              <Text style={styles.roleBadgeText}>
                {(user?.role ?? 'user').toUpperCase()}
              </Text>
            </View>

            {isDriver && vehicle && (
              <>
                <Text style={styles.inlineAmount}>Daily: Rs. {parseFloat(vehicle.driver_payment_amount || '0').toFixed(2)}</Text>
                <View style={[styles.heroStatusChip, hasPaidToday ? styles.heroStatusPaid : styles.heroStatusPending]}>
                  <Text style={styles.heroStatusChipText}>
                    {todayStatus ? (hasPaidToday ? (todayStatus.payment?.status === 'approved' ? 'Paid today' : 'Pending approval') : 'Unpaid today') : 'Unknown'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Decorative bubbles */}
          <View style={[styles.bubble, styles.bubble1]} />
          <View style={[styles.bubble, styles.bubble2]} />
          <View style={[styles.bubble, styles.bubble3]} />
        </View>

        {/* ── Main Content Card ── */}
        <View style={styles.card}>

          {isCompany && (
            <TouchableOpacity style={styles.statsCard} onPress={onNavigateToVehicles} activeOpacity={0.8}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🚛</Text>
              </View>
              <View style={styles.statsCopy}>
                <Text style={styles.statsLabel}>Total vehicles</Text>
                {isVehiclesLoading ? (
                  <ActivityIndicator size="large" color={palette.primary} style={{ alignSelf: 'flex-start', marginVertical: 4 }} />
                ) : (
                  <Text style={styles.statsValue}>{vehicleCount}</Text>
                )}
                <Text style={styles.statsHint}>Open Vehicles in the tab below to manage your fleet.</Text>
              </View>
            </TouchableOpacity>
          )}

          {isDriver && vehicle && (
            <View>
              <View style={styles.sliderWidgetContainer}>
                <Text style={styles.widgetTitle}>Submit a payment</Text>
                <Text style={styles.widgetHint}>Pick a date, attach a slip, then send it for approval.</Text>

                <View style={styles.sliderRow}>
                  <TouchableOpacity
                    style={styles.sliderNavBtn}
                    onPress={handlePrevDate}
                    accessibilityLabel="Previous day"
                    hitSlop={4}
                  >
                    <Text style={[styles.sliderNavBtnText, { marginLeft: -2 }]}>{'❮'}</Text>
                  </TouchableOpacity>

                  <View style={styles.sliderCenter}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.fieldLabel}>Payment date</Text>
                      {dateStatusLoading ? (
                        <ActivityIndicator size="small" color={palette.primary} />
                      ) : dateStatusError ? (
                        <View style={{
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                          borderWidth: 1,
                          borderColor: palette.border,
                          borderRadius: 4,
                          backgroundColor: palette.surface,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: palette.textSecondary }}>⚠️ Error</Text>
                        </View>
                      ) : dateStatus?.payment ? (
                        <View style={{
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                          borderWidth: 1,
                          borderColor: dateStatus.payment.status === 'approved' ? palette.success : palette.warning,
                          borderRadius: 4,
                          backgroundColor: dateStatus.payment.status === 'approved' ? `${palette.success}1A` : `${palette.warning}1A`,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: dateStatus.payment.status === 'approved' ? palette.success : palette.warning }}>
                            {dateStatus.payment.status === 'approved' ? '✓ Paid' : '⏳ Pending'}
                          </Text>
                        </View>
                      ) : (
                        <View style={{
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                          borderWidth: 1,
                          borderColor: palette.danger,
                          borderRadius: 4,
                          backgroundColor: `${palette.danger}1A`,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: palette.danger }}>✕ Unpaid</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={onShowDatePicker} style={styles.sliderDateBtn} activeOpacity={0.85}>
                      <Text style={styles.sliderDateText}>
                        {paymentDateObj && formatDateForDisplay ? formatDateForDisplay(paymentDateObj) : ''}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>Amount</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={paymentAmount || vehicle.driver_payment_amount}
                      onChangeText={setPaymentAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={palette.textMuted}
                      accessibilityLabel="Payment amount"
                    />

                    <Text style={styles.fieldLabel}>Payment slip</Text>
                    {slipFile && (
                      <Text style={styles.slipFileText} numberOfLines={1}>
                        {slipFile.name}
                      </Text>
                    )}
                    <View style={styles.attachmentIconsRow}>
                      <TouchableOpacity style={styles.attachmentIconButton} onPress={() => onAttachmentOption?.('camera')} activeOpacity={0.85}>
                        <Text style={styles.attachmentIcon}>📷</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.attachmentIconButton} onPress={() => onAttachmentOption?.('gallery')} activeOpacity={0.85}>
                        <Text style={styles.attachmentIcon}>🖼️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.attachmentIconButton} onPress={() => onAttachmentOption?.('pdf')} activeOpacity={0.85}>
                        <Text style={styles.attachmentIcon}>📄</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.sliderPayBtn, isSubmitting && styles.sliderPayBtnDisabled]} onPress={onPayNow} activeOpacity={0.85} disabled={isSubmitting}>
                      <Text style={styles.sliderPayBtnText}>{isSubmitting ? 'Submitting...' : 'Pay now'}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.sliderNavBtn}
                    onPress={handleNextDate}
                    accessibilityLabel="Next day"
                    hitSlop={4}
                  >
                    <Text style={[styles.sliderNavBtnText, { marginLeft: 2 }]}>{'❯'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {isDriver && !vehicle && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                You are not assigned to any vehicle.
              </Text>
              <Text style={styles.warningSubText}>
                Please contact your company so they can assign a vehicle in ReadyRide.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.textPrimary },
  content: { flexGrow: 1 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: palette.textPrimary,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
    marginBottom: spacing.md,
  },
  headerCopy: { flex: 1 },
  brand: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: { fontSize: 16, color: palette.gray400, fontWeight: '500' },

  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoutButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: palette.white, letterSpacing: -1 },
  inlineVehicleCol: {
    marginLeft: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.2)',
    paddingLeft: spacing.md,
    justifyContent: 'center',
  },
  inlineVehicleName: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.white,
    marginBottom: 2,
  },
  inlineVehiclePlate: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.gray400,
  },

  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 2,
    marginTop: spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  roleBadgeDriver: { backgroundColor: palette.primary, borderWidth: 0 },
  roleBadgeCompany: { backgroundColor: palette.accent, borderWidth: 0 },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: palette.textPrimary },

  inlineAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.primary,
    marginLeft: spacing.xs,
  },
  heroStatusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.sm, borderWidth: 1 },
  heroStatusPaid: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: palette.success },
  heroStatusPending: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: palette.warning },
  heroStatusChipText: { fontSize: 10, fontWeight: '800', color: palette.white },

  // Decorative bubbles
  bubble: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: palette.primary,
    opacity: 0.08,
  },
  bubble1: { width: 160, height: 160, top: -60, right: -50 },
  bubble2: { width: 100, height: 100, bottom: -20, left: -30 },
  bubble3: { width: 60, height: 60, top: 40, left: 30, opacity: 0.05 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flexGrow: 1,
    backgroundColor: palette.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: -24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 100, // accommodate bottom nav
    zIndex: 10,
    ...shadowPresets.card,
  },

  statsCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
    ...shadowPresets.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: palette.textPrimary, // Dark contrast
    marginRight: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 32 },
  statsCopy: { flex: 1 },
  statsLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statsValue: { color: palette.textPrimary, fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  statsHint: {
    marginTop: 6,
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  summaryView: {
    marginBottom: spacing.xl,
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadowPresets.soft,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  summaryName: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    marginRight: spacing.sm,
  },
  summaryPlateBadge: {
    backgroundColor: palette.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  summaryPlateText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.gray700,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.primaryStrong,
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  statusPaid: {
    backgroundColor: palette.success + '20',
    borderColor: palette.success,
  },
  statusPending: {
    backgroundColor: palette.warning + '20',
    borderColor: palette.warning,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textPrimary,
  },

  sliderWidgetContainer: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadowPresets.soft,
  },
  widgetTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: palette.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  widgetHint: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderNavBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: palette.gray50,
    borderWidth: 2,
    borderColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderNavBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textMuted,
    lineHeight: 28,
    includeFontPadding: false,
    textAlign: 'center',
  },
  sliderCenter: {
    flex: 1,
    alignItems: 'stretch',
    marginHorizontal: spacing.md,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderDateBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.gray50,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: palette.gray200,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  sliderDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  amountInput: {
    backgroundColor: palette.gray50,
    borderWidth: 2,
    borderColor: palette.gray200,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    fontSize: 16,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  attachmentIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  attachmentIconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gray50,
    borderWidth: 2,
    borderColor: palette.gray200,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: 10,
    minHeight: 44,
  },
  attachmentIcon: {
    fontSize: 18,
  },
  slipFileText: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sliderPayBtnDisabled: {
    opacity: 0.5,
  },
  sliderPayBtn: {
    backgroundColor: palette.textPrimary, // Ultra dark button
    paddingVertical: 12,
    borderRadius: radii.lg,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    ...shadowPresets.card,
    marginTop: spacing.xs,
  },
  sliderPayBtnText: {
    color: palette.primary, // Neon green text
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  warningCard: {
    backgroundColor: palette.warning + '15',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.warning,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: spacing.xs,
  },
  warningSubText: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
});
