import { Stack } from "expo-router";
import React from "react";

export default function LearnFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[lessonId]" options={{ headerShown: false }} />
      <Stack.Screen name="quiz-sign" options={{ headerShown: false }} />
      <Stack.Screen name="type-answer" options={{ headerShown: false }} />
      <Stack.Screen name="match-signs" options={{ headerShown: false }} />
      <Stack.Screen name="lesson-complete" options={{ headerShown: false }} />
    </Stack>
  );
}
