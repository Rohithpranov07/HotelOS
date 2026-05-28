import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

const heights: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const fontSizes: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  leftIcon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyle = (() => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.teal, borderColor: Colors.teal };
      case 'secondary':
        return { backgroundColor: Colors.background, borderColor: Colors.teal };
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' };
      case 'danger':
        return { backgroundColor: Colors.danger, borderColor: Colors.danger };
    }
  })();

  const textColor =
    variant === 'primary' || variant === 'danger' ? '#FFFFFF' : Colors.teal;

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        { height: heights[size], opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={{ marginRight: Spacing.sm }}>{leftIcon}</View> : null}
          <Text style={[styles.text, { color: textColor, fontSize: fontSizes[size] }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '600' },
});
