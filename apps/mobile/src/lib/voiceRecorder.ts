/**
 * Feature-detected wrapper around `expo-av` for voice notes. If expo-av isn't
 * installed, the recorder simulates the timer-only flow so the UX still works
 * end-to-end (it returns a `local://` URI so the rest of the pipeline
 * continues unchanged).
 */

interface RecorderInstance {
  prepareToRecordAsync: (options: unknown) => Promise<void>;
  startAsync: () => Promise<void>;
  stopAndUnloadAsync: () => Promise<void>;
  getURI: () => string | null;
}

interface AvApi {
  Audio: {
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    setAudioModeAsync: (mode: Record<string, unknown>) => Promise<void>;
    RecordingOptionsPresets: { HIGH_QUALITY: unknown };
    Recording: { new (): RecorderInstance };
    Sound: {
      createAsync: (
        source: { uri: string },
      ) => Promise<{
        sound: {
          playAsync: () => Promise<void>;
          unloadAsync: () => Promise<void>;
          setOnPlaybackStatusUpdate: (cb: (s: { didJustFinish?: boolean }) => void) => void;
        };
      }>;
    };
  };
}

function loadAv(): AvApi | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-av') as AvApi;
  } catch {
    return null;
  }
}

export class VoiceRecorder {
  private recorder: RecorderInstance | null = null;
  private fakeUri: string | null = null;

  async start(): Promise<boolean> {
    const av = loadAv();
    if (!av) {
      this.fakeUri = `local://voice-note-${Date.now()}.m4a`;
      return true;
    }
    const perm = await av.Audio.requestPermissionsAsync();
    if (!perm.granted) return false;
    await av.Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const recording = new av.Audio.Recording();
    await recording.prepareToRecordAsync(av.Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    this.recorder = recording;
    return true;
  }

  async stop(): Promise<string | null> {
    if (!this.recorder) {
      const uri = this.fakeUri;
      this.fakeUri = null;
      return uri;
    }
    try {
      await this.recorder.stopAndUnloadAsync();
      const uri = this.recorder.getURI();
      this.recorder = null;
      return uri ?? null;
    } catch {
      this.recorder = null;
      return null;
    }
  }
}

export async function playVoiceNote(uri: string, onEnd?: () => void): Promise<() => void> {
  const av = loadAv();
  if (!av || uri.startsWith('local://')) {
    // No-op playback in demo / fallback mode.
    setTimeout(() => onEnd?.(), 800);
    return () => {};
  }
  const { sound } = await av.Audio.Sound.createAsync({ uri });
  sound.setOnPlaybackStatusUpdate((s) => {
    if (s.didJustFinish) {
      onEnd?.();
      void sound.unloadAsync();
    }
  });
  await sound.playAsync();
  return () => {
    void sound.unloadAsync();
  };
}
