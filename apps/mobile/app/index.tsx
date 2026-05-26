import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-navy">
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text className="text-white text-4xl font-bold mb-2">Hotel OS</Text>
          <Text className="text-teal-light text-base text-center">
            Guest super-app · scaffold ready
          </Text>
        </Animated.View>
        <View className="mt-12 rounded-xl bg-navy-light px-5 py-4">
          <Text className="text-white text-xs opacity-70">T-01 scaffold complete</Text>
          <Text className="text-white text-xs opacity-70">Next: T-02 Prisma schema</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
