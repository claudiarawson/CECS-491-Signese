import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
<<<<<<< HEAD
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
=======
      {/* Tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Dictionary stack screens */}
      <Stack.Screen
        name="dictionary/[signId]"
        options={{ title: "Sign" }}
      />
      <Stack.Screen
        name="dictionary/add-dialect"
        options={{ title: "Add Dialect" }}
      />

      {/* Settings stack (HIDE HEADER HERE) */}
      <Stack.Screen
        name="settings"
        options={{ headerShown: false }}
      />
>>>>>>> feature/dictionary-settings-nav
    </Stack>
  );
}