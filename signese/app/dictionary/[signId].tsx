import React from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SIGNS } from "../../src/features/dictionary/data/signs";

export default function SignDetail() {
  const { signId } = useLocalSearchParams<{ signId: string }>();
  const sign = SIGNS.find((s) => s.id === signId);

  return (
    <View style={{ flex: 1, padding: 18, backgroundColor: "#f4fbfa" }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "900" }}>← Back</Text>
      </Pressable>

      <Text style={{ fontSize: 30, fontWeight: "900" }}>{sign?.word ?? "Not found"}</Text>
      <Text style={{ marginTop: 12, fontWeight: "900" }}>Definition</Text>
      <Text>{sign?.definition ?? "No definition."}</Text>

      <Text style={{ marginTop: 12, fontWeight: "900" }}>How to Sign</Text>
      <Text>{sign?.howToSign ?? "No instructions."}</Text>

      {!!sign?.note && (
        <>
          <Text style={{ marginTop: 12, fontWeight: "900" }}>Note</Text>
          <Text>{sign.note}</Text>
        </>
      )}
    </View>
  );
}