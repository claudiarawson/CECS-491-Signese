import { Stack, router, useFocusEffect, useLocalSearchParams, usePathname } from "expo-router";
import React, { useCallback } from "react";

export default function DictionaryStackLayout() {
  const pathname = usePathname();
  const { q } = useLocalSearchParams<{ q?: string }>();

  // expo-router/tab navigators can preserve the last nested screen.
  // If the user comes back to the Dictionary tab while on "Add sign",
  // force-reset to the main dictionary list.
  useFocusEffect(
    useCallback(() => {
      if (typeof pathname === "string" && pathname.includes("add-dialect")) {
        router.replace(
          q ? { pathname: "/(tabs)/dictionary", params: { q } } : "/(tabs)/dictionary"
        );
      }
    }, [pathname, q])
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="add-dialect" />
    </Stack>
  );
}
