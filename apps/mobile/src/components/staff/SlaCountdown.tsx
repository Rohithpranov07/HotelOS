import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface SlaCountdownProps {
  deadline: string | null;
  compact?: boolean;
}

export function getSlaRemainingMinutes(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.round(diff / 60_000);
}

export function SlaCountdown({ deadline, compact }: SlaCountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!deadline) {
    return <Text style={[styles.text, styles.muted]}>NO SLA</Text>;
  }
  const diffMs = new Date(deadline).getTime() - now;
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const breached = diffMs < 0;
  const urgent = !breached && mins < 10;

  const color = breached ? styles.breached : urgent ? styles.urgent : styles.ok;

  const body = breached
    ? `SLA · BREACHED ${formatPos(Math.abs(diffMs))} AGO`
    : `SLA · ${pad(mins)}:${pad(secs)} REMAINING`;

  return <Text style={[styles.text, color, compact && styles.compact]}>{body}</Text>;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatPos(ms: number): string {
  const m = Math.floor(ms / 60_000);
  return m < 60 ? `${m}M` : `${Math.floor(m / 60)}H ${m % 60}M`;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  compact: { fontSize: 10 },
  ok: { color: Luxe.gold },
  urgent: { color: '#F4C97E' },
  breached: { color: '#E27A6E' },
  muted: { color: Luxe.muted },
});
