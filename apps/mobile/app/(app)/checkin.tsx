import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckinChrome } from '../../src/components/checkin/CheckinChrome';
import { Step1Scan } from '../../src/components/checkin/Step1Scan';
import { Step2Preferences } from '../../src/components/checkin/Step2Preferences';
import { Step3Confirm } from '../../src/components/checkin/Step3Confirm';
import { useCheckinStore } from '../../src/stores/checkin.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { DEMO_RESERVATION } from '../../src/lib/demo';

export default function CheckinScreen() {
  useLuxeFonts();
  const router = useRouter();
  const step = useCheckinStore((s) => s.step);
  const next = useCheckinStore((s) => s.next);
  const back = useCheckinStore((s) => s.back);
  const reset = useCheckinStore((s) => s.reset);
  const submit = useCheckinStore((s) => s.submit);
  const result = useCheckinStore((s) => s.result);

  const liveReservation = useReservationStore((s) => s.reservation);
  const fetchActive = useReservationStore((s) => s.fetchActiveReservation);
  const reservation = liveReservation ?? DEMO_RESERVATION;
  const isDemo = !liveReservation;

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleBack = () => {
    if (step === 1) router.back();
    else back();
  };

  const handleSubmit = async () => {
    if (isDemo) {
      // Demo mode: skip API call, jump to key screen.
      useCheckinStore.setState({
        result: { mobileKeyStatus: 'pending_activation', roomNumber: reservation.room?.roomNumber ?? null },
      });
      setTimeout(() => router.replace('/(app)/key'), 600);
      return;
    }
    const ok = await submit(reservation.id);
    if (ok) {
      await fetchActive({ force: true });
      router.replace('/(app)/key');
    }
  };

  const titles: Record<1 | 2 | 3, { t: string; s?: string }> = {
    1: { t: 'Scan your ID', s: 'Hotel Kodai International verifies your identity once, privately, and the document is never stored.' },
    2: { t: 'Set your preferences', s: 'Your suite will be tuned to taste before you arrive.' },
    3: { t: 'Confirm your arrival', s: 'A last glance before your key activates.' },
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <CheckinChrome
            step={step}
            title={titles[step].t}
            subtitle={titles[step].s}
            onBack={handleBack}
          />

          {step === 1 ? <Step1Scan onDone={next} /> : null}
          {step === 2 ? <Step2Preferences onDone={next} /> : null}
          {step === 3 ? (
            <Step3Confirm reservation={reservation} onSubmit={handleSubmit} />
          ) : null}

          {result ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>
                Check-in complete · Key {result.mobileKeyStatus.replace(/_/g, ' ')}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  empty: {
    fontFamily: LuxeFonts.sansLight,
    color: Luxe.ivoryDim,
    fontSize: 14,
  },
  successBanner: {
    marginTop: 24,
    marginHorizontal: 22,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(212,168,87,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.4)',
  },
  successText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
