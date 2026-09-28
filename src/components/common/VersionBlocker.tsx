import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Platform, Image
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { palette } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radii } from '../../theme/shape';

const API_URL = 'https://itexphere.com/fleet/public/api';
const PLAY_STORE_ID = 'com.fleetmanagementmobile';

interface Props {
  children: React.ReactNode;
}

export default function VersionBlocker({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const res = await fetch(`${API_URL}/version/android`);
      const data = await res.json();
      const required: string | null = data?.version ?? null;
      // Only enforce if admin has actually set a version
      const currentVersion = DeviceInfo.getVersion();
      if (required && required.trim() !== '' && required !== currentVersion) {
        setNeedsUpdate(true);
      }
    } catch (e) {
      // Network error — allow app to continue
    } finally {
      setLoading(false);
    }
  };

  const openStore = () => {
    if (Platform.OS === 'android') {
      Linking.openURL(`market://details?id=${PLAY_STORE_ID}`).catch(() =>
        Linking.openURL(`https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`)
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primaryStrong} />
      </View>
    );
  }

  if (needsUpdate) {
    return (
      <View style={styles.center}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 60, height: 60, resizeMode: 'contain' }} 
          />
        </View>

        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.message}>
          A new version of ReadyRide is available.{'\n'}
          Please update to continue using the app.
        </Text>
        <Text style={styles.versionHint}>Current version: {DeviceInfo.getVersion()}</Text>

        <TouchableOpacity style={styles.btn} onPress={openStore} activeOpacity={0.85}>
          <Text style={styles.btnText}>Update Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  versionHint: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: spacing.xl,
  },
  btn: {
    backgroundColor: palette.primaryStrong,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: radii.pill,
  },
  btnText: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
