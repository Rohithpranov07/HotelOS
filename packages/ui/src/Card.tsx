import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from './theme';

export interface CardProps extends ViewProps {
  padding?: keyof typeof Spacing | number;
  style?: ViewStyle;
}

export function Card({ padding = 'lg', style, children, ...rest }: CardProps) {
  const pad = typeof padding === 'number' ? padding : Spacing[padding];
  return (
    <View style={[styles.card, { padding: pad }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
