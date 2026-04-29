import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Radius, semanticColors, Spacing, Typography } from "@/src/theme";
import { Surfaces } from "@/src/theme/surfaces";

export type StarsNextUnlock = {
  title: string;
  starsRequired: number;
  currentBalance: number;
};

type Props = {
  /** Lifetime stars earned (never decreases when user spends). */
  totalEarned: number;
  /** Current spendable balance. */
  balance: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  /** Shown only when `starsRequired` &gt; 0. */
  nextUnlock?: StarsNextUnlock | null;
  /** Larger hero layout vs compact strip. */
  variant?: "hero" | "compact";
  appearance?: "light" | "dark";
};

const darkAppearance = StyleSheet.create({
  wrap: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  kicker: { color: "rgba(255,255,255,0.6)" },
  bigNumber: { color: "#F9A8D4" },
  earned: { color: "rgba(255,255,255,0.95)" },
  available: { color: "rgba(255,255,255,0.7)" },
  hint: { color: "rgba(255,255,255,0.5)" },
  loading: { color: "rgba(255,255,255,0.65)" },
  unlockBlock: { borderTopColor: "rgba(255,255,255,0.1)" },
  unlockLabel: { color: "rgba(255,255,255,0.92)" },
  track: { backgroundColor: "rgba(0,0,0,0.35)" },
  fill: { backgroundColor: "rgba(244, 114, 182, 0.9)" },
  meta: { color: "rgba(255,255,255,0.65)" },
});

export function StarsProgressPanel({
  totalEarned,
  balance,
  isLoading = false,
  errorMessage = null,
  nextUnlock = null,
  variant = "hero",
  appearance = "light",
}: Props) {
  const d = appearance === "dark";
  const showAvailable = balance !== totalEarned || variant === "hero";
  const unlock =
    nextUnlock && nextUnlock.starsRequired > 0
      ? {
          ...nextUnlock,
          pct: Math.min(100, Math.round((nextUnlock.currentBalance / nextUnlock.starsRequired) * 100)),
        }
      : null;

  const summaryA11y = `You've earned ${totalEarned} stars.${
    showAvailable ? ` ${balance} available to spend.` : ""
  }`;

  if (isLoading) {
    return (
      <View
        style={[
          styles.wrap,
          variant === "compact" && styles.wrapCompact,
          d && darkAppearance.wrap,
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading stars progress"
      >
        <ActivityIndicator color={d ? "#F472B6" : "#214F46"} />
        <Text style={[styles.loadingCaption, d && darkAppearance.loading]}>
          Loading your stars…
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.wrap, styles.wrapError]} accessibilityRole="alert">
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        variant === "compact" && styles.wrapCompact,
        d && darkAppearance.wrap,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={summaryA11y}
    >
      <Text style={[styles.kicker, d && darkAppearance.kicker]}>Your stars</Text>
      <Text
        style={[
          styles.bigNumber,
          variant === "compact" && styles.bigNumberCompact,
          d && darkAppearance.bigNumber,
        ]}
        accessibilityLiveRegion="polite"
      >
        {totalEarned}
      </Text>
      <Text style={[styles.earnedLine, d && darkAppearance.earned]}>
        You’ve earned {totalEarned} stars
      </Text>
      {showAvailable ? (
        <Text style={[styles.availableLine, d && darkAppearance.available]}>
          {balance} available to unlock content and icons
        </Text>
      ) : null}
      <Text style={[styles.hint, d && darkAppearance.hint]}>Keep going to unlock more content.</Text>

      {unlock ? (
        <View
          style={[styles.unlockBlock, d && darkAppearance.unlockBlock]}
          accessibilityLabel={`Progress toward ${unlock.title}`}
        >
          <Text style={[styles.unlockLabel, d && darkAppearance.unlockLabel]}>
            Next unlock: {unlock.title} ({unlock.starsRequired} ⭐)
          </Text>
          <View style={[styles.track, d && darkAppearance.track]}>
            <View style={[styles.fill, d && darkAppearance.fill, { width: `${unlock.pct}%` }]} />
          </View>
          <Text style={[styles.unlockMeta, d && darkAppearance.meta]}>
            {unlock.currentBalance} / {unlock.starsRequired} stars
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Surfaces.hairline,
    backgroundColor: Surfaces.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  wrapCompact: {
    paddingVertical: Spacing.sm,
  },
  wrapError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  kicker: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  bigNumber: {
    ...Typography.screenTitle,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    color: "#B45309",
  },
  bigNumberCompact: {
    fontSize: 28,
    lineHeight: 32,
  },
  earnedLine: {
    ...Typography.body,
    color: semanticColors.text.primary,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  availableLine: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: 4,
  },
  hint: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  loadingCaption: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: "#B91C1C",
    fontWeight: "600",
  },
  unlockBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Surfaces.hairline,
  },
  unlockLabel: {
    ...Typography.caption,
    color: semanticColors.text.primary,
    fontWeight: "700",
  },
  track: {
    marginTop: Spacing.xs,
    height: 8,
    borderRadius: 4,
    backgroundColor: Surfaces.cardMuted,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#F2C318",
  },
  unlockMeta: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: 4,
  },
});
