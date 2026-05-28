import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface EscalationModalProps {
  visible: boolean;
  onConnect: () => void;
  onContinue: () => void;
}

export function EscalationModal({ visible, onConnect, onContinue }: EscalationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={['rgba(244,201,126,0.18)', 'transparent']}
            locations={[0, 0.55]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.topHairline} />

          <Text style={styles.kicker}>Concierge · Human</Text>
          <Text style={styles.title}>Connect with our team</Text>
          <Text style={styles.body}>
            Our team will continue this conversation. They can see your chat and your stay context,
            and will reply in moments.
          </Text>

          <Pressable onPress={onConnect} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Connect to staff</Text>
          </Pressable>
          <Pressable onPress={onContinue} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Continue with AI</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,7,10,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 36,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#0C0A08',
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.22)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.32)',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 2,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: Luxe.ivory,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  body: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
    marginBottom: 22,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Luxe.gold,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    letterSpacing: 1.4,
    color: '#1A1410',
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  secondaryBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13,
    letterSpacing: 1.4,
    color: Luxe.ivoryDim,
    textTransform: 'uppercase',
  },
});
