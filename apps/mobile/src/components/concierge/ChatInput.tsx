import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface ChatInputProps {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onVoice: () => void;
  voiceActive: boolean;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onVoice,
  voiceActive,
}: ChatInputProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.tint} />
      <View style={styles.border} pointerEvents="none" />
      <LinearGradient
        colors={['transparent', 'rgba(244,201,126,0.30)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topHairline}
      />

      <View style={styles.row}>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="add" size={16} color={Luxe.titanium} />
        </Pressable>

        {voiceActive ? (
          <Waveform />
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={() => value && onSend()}
            placeholder="Ask the concierge…"
            placeholderTextColor={Luxe.muted}
            style={styles.input}
            returnKeyType="send"
          />
        )}

        {value ? (
          <Pressable onPress={onSend} style={styles.sendBtn}>
            <Ionicons name="arrow-up" size={16} color="#1A1410" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onVoice}
            style={[styles.micBtn, voiceActive && styles.micBtnActive]}
          >
            <Ionicons
              name="mic-outline"
              size={16}
              color={voiceActive ? '#1A1410' : Luxe.goldBright}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Waveform() {
  const bars = Array.from({ length: 22 }).map(() => useRef(new Animated.Value(0.4)).current);

  useEffect(() => {
    const loops = bars.map((v, i) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 320 + (i % 4) * 80,
            useNativeDriver: true,
            delay: i * 35,
          }),
          Animated.timing(v, {
            toValue: 0.3,
            duration: 320 + (i % 4) * 60,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return anim;
    });
    return () => loops.forEach((l) => l.stop());
  }, [bars]);

  return (
    <View style={styles.waveform}>
      {bars.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            { transform: [{ scaleY: v }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(18,16,12,0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.85,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,16,12,0.72)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.08)',
  },
  input: {
    flex: 1,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  micBtnActive: {
    backgroundColor: Luxe.goldBright,
    borderColor: 'transparent',
    shadowColor: Luxe.gold,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Luxe.goldBright,
    shadowColor: Luxe.gold,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  waveform: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  waveBar: {
    width: 2.4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Luxe.goldBright,
  },
});
