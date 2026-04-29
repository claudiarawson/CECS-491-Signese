import { Stack } from "expo-router";
import { AuthUserProvider } from "@/src/contexts/AuthUserContext";
import { AccessibilityProvider } from "@/src/contexts/AccessibilityContext";
import { TranslationHistoryProvider } from "@/src/features/translate/translationHistory";
import { StreakReminderNotificationBootstrap } from "@/src/services/notifications/StreakReminderNotificationBootstrap";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthUserProvider>
      <AccessibilityProvider>
        <TranslationHistoryProvider>
          <StreakReminderNotificationBootstrap />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade_from_bottom",
              animationDuration: 180,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="settings/index" options={{ headerShown: false }} />
            <Stack.Screen name="settings/about" options={{ headerShown: false }} />
            <Stack.Screen name="settings/accessibility" options={{ headerShown: false }} />
            <Stack.Screen name="settings/feedback" options={{ headerShown: false }} />
            <Stack.Screen name="dictionary/[signId]" options={{ title: "Sign" }} />
            <Stack.Screen name="dictionary/add-dialect" options={{ title: "Add Dialect" }} />
            <Stack.Screen name="translate/history" options={{ headerShown: false }} />
          </Stack>
        </TranslationHistoryProvider>
      </AccessibilityProvider>
    </AuthUserProvider>
  );
}
