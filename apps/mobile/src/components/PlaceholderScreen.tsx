import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Colors } from '@hotel-os/ui';

export interface PlaceholderScreenProps {
  title: string;
  description: string;
  upcoming: string;
}

export function PlaceholderScreen({ title, description, upcoming }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={{ marginTop: 16 }}>
          <Badge label={upcoming} tone="info" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.navy },
  description: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
});
