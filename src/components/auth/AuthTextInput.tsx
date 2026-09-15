import React, {useState} from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import {palette} from '../../theme/colors';

const fieldColors = {
  accent: palette.primaryStrong,
  border: palette.border,
  label: palette.textMuted,
  placeholder: '#99A79F',
  shadow: palette.shadow,
  text: palette.textPrimary,
  white: palette.white,
};

type FieldIcon = 'mail' | 'lock' | 'building';

interface AuthTextInputProps {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  icon?: FieldIcon;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}

export const AuthTextInput = ({
  autoCapitalize = 'none',
  autoComplete,
  icon,
  keyboardType = 'default',
  label,
  onChangeText,
  onSubmitEditing,
  placeholder,
  secureTextEntry = false,
  value,
}: AuthTextInputProps) => {
  const [isHidden, setIsHidden] = useState(secureTextEntry);
  const leadingIcon = icon ?? (secureTextEntry ? 'lock' : 'mail');

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <View style={styles.leadingIcon}>
          {leadingIcon === 'lock' ? <LockIcon /> : leadingIcon === 'building' ? <BuildingIcon /> : <MailIcon />}
        </View>

        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={fieldColors.placeholder}
          returnKeyType={secureTextEntry ? 'go' : 'next'}
          secureTextEntry={isHidden}
          selectionColor={fieldColors.accent}
          style={styles.input}
          value={value}
        />

        {secureTextEntry ? (
          <Pressable
            hitSlop={10}
            onPress={() => setIsHidden(current => !current)}
            style={styles.trailingIcon}>
            <EyeIcon />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const MailIcon = () => (
  <View style={styles.iconFrame}>
    <View style={styles.mailBox} />
    <View style={[styles.mailFlap, styles.mailFlapLeft]} />
    <View style={[styles.mailFlap, styles.mailFlapRight]} />
  </View>
);

const LockIcon = () => (
  <View style={styles.iconFrame}>
    <View style={styles.lockHandle} />
    <View style={styles.lockBody} />
  </View>
);

const BuildingIcon = () => (
  <View style={styles.iconFrame}>
    <View style={styles.buildingBody} />
    <View style={styles.buildingRoof} />
  </View>
);

const EyeIcon = () => (
  <View style={styles.eyeShell}>
    <View style={styles.eyePupil} />
  </View>
);

const styles = StyleSheet.create({
  eyePupil: {
    backgroundColor: fieldColors.accent,
    borderRadius: 999,
    height: 4,
    width: 4,
  },
  eyeShell: {
    alignItems: 'center',
    borderColor: fieldColors.label,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 12,
    justifyContent: 'center',
    width: 18,
  },
  iconFrame: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  input: {
    color: fieldColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 12,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: fieldColors.white,
    borderColor: fieldColors.border,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 0,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  label: {
    color: fieldColors.label,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    marginBottom: 6,
  },
  leadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 20,
  },
  lockBody: {
    borderColor: fieldColors.accent,
    borderRadius: 4,
    borderWidth: 1.7,
    height: 10,
    marginTop: 7,
    width: 14,
  },
  lockHandle: {
    borderColor: fieldColors.accent,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.7,
    borderBottomWidth: 0,
    height: 9,
    position: 'absolute',
    top: 0,
    width: 10,
  },
  mailBox: {
    borderColor: fieldColors.accent,
    borderRadius: 3,
    borderWidth: 1.7,
    height: 12,
    width: 16,
  },
  mailFlap: {
    backgroundColor: fieldColors.accent,
    height: 1.7,
    position: 'absolute',
    top: 8,
    width: 8,
  },
  mailFlapLeft: {
    left: 1,
    transform: [{rotate: '34deg'}],
  },
  mailFlapRight: {
    right: 1,
    transform: [{rotate: '-34deg'}],
  },
  buildingBody: {
    borderColor: fieldColors.accent,
    borderRadius: 2,
    borderWidth: 1.7,
    height: 12,
    marginTop: 4,
    width: 14,
  },
  buildingRoof: {
    borderBottomColor: fieldColors.accent,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderLeftWidth: 7,
    borderRightColor: 'transparent',
    borderRightWidth: 7,
    height: 0,
    position: 'absolute',
    top: 0,
    width: 0,
  },
  trailingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    paddingVertical: 8,
    width: 22,
  },
  wrapper: {
    marginBottom: 16,
  },
});
