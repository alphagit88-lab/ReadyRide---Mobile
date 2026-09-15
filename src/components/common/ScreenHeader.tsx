import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export default function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.heroInner}>
        <View style={styles.copy}>
          <Text style={styles.brand}>ReadyRide</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      
      {/* Decorative bubbles */}
      <View style={[styles.bubble, styles.bubble1]} />
      <View style={[styles.bubble, styles.bubble2]} />
      <View style={[styles.bubble, styles.bubble3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: palette.textPrimary,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl + spacing.xl, // deep padding for card overlap
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: -40, // overlap effect
  },
  heroInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    zIndex: 2,
  },
  copy: {flex: 1},
  brand: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {fontSize: 32, fontWeight: '900', color: palette.white, letterSpacing: -1, marginTop: 4},
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: palette.gray400,
    fontWeight: '500',
  },
  action: {paddingTop: 4, zIndex: 3},

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
});
