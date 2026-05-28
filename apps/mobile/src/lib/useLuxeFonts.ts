import {
  useFonts as useNewsreader,
  Newsreader_300Light,
  Newsreader_300Light_Italic,
  Newsreader_400Regular,
} from '@expo-google-fonts/newsreader';
import {
  Onest_300Light,
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
} from '@expo-google-fonts/onest';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

export function useLuxeFonts(): boolean {
  const [loaded] = useNewsreader({
    Newsreader_300Light,
    Newsreader_300Light_Italic,
    Newsreader_400Regular,
    Onest_300Light,
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  return loaded;
}
