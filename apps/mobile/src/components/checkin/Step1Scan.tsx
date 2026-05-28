import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Luxe, LuxeFonts, LuxeRadii } from '../../theme/luxe';
import { useCheckinStore } from '../../stores/checkin.store';
import {
  extractIdDocument,
  hashDocumentNumber,
  type IdDocumentType,
} from '../../lib/ocr';

interface Step1Props {
  onDone: () => void;
}

const DOCS: Array<{ kind: IdDocumentType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { kind: 'passport', label: 'Scan Passport', icon: 'globe-outline' },
  { kind: 'aadhaar', label: 'Scan Aadhaar', icon: 'card-outline' },
  { kind: 'dl', label: 'Scan Driving Licence', icon: 'car-outline' },
];

export function Step1Scan({ onDone }: Step1Props) {
  const setId = useCheckinStore((s) => s.setId);
  const id = useCheckinStore((s) => s.id);

  const [permission, requestPermission] = useCameraPermissions();
  const [activeDoc, setActiveDoc] = useState<IdDocumentType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDob, setManualDob] = useState('');
  const [manualDocNum, setManualDocNum] = useState('');
  const cameraRef = useRef<CameraViewType | null>(null);

  const openCamera = useCallback(
    async (kind: IdDocumentType) => {
      if (!permission?.granted) {
        const next = await requestPermission();
        if (!next.granted) return;
      }
      setActiveDoc(kind);
    },
    [permission, requestPermission],
  );

  const capture = useCallback(async () => {
    if (!cameraRef.current || !activeDoc) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
        skipProcessing: true,
      });
      const result = await extractIdDocument(photo?.base64 ?? '', activeDoc);
      setId({ ...result, documentType: activeDoc });
      setActiveDoc(null);
      onDone();
    } catch {
      setProcessing(false);
    } finally {
      setProcessing(false);
    }
  }, [activeDoc, onDone, setId]);

  const submitManual = useCallback(async () => {
    if (!manualName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(manualDob) || !manualDocNum.trim()) return;
    setProcessing(true);
    const hash = await hashDocumentNumber(manualDocNum);
    setId({
      documentType: 'passport',
      full_name: manualName.trim(),
      date_of_birth: manualDob,
      document_number_hash: hash,
    });
    setProcessing(false);
    onDone();
  }, [manualName, manualDob, manualDocNum, onDone, setId]);

  if (activeDoc) {
    return (
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
        />
        <View pointerEvents="none" style={styles.guideOverlay}>
          <View style={styles.guideFrame} />
          <Text style={styles.guideText}>Align the document inside the frame</Text>
        </View>
        <View style={styles.cameraActions}>
          <Pressable onPress={() => setActiveDoc(null)} style={styles.cameraCancel}>
            <Text style={styles.cameraCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={capture}
            disabled={processing}
            style={[styles.shutter, processing && { opacity: 0.4 }]}
          >
            {processing ? (
              <ActivityIndicator size="small" color={Luxe.obsidian} />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
          <View style={styles.cameraCancel} />
        </View>
      </View>
    );
  }

  if (manual) {
    return (
      <View style={styles.body}>
        <Text style={styles.fieldLabel}>Full name on document</Text>
        <ManualField value={manualName} onChange={setManualName} placeholder="Arjun Mehta" />
        <Text style={styles.fieldLabel}>Date of birth (YYYY-MM-DD)</Text>
        <ManualField value={manualDob} onChange={setManualDob} placeholder="1991-04-12" />
        <Text style={styles.fieldLabel}>Document number</Text>
        <ManualField value={manualDocNum} onChange={setManualDocNum} placeholder="X1234567" />

        <Pressable
          onPress={submitManual}
          style={[styles.primaryBtn, processing && { opacity: 0.4 }]}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={Luxe.obsidian} />
          ) : (
            <Text style={styles.primaryBtnText}>Continue</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setManual(false)} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Back to scan</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <View style={styles.docCard}>
        {DOCS.map(({ kind, label, icon }) => (
          <Pressable key={kind} onPress={() => openCamera(kind)} style={styles.docBtn}>
            <Ionicons name={icon} size={18} color={Luxe.goldBright} />
            <Text style={styles.docBtnText}>{label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Luxe.muted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable onPress={() => setManual(true)} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>Enter details manually</Text>
      </Pressable>

      {id ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmKicker}>Captured</Text>
          <Text style={styles.confirmLine}>{id.full_name}</Text>
          <Text style={styles.confirmMeta}>
            {labelFor(id.documentType)} · DOB {id.date_of_birth}
          </Text>
          <Pressable onPress={onDone} style={[styles.primaryBtn, { marginTop: 18 }]}>
            <Text style={styles.primaryBtnText}>Looks right — continue</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function labelFor(d: IdDocumentType): string {
  if (d === 'passport') return 'Passport';
  if (d === 'aadhaar') return 'Aadhaar';
  return 'Driving Licence';
}

interface ManualFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

import { TextInput as RNTextInput } from 'react-native';

function ManualField({ value, onChange, placeholder }: ManualFieldProps) {
  return (
    <View style={styles.manualField}>
      <RNTextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Luxe.muted}
        style={styles.manualInput}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 8, gap: 16 },
  docCard: {
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
    overflow: 'hidden',
  },
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairline,
  },
  docBtnText: {
    flex: 1,
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 14,
    color: Luxe.ivory,
    letterSpacing: 0.2,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 4 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Luxe.hairlineStrong },
  dividerText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.muted,
    letterSpacing: 1.8,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: LuxeRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.graphite,
  },
  secondaryBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13,
    color: Luxe.ivory,
    letterSpacing: 0.6,
  },
  primaryBtn: {
    height: 54,
    borderRadius: LuxeRadii.md,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: Luxe.obsidian,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  confirmCard: {
    marginTop: 4,
    padding: 18,
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.35)',
    backgroundColor: 'rgba(212,168,87,0.06)',
  },
  confirmKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  confirmLine: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivory,
  },
  confirmMeta: {
    marginTop: 6,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
  },
  cameraWrap: { flex: 1, backgroundColor: '#000', minHeight: 520 },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrame: {
    width: '78%',
    aspectRatio: 1.58,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(244,201,126,0.85)',
  },
  guideText: {
    marginTop: 22,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: 'rgba(255,240,210,0.85)',
    textTransform: 'uppercase',
  },
  cameraActions: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cameraCancel: { minWidth: 80, alignItems: 'center' },
  cameraCancelText: {
    fontFamily: LuxeFonts.sansMedium,
    color: Luxe.ivory,
    fontSize: 13,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(244,201,126,0.5)',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Luxe.goldBright,
    borderWidth: 1,
    borderColor: Luxe.obsidian,
  },
  fieldLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  manualField: {
    borderRadius: LuxeRadii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
    paddingHorizontal: 14,
  },
  manualInput: {
    height: 48,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
  },
});
