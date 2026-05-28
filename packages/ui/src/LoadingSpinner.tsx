import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from './theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullscreen?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color = Colors.teal,
  fullscreen,
  style,
}: LoadingSpinnerProps) {
  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, style]}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={color} style={style} />;
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
