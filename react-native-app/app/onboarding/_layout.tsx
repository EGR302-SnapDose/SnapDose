import { useSemanticColor } from '@/hooks/use-theme-colors';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  const background = useSemanticColor('background');
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: { backgroundColor: background },
      }}
    />
  );
}
