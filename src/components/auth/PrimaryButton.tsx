import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import {palette} from '../../theme/colors';
import {radii} from '../../theme/shape';

interface PrimaryButtonProps {
  loading?: boolean;
  onPress: () => void;
  title: string;
}

export const PrimaryButton = ({
  loading = false,
  onPress,
  title,
}: PrimaryButtonProps) => {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        pressed && !loading ? styles.buttonPressed : null,
        loading ? styles.buttonDisabled : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.textPrimary} />
      ) : (
        <Text style={styles.buttonLabel}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    height: 48,
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
