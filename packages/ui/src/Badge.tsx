import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors, Radius } from './theme';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  default: { bg: '#F1F4FA', fg: Colors.text },
  success: { bg: '#E1F2D6', fg: Colors.success },
  warning: { bg: '#FAEEDA', fg: Colors.warning },
  danger: { bg: '#FBE3E3', fg: Colors.danger },
  info: { bg: Colors.primaryLight, fg: Colors.teal },
  bronze: { bg: '#F4E0CC', fg: '#7E4F1F' },
  silver: { bg: '#ECECEC', fg: '#5A5A5A' },
  gold: { bg: '#FAEEDA', fg: '#854F0B' },
  platinum: { bg: '#E1DEF6', fg: Colors.platinum },
};

export function Badge({ label, tone = 'default', style }: BadgeProps) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
