import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette} from '../../theme/colors';
import {radii} from '../../theme/shape';
import {spacing} from '../../theme/spacing';

export default function EmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: string;
}) {
  return (
    <View style={styles.card}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {fontSize: 24},
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
