import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
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
    </Stack>
  );
}