import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
  ActivityIndicator, TextInput, Animated, StatusBar,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii, shadowPresets } from '../theme/shape';

// ─── Tiny SVG-like icon components ────────────────────────────────────────────
const MailIcon = ({ color = palette.textMuted }: { color?: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 16, height: 11, borderWidth: 1.5, borderColor: color, borderRadius: 3 }} />
    <View style={{ position: 'absolute', top: 8, width: 10, height: 1.5, backgroundColor: color, transform: [{ rotate: '32deg' }], left: 2 }} />
    <View style={{ position: 'absolute', top: 8, width: 10, height: 1.5, backgroundColor: color, transform: [{ rotate: '-32deg' }], right: 2 }} />
  </View>
);

const LockIcon = ({ color = palette.textMuted }: { color?: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 10, height: 9, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 1.7, borderBottomWidth: 0, borderColor: color, position: 'absolute', top: 1 }} />
    <View style={{ width: 14, height: 10, borderWidth: 1.7, borderColor: color, borderRadius: 3, marginTop: 7 }} />
  </View>
);

const EyeIcon = ({ visible, color = palette.textMuted }: { visible: boolean; color?: string }) => (
  <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 18, height: 12, borderRadius: 9, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      {visible && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />}
    </View>
    {!visible && <View style={{ position: 'absolute', width: 20, height: 1.5, backgroundColor: color, transform: [{ rotate: '-35deg' }] }} />}
  </View>
);

// ─── Focused text input with animated border ──────────────────────────────────
function FancyInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  onSubmitEditing,
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  onSubmitEditing?: () => void;
  icon: 'mail' | 'lock';
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  const anim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [palette.border, palette.primaryStrong],
  });

  const iconColor = focused ? palette.primaryStrong : palette.textMuted;

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[inputStyles.shell, { borderColor }]}>
        <View style={inputStyles.iconWrap}>
          {icon === 'mail' ? <MailIcon color={iconColor} /> : <LockIcon color={iconColor} />}
        </View>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.gray400}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={secureTextEntry ? 'go' : 'next'}
          selectionColor={palette.primaryStrong}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={12} style={inputStyles.eyeWrap}>
            <EyeIcon visible={!hidden} color={iconColor} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const FIELD_RADIUS = radii.lg; // single source of truth shared by inputs AND buttons

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md }, // reduced from lg
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: 6, // reduced from 8
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderRadius: FIELD_RADIUS,
    minHeight: 52, // reduced from 60
    paddingHorizontal: spacing.md,
  },
  iconWrap: { width: 30, alignItems: 'center', marginRight: 6 },
  input: {
    flex: 1,
    fontSize: 16, // reduced from 17
    fontWeight: '600',
    color: palette.textPrimary,
    paddingVertical: 12, // reduced from 16
  },
  eyeWrap: { paddingLeft: 8 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen({
  onLogin,
  onRegisterSelect,
  apiUrl,
}: {
  onLogin: (token: string, user: any) => void;
  onRegisterSelect: () => void;
  apiUrl: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '296495329881-i7bt0taej63hemcofjkgmkmf44mjdeq9.apps.googleusercontent.com',
    });
  }, []);

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed.');
      onLogin(data.token, data.user);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Something went wrong.');
    } finally {
      setLoginLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token received from Google.');
      const res = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Backend verification failed.');
      onLogin(data.token, data.user);
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Failed', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={palette.textPrimary} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.heroInner}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
                <View style={styles.logoBadge} />
              </View>
              <Text style={styles.heroTitle}>ReadyRide</Text>
              <Text style={styles.heroSub}>Fleet operations console</Text>
            </View>
            {/* Decorative circles */}
            <View style={[styles.bubble, styles.bubble1]} />
            <View style={[styles.bubble, styles.bubble2]} />
            <View style={[styles.bubble, styles.bubble3]} />
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to manage your fleet.</Text>

            <View style={styles.formSection}>
              <FancyInput
                label="Email address"
                placeholder="name@company.com"
                value={email}
                onChangeText={setEmail}
                autoComplete="email"
                keyboardType="email-address"
                icon="mail"
              />
              <FancyInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                icon="lock"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[styles.signInBtn, loginLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
              activeOpacity={0.88}>
              {loginLoading ? (
                <ActivityIndicator color={palette.textPrimary} size="small" />
              ) : (
                <Text style={styles.signInBtnText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.divLine} />
              <Text style={styles.divLabel}>or continue with</Text>
              <View style={styles.divLine} />
            </View>

            {/* ── Google ── */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={signInWithGoogle}
              disabled={googleLoading}
              activeOpacity={0.88}>
              <Image
                source={require('../assets/images/g-logo.png')}
                style={styles.gIcon}
              />
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Signing in…' : 'Google'}
              </Text>
            </TouchableOpacity>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New company?</Text>
              <TouchableOpacity onPress={onRegisterSelect} hitSlop={10}>
                <Text style={styles.footerLink}> Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: palette.textPrimary,
    paddingTop: spacing.xxl, // reduced
    paddingBottom: spacing.xxl + spacing.md, // reduced
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroInner: { alignItems: 'center', zIndex: 2 },
  logoWrap: { position: 'relative', marginBottom: spacing.md }, // reduced from xl
  logo: {
    width: 64, // reduced from 88
    height: 64, // reduced from 88
    borderRadius: radii.lg,
    borderWidth: 0,
    ...shadowPresets.card,
  },
  logoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20, // reduced from 24
    height: 20, // reduced from 24
    borderRadius: 10,
    backgroundColor: palette.primary,
    borderWidth: 3,
    borderColor: palette.textPrimary,
  },
  heroTitle: {
    fontSize: 28, // reduced from 36
    fontWeight: '900',
    color: palette.white,
    letterSpacing: -0.8,
  },
  heroSub: {
    fontSize: 13, // reduced from 15
    fontWeight: '500',
    color: palette.gray400,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Decorative bubbles
  bubble: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: palette.primary,
    opacity: 0.08,
  },
  bubble1: { width: 200, height: 200, top: -80, right: -70 },
  bubble2: { width: 130, height: 130, bottom: -20, left: -50 },
  bubble3: { width: 70, height: 70, top: 20, left: 20, opacity: 0.08 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: palette.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32, // adjusted
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl, // reduced from xxxl
    paddingBottom: spacing.xl, // reduced from xxxl
    zIndex: 10,
    ...shadowPresets.card,
  },

  // Tag chip above title
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm, // reduced
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.gray100,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primaryStrong,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.gray700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  cardTitle: {
    fontSize: 28, // reduced from 32
    fontWeight: '900',
    color: palette.textPrimary,
    letterSpacing: -1,
    marginBottom: 4, // reduced
  },
  cardSub: {
    fontSize: 14, // reduced from 16
    fontWeight: '500',
    color: palette.textSecondary,
    marginBottom: spacing.lg, // reduced from xxxl
    lineHeight: 20,
  },

  formSection: { marginBottom: spacing.xs }, // reduced

  // ── Sign-in button ────────────────────────────────────────────────────────
  signInBtn: {
    backgroundColor: palette.textPrimary,
    borderRadius: FIELD_RADIUS,
    minHeight: 52, // reduced from 60
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm, // reduced
    ...shadowPresets.card,
  },
  btnDisabled: { opacity: 0.55 },
  signInBtnText: {
    color: palette.primary,
    fontSize: 16, // reduced
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg, // reduced from xxl
  },
  divLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: palette.gray200,
  },
  divLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
    marginHorizontal: spacing.md,
    letterSpacing: 0.3,
  },

  // ── Google button ─────────────────────────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gray50,
    borderRadius: FIELD_RADIUS,
    minHeight: 52, // reduced from 60
    borderWidth: 2,
    borderColor: palette.gray200,
    gap: spacing.md,
  },
  gIcon: { width: 20, height: 20 }, // reduced
  googleBtnText: {
    fontSize: 14, // reduced
    fontWeight: '700',
    color: palette.textPrimary,
  },

  // ── Footer link ───────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.lg, // reduced from xxl
    alignItems: 'center',
  },
  footerText: {
    color: palette.textSecondary,
    fontSize: 13, // reduced
    fontWeight: '400',
  },
  footerLink: {
    color: palette.primaryStrong,
    fontSize: 13, // reduced
    fontWeight: '800',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
