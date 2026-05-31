/**
 * Voice input hook — placeholder until OpenAI Whisper / expo-audio is wired.
 * Mic button tap focuses the keyboard so the user can type instead.
 */

import type { RefObject } from 'react';
import type { TextInput } from 'react-native';

export interface VoiceInputState {
  isRecording: boolean;
  isTranscribing: boolean;
  voiceError: string | null;
  toggle: () => void;
}

export function useVoiceInput(
  _onTranscript: (text: string) => void,
  inputRef?: RefObject<TextInput | null>,
): VoiceInputState {
  const toggle = () => {
    inputRef?.current?.focus();
  };

  return {
    isRecording: false,
    isTranscribing: false,
    voiceError: null,
    toggle,
  };
}
