import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { Colors, Radius } from './theme';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  autoFocus = true,
  error,
  disabled,
}: OtpInputProps) {
  const refs = useRef<Array<RNTextInput | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
  }, [value, length, onComplete]);

  const setDigit = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, '');

    if (clean.length > 1) {
      // Paste case: fill from current index
      const next = (value.slice(0, index) + clean).slice(0, length);
      onChange(next);
      const focusIdx = Math.min(next.length, length - 1);
      refs.current[focusIdx]?.focus();
      return;
    }

    const chars = value.split('');
    chars[index] = clean;
    const next = chars.join('').slice(0, length);
    onChange(next);

    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const chars = value.split('');
      chars[index - 1] = '';
      onChange(chars.join(''));
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const filled = !!value[i];
        const borderColor = error
          ? Colors.danger
          : filled
            ? Colors.teal
            : Colors.border;
        return (
          <RNTextInput
            key={i}
            ref={(r) => {
              refs.current[i] = r;
            }}
            value={value[i] ?? ''}
            onChangeText={(t) => setDigit(i, t)}
            onKeyPress={(e) => onKeyPress(i, e)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!disabled}
            textContentType="oneTimeCode"
            style={[styles.cell, { borderColor }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cell: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.background,
  },
});
