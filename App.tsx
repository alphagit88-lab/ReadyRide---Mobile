import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
  Alert, Animated, Platform, ActivityIndicator,
} from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import VehiclesScreen from './src/screens/VehiclesScreen';
import DriversScreen from './src/screens/DriversScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import { palette } from './src/theme/colors';
import { spacing } from './src/theme/spacing';
import { radii, shadowPresets } from './src/theme/shape';
import * as Keychain from 'react-native-keychain';
import DocumentPicker from 'react-native-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerFcmToken, subscribeToForegroundNotifications } from './src/utils/fcmNotifications';

const API_URL = 'https://itexphere.com/fleet/public/api';
//const API_URL = 'http://10.0.2.2:8000/api';

// In-app toast notification state
type Toast = { title: string; body: string } | null;

export default function App() {
  const [screen, setScreen] = useState('login');
  const [isInitializing, setIsInitializing] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDateObj, setPaymentDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slipFile, setSlipFile] = useState<any>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const formatDateForDisplay = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${yyyy}-${mm}-${dd}, ${dayName}`;
  };

  const formatDateForApi = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSelectFile = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });
      setSlipFile(res[0]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error(err);
      }
    }
  };

  // ─── Initialize session from Keychain ──────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          const user = JSON.parse(credentials.username);
          const token = credentials.password;
          setAuthToken(token);
          setCurrentUser(user);
          setScreen('dashboard');
          if (user?.role === 'driver') {
            checkTodayPaymentStatus(token);
          }
        }
      } catch (err) {
        console.error('Keychain error:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  // ─── FCM: register token & listen for foreground messages ─────────────────
  useEffect(() => {
    if (!authToken) return;

    registerFcmToken(API_URL, authToken);

    const unsub = subscribeToForegroundNotifications((title, body) => {
      showToast(title, body);
    });
    return () => unsub();
  }, [authToken]);

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (title: string, body: string) => {
    setToast({ title, body });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(toastAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const handleLogin = async (token: string, user: any) => {
    if (token) {
      setAuthToken(token);
      setCurrentUser(user);
      await Keychain.setGenericPassword(JSON.stringify(user), token);
    }
    setScreen('dashboard');

    if (user?.role === 'driver') {
      checkTodayPaymentStatus(token);
    }
  };

  const handleLogout = async () => {
    await Keychain.resetGenericPassword();
    setAuthToken(null);
    setCurrentUser(null);
    setScreen('login');
  };

  // ─── Payment status ────────────────────────────────────────────────────────
  const checkTodayPaymentStatus = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/payments/today-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTodayStatus(data);
      if (data.is_assigned && !data.has_paid_today) {
        setPaymentDateObj(new Date());
        setPaymentAmount(data.amount_due ? String(data.amount_due) : '');
        setSlipFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Vehicles ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authToken && currentUser?.role === 'company' && (screen === 'vehicles' || screen === 'dashboard')) {
      fetchVehicles();
    }
  }, [screen, authToken, currentUser?.role]);

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveVehicle = async (vehicleData: any) => {
    try {
      if (vehicleData.id) {
        await fetch(`${API_URL}/vehicles/${vehicleData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(vehicleData),
        });
      } else {
        await fetch(`${API_URL}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(vehicleData),
        });
      }
      fetchVehicles();
    } catch (error) {
      console.error(error);
    }
  };

  // ─── Payments ──────────────────────────────────────────────────────────────
  const handlePayNow = async () => {
    try {
      const dateOnly = formatDateForApi(paymentDateObj);

      const formData = new FormData();
      formData.append('payment_date', dateOnly);
      formData.append('amount', paymentAmount);

      if (slipFile) {
        formData.append('slip', {
          uri: slipFile.uri,
          name: slipFile.name,
          type: slipFile.type || 'image/jpeg',
        } as any);
      }

      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (res.ok) {
        showToast('✓ Payment Submitted', 'Your payment is pending company approval.');
        setSlipFile(null); // Clear the slip
        checkTodayPaymentStatus(authToken!);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to make payment');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // ─── Screens ───────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <View style={[styles.appContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
        <ActivityIndicator size="large" color={palette.primaryStrong} />
        <Text style={styles.loadingBrand}>ReadyRide</Text>
        <Text style={styles.loadingText}>Loading your workspace...</Text>
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
        <LoginScreen
          apiUrl={API_URL}
          onLogin={handleLogin}
          onRegisterSelect={() => setScreen('register')}
        />
      </>
    );
  }

  if (screen === 'register') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
        <RegisterScreen
          apiUrl={API_URL}
          onRegister={handleLogin}
          onLoginSelect={() => setScreen('login')}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

      {/* ─── In-App Toast ─── */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }] },
          ]}
        >
          <Text style={styles.toastTitle}>{toast.title}</Text>
          <Text style={styles.toastBody}>{toast.body}</Text>
        </Animated.View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={paymentDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setPaymentDateObj(date);
            }
          }}
        />
      )}

      {/* ─── Main Content ─── */}
      <View style={styles.content}>
        {screen === 'dashboard' && (
          <DashboardScreen
            vehicleCount={vehicles.length}
            onLogout={handleLogout}
            user={currentUser}
            paymentDateObj={paymentDateObj}
            setPaymentDateObj={setPaymentDateObj}
            slipFile={slipFile}
            onSelectFile={handleSelectFile}
            onPayNow={handlePayNow}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            onShowDatePicker={() => setShowDatePicker(true)}
            formatDateForDisplay={formatDateForDisplay}
            todayStatus={todayStatus}
          />
        )}
        {screen === 'vehicles' && (
          <VehiclesScreen
            vehicles={vehicles}
            onSaveVehicle={handleSaveVehicle}
            token={authToken}
            apiUrl={API_URL}
          />
        )}
        {screen === 'drivers' && (
          <DriversScreen token={authToken} apiUrl={API_URL} />
        )}
        {screen === 'payments' && (
          <PaymentsScreen
            token={authToken}
            apiUrl={API_URL}
            user={currentUser}
            onPayPress={() => {
              setScreen('dashboard');
              setPaymentDateObj(new Date());
              if (!paymentAmount && todayStatus?.amount_due) {
                setPaymentAmount(String(todayStatus.amount_due));
              }
              setSlipFile(null);
            }}
          />
        )}
      </View>

      {/* ─── Bottom Nav ─── */}
      <View style={styles.navContainer}>
        <View style={styles.navbar}>
          <TouchableOpacity
            style={[styles.navItem, screen === 'dashboard' && styles.navItemActive]}
            onPress={() => setScreen('dashboard')}
            accessibilityRole="button"
            accessibilityLabel="Dashboard"
            accessibilityState={{ selected: screen === 'dashboard' }}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navText, screen === 'dashboard' && styles.navTextActive]}>
              Home
            </Text>
            {screen === 'dashboard' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {currentUser?.role === 'company' && (
            <>
              <TouchableOpacity
                style={[styles.navItem, screen === 'vehicles' && styles.navItemActive]}
                onPress={() => setScreen('vehicles')}
                accessibilityRole="button"
                accessibilityLabel="Vehicles"
                accessibilityState={{ selected: screen === 'vehicles' }}
              >
                <Text style={styles.navIcon}>🚛</Text>
                <Text style={[styles.navText, screen === 'vehicles' && styles.navTextActive]}>
                  Vehicles
                </Text>
                {screen === 'vehicles' && <View style={styles.activeIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, screen === 'drivers' && styles.navItemActive]}
                onPress={() => setScreen('drivers')}
                accessibilityRole="button"
                accessibilityLabel="Drivers"
                accessibilityState={{ selected: screen === 'drivers' }}
              >
                <Text style={styles.navIcon}>👤</Text>
                <Text style={[styles.navText, screen === 'drivers' && styles.navTextActive]}>
                  Drivers
                </Text>
                {screen === 'drivers' && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.navItem, screen === 'payments' && styles.navItemActive]}
            onPress={() => setScreen('payments')}
            accessibilityRole="button"
            accessibilityLabel="Payments"
            accessibilityState={{ selected: screen === 'payments' }}
          >
            <Text style={styles.navIcon}>💳</Text>
            <Text style={[styles.navText, screen === 'payments' && styles.navTextActive]}>
              Payments
            </Text>
            {screen === 'payments' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1 },

  loadingBrand: {
    marginTop: spacing.md,
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingText: {
    marginTop: spacing.xs,
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  navContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.pill,
    ...shadowPresets.card,
    elevation: 8,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    height: 64,
    alignItems: 'center',
  },
  navItem: { paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', height: '100%' },
  navItemActive: { backgroundColor: 'transparent' },
  navIcon: { fontSize: 22, marginBottom: 4 },
  navText: { fontSize: 10, color: palette.textMuted, fontWeight: '600', letterSpacing: 0.2 },
  navTextActive: { color: palette.primaryStrong, fontWeight: '800' },
  activeIndicator: { position: 'absolute', top: -2, width: 28, height: 4, backgroundColor: palette.primaryStrong, borderRadius: radii.pill },

  toast: {
    position: 'absolute',
    top: spacing.xl + 20,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    backgroundColor: palette.textPrimary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: palette.primaryStrong,
    ...shadowPresets.card,
  },
  toastTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 4, letterSpacing: 0.3 },
  toastBody: { color: palette.gray200, fontSize: 14, lineHeight: 20 },

  // ─── Payment Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl * 1.5,
    borderTopRightRadius: radii.xl * 1.5,
    padding: spacing.xl,
    paddingBottom: spacing.xl + 32,
    ...shadowPresets.card,
  },
  closeIcon: { position: 'absolute', top: spacing.lg, right: spacing.lg, padding: spacing.sm, zIndex: 10, backgroundColor: palette.gray100, borderRadius: radii.pill },
  closeText: { fontSize: 18, fontWeight: '800', color: palette.textSecondary },
  modalTitle: { fontSize: 24, fontWeight: '900', color: palette.textPrimary, marginBottom: 6, marginTop: spacing.md, letterSpacing: -0.5 },
  modalSubtitle: { fontSize: 15, color: palette.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },

  label: { fontSize: 13, fontWeight: '800', color: palette.textSecondary, marginBottom: spacing.xs, letterSpacing: 0.5 },
  input: {
    backgroundColor: palette.gray50,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    height: 56,
    fontSize: 16,
    fontWeight: '500',
    color: palette.textPrimary,
    marginBottom: spacing.lg,
  },
  inputReadonly: { backgroundColor: palette.surfaceMuted, color: palette.textSecondary, opacity: 0.8 },

  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: palette.gray50,
  },
  attachIcon: { fontSize: 20, marginRight: spacing.sm },
  attachText: { color: palette.textSecondary, fontWeight: '700', fontSize: 15 },

  payButton: { backgroundColor: palette.primaryStrong, padding: spacing.lg, borderRadius: radii.pill, alignItems: 'center', ...shadowPresets.soft },
  payButtonText: { color: palette.white, fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },

  datePickerButton: {
    justifyContent: 'center',
  },
  datePickerButtonText: {
    color: palette.textPrimary,
    fontSize: 16,
    lineHeight: 20,
  },
});
