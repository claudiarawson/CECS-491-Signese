import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  getDeviceDensity,
  semanticColors,
  Typography,
  moderateScale,
} from "@/src/theme";
import { ScreenContainer, ScreenHeader, HeaderActionButton, SectionCard } from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";

const avatars = ["🐨", "🐼", "🐱", "🐰", "🐻", "🦊"];

export default function AccountScreen() {
  const { profile, setProfileAvatar } = useAuthUser();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density);

  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar ?? "🐨");
  const stars = 0;
  const dayStreak = 1;

  React.useEffect(() => {
    if (profile?.avatar) {
      setSelectedAvatar(profile.avatar);
    }
  }, [profile?.avatar]);

  const handleSelectAvatar = async (avatar: string) => {
    setSelectedAvatar(avatar);
    await setProfileAvatar(avatar);
  };

  return (
    <ScreenContainer backgroundColor="#F1F6F5" contentStyle={styles.content}>
      <ScreenHeader
        title="Account"
        right={
          <>
            <HeaderActionButton iconName="home" onPress={() => router.push("/(tabs)/home")} />
            <HeaderActionButton iconName="settings" onPress={() => router.push("/(tabs)/settings")} />
          </>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainStack}>
          <View style={styles.heroAvatarWrap}>
            <Text style={styles.heroAvatar}>{selectedAvatar}</Text>
          </View>

          <View style={styles.starPill}>
            <Text style={styles.starPillText}>⭐ {stars} Stars</Text>
          </View>

          <SectionCard style={styles.blockCard}>
            <Text style={styles.blockTitle}>Choose Your Avatar</Text>
            <View style={styles.avatarGrid}>
              {avatars.map((avatar) => {
                const selected = avatar === selectedAvatar;
                return (
                  <Pressable
                    key={avatar}
                    style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
                    onPress={() => void handleSelectAvatar(avatar)}
                  >
                    <Text style={styles.avatarOptionEmoji}>{avatar}</Text>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard style={styles.blockCard}>
            <Text style={styles.blockTitle}>Your Progress</Text>
            <View style={styles.progressRow}>
              <View style={[styles.progressCard, styles.progressStreak]}>
                <Text style={styles.progressValue}>{dayStreak}</Text>
                <Text style={styles.progressLabel}>Day Streak</Text>
                <Text style={styles.progressEmoji}>🔥</Text>
              </View>
              <View style={[styles.progressCard, styles.progressStars]}>
                <Text style={styles.progressValue}>{stars}</Text>
                <Text style={styles.progressLabel}>Stars ⭐</Text>
              </View>
            </View>
          </SectionCard>

          <Pressable style={styles.signOutBtn} onPress={() => router.replace("/")}>
            <MaterialIcons name="logout" size={moderateScale(18)} color="#FFFFFF" />
            <Text style={styles.signOutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (density: number) => {
  const ms = (value: number) => moderateScale(value) * density;

  return StyleSheet.create({
  content: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  mainStack: {
    paddingTop: 20,
    paddingBottom: 16,
    gap: 7,
  },

  heroAvatarWrap: {
    width: ms(68),
    height: ms(68),
    borderRadius: ms(34),
    backgroundColor: "#E6DDF0",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  heroAvatar: {
    fontSize: ms(34),
  },

  starPill: {
    backgroundColor: "#E9DEC1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "center",
  },

  starPillText: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    fontSize: ms(12),
  },

  blockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 0,
  },

  blockTitle: {
    ...Typography.sectionTitle,
    color: semanticColors.text.secondary,
    fontSize: ms(15),
    textAlign: "center",
    marginBottom: 7,
  },

  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    rowGap: 8,
    columnGap: 10,
  },

  avatarOption: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: "#E9F0EF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  avatarOptionSelected: {
    borderColor: "#43B3A8",
    backgroundColor: "#E0F4F1",
  },

  avatarOptionEmoji: {
    fontSize: ms(18),
  },

  progressRow: {
    flexDirection: "row",
    gap: 8,
  },

  progressCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  progressStreak: {
    backgroundColor: "#CADBDD",
  },

  progressStars: {
    backgroundColor: "#DDD4E8",
  },

  progressValue: {
    ...Typography.statNumber,
    fontSize: ms(18),
    lineHeight: ms(20),
    color: "#5BAFB0",
  },

  progressLabel: {
    ...Typography.body,
    color: semanticColors.text.secondary,
    fontSize: ms(12),
  },

  progressEmoji: {
    fontSize: ms(11),
    marginTop: 3,
  },

  signOutBtn: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    height: 47,
    borderRadius: 19,
    backgroundColor: "#E55555",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  signOutText: {
    ...Typography.button,
    fontSize: ms(16),
    color: "#FFFFFF",
  },
  });
};