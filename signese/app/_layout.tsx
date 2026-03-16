import { Stack } from "expo-router";
import { AuthUserProvider } from "@/src/contexts/AuthUserContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthUserProvider>
      <Stack>
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
      </Stack>
    </AuthUserProvider>
  );
}