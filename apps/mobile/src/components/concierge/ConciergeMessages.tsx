import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface AIKickerProps {
  time: string;
}

export function AIKicker({ time }: AIKickerProps) {
  return (
    <View style={styles.kickerRow}>
      <View style={styles.miniOrbWrap}>
        <LinearGradient
          colors={['#F4C97E', '#D4A857', '#8B6F47', '#F4C97E']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.miniOrbHighlight} />
      </View>
      <Text style={styles.kickerText}>Concierge</Text>
      <Text style={styles.kickerTime}>{time}</Text>
    </View>
  );
}

interface ChipAction {
  label: string;
  primary?: boolean;
  onPress?: () => void;
}

interface AIMessageProps {
  time: string;
  text?: string;
  highlight?: string; // italic gold accent inside text (replaces "{HL}" placeholder)
  actions?: ChipAction[];
  children?: React.ReactNode;
}

export function AIMessage({ time, text, highlight, actions, children }: AIMessageProps) {
  const segments = highlight && text?.includes('{HL}')
    ? text.split('{HL}')
    : null;

  return (
    <View>
      <AIKicker time={time} />
      {text ? (
        <Text style={styles.aiText}>
          {segments ? (
            <>
              {segments[0]}
              <Text style={styles.aiAccent}>{highlight}</Text>
              {segments[1]}
            </>
          ) : (
            text
          )}
        </Text>
      ) : null}
      {children ? <View style={{ marginTop: text ? 12 : 0 }}>{children}</View> : null}
      {actions && actions.length ? (
        <View style={styles.chipRow}>
          {actions.map((a, i) => (
            <Pressable
              key={`${a.label}-${i}`}
              onPress={a.onPress}
              style={[styles.chip, a.primary ? styles.chipPrimary : styles.chipGhost]}
            >
              <Text style={a.primary ? styles.chipPrimaryText : styles.chipGhostText}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface UserMessageProps {
  time: string;
  text: string;
}

export function UserMessage({ time, text }: UserMessageProps) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <LinearGradient
        colors={['#1A1813', '#14110D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.userBubble}
      >
        <Text style={styles.userText}>{text}</Text>
      </LinearGradient>
      <Text style={styles.userTime}>{time}</Text>
    </View>
  );
}

export function SystemMessage({ text }: { text: string }) {
  return (
    <View style={styles.systemWrap}>
      <Text style={styles.systemText}>{text}</Text>
    </View>
  );
}

export function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const loops = dots.map((v, i) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: -5, duration: 380, useNativeDriver: true, delay: i * 130 }),
          Animated.timing(v, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return anim;
    });
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View>
      <AIKicker time="now" />
      <View style={styles.typingBubble}>
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: v }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  miniOrbWrap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    shadowColor: '#F4C97E',
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  miniOrbHighlight: {
    position: 'absolute',
    top: 1,
    left: 2,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,240,210,0.7)',
  },
  kickerText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  kickerTime: {
    marginLeft: 'auto',
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1,
  },
  aiText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    lineHeight: 27,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  aiAccent: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.goldBright,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipPrimary: {
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.gold,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  chipGhost: {
    backgroundColor: 'rgba(244,201,126,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.32)',
  },
  chipPrimaryText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12.5,
    color: '#1A1410',
  },
  chipGhostText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12.5,
    color: Luxe.ivory,
  },
  userBubble: {
    maxWidth: '78%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderTopRightRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  userText: {
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    lineHeight: 20,
  },
  userTime: {
    marginTop: 6,
    marginRight: 4,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1,
  },
  systemWrap: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  systemText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
    textTransform: 'uppercase',
  },
  typingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    backgroundColor: 'rgba(244,201,126,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.goldBright,
  },
});
