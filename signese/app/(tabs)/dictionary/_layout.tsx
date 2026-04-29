import { Stack } from "expo-router";
import React from "react";

export default function DictionaryStackLayout() {
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
