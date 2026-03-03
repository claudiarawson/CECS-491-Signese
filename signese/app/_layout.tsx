import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dictionary/[signId]" options={{ title: "Sign" }} />
      <Stack.Screen name="dictionary/add-dialect" options={{ title: "Add Dialect" }} />
    </Stack>
  );
}