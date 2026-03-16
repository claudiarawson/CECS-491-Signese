import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Tabs */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* Dictionary screens */}
      <Stack.Screen
        name="dictionary/[signId]"
        options={{ title: "Sign" }}
      />

      <Stack.Screen
        name="dictionary/add-dialect"
        options={{ title: "Add Dialect" }}
      />

      {/* Settings (hide the stack header) */}
      <Stack.Screen
        name="settings"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}