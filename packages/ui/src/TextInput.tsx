import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing } from './theme';

export interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  leftIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  testID?: string;
  textContentType?: RNTextInputProps['textContentType'];
}

export function TextInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  error,
  leftIcon,
  secureTextEntry,
  maxLength,
  autoFocus,
  editable = true,
  style,
  testID,
  textContentType,
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? Colors.danger
    : focused
      ? Colors.teal
      : Colors.border;

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor }]}>
        {leftIcon ? <View style={{ marginRight: Spacing.sm }}>{leftIcon}</View> : null}
        <RNTextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoFocus={autoFocus}
          editable={editable}
          textContentType={textContentType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  error: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
