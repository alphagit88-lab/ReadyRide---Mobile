import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {palette} from '../../theme/colors';
import {radii, shadowPresets} from '../../theme/shape';
import {spacing} from '../../theme/spacing';

export type SelectOption = {
  id: string;
  label: string;
};

export default function SelectSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {options.map(option => {
              const active = selectedId === option.id;
              return (
                <TouchableOpacity
                  key={option.id || 'none'}
                  style={[styles.item, active && styles.itemActive]}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}>
                  <Text style={[styles.itemText, active && styles.itemTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: `${palette.textPrimary}59`,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '72%',
    borderWidth: 1,
    borderColor: palette.border,
    ...shadowPresets.card,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 1,
    backgroundColor: palette.borderStrong,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  list: {flexGrow: 0},
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: palette.primarySoft,
  },
  itemText: {
    fontSize: 15,
    color: palette.textPrimary,
    textAlign: 'left',
    fontWeight: '500',
  },
  itemTextActive: {
    color: palette.primaryStrong,
    fontWeight: '800',
  },
  close: {
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: palette.gray100,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    color: palette.gray600,
    fontSize: 14,
    fontWeight: '600',
  },
});
