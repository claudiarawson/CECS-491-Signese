import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/src/services/firebase/firebase.config";
import { loadSettingsPreferences } from "@/src/features/settings/preferences.service";

/** Fires in the user's local timezone (device clock). */
export const STREAK_REMINDER_HOUR_LOCAL = 19;
export const STREAK_REMINDER_MINUTE_LOCAL = 0;

export const STREAK_REMINDER_KIND = "streak-login-reminder";
const ANDROID_CHANNEL_ID = "streak-reminders";
/** Single scheduled id so we never stack duplicate streak reminders on the device. */
export const STREAK_SCHEDULED_NOTIFICATION_ID = "signese-streak-login-v1";

type DateKey = `${number}-${string}-${string}`;

function getLocalDateKey(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyFromDate(d: Date): DateKey {
  return getLocalDateKey(d);
}

/**
 * Next one-shot reminder: if user already logged in today, schedule tomorrow evening;
 * otherwise prefer later today if before reminder time, else tomorrow.
 */
export function computeNextStreakReminderDate(
  now: Date,
  lastLoginDate: string | undefined,
  hour: number,
  minute: number
): Date {
  const todayKey = getLocalDateKey(now);
  const reminderToday = new Date(now);
  reminderToday.setHours(hour, minute, 0, 0);

  if (lastLoginDate === todayKey) {
    const next = new Date(reminderToday);
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (now.getTime() < reminderToday.getTime()) {
    return reminderToday;
  }

  const next = new Date(reminderToday);
  next.setDate(next.getDate() + 1);
  return next;
}

export function configureStreakReminderNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Streak reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}

export async function cancelScheduledStreakLoginReminders(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_SCHEDULED_NOTIFICATION_ID);
  } catch {
    // No prior schedule — ignore.
  }
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((p) => p.content.data?.kind === STREAK_REMINDER_KIND)
      .map((p) => Notifications.cancelScheduledNotificationAsync(p.identifier))
  );
}

function pickStreakReminderCopy(currentStreak: number | undefined): { title: string; body: string } {
  const n = typeof currentStreak === "number" && currentStreak > 0 ? currentStreak : undefined;
  const title = n && n > 1 ? `Keep your ${n}-day streak alive 🔥` : "Keep your streak alive 🔥";
  const alt = new Date().getDate() % 2 === 0;
  const body =
    n && n > 1
      ? `Log in today so you don't lose your ${n}-day streak.`
      : alt
        ? "Don't lose your streak! Log in today to keep it going."
        : "You're close to breaking your streak — open the app now to maintain it.";
  return { title, body };
}

async function persistReminderScheduleMeta(userId: string, targetDate: Date): Promise<void> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  await setDoc(
    doc(db, "users", userId),
    {
      streakNotifications: {
        lastReminderScheduledForDay: dateKeyFromDate(targetDate),
        lastReminderScheduledAt: serverTimestamp(),
        timezone: tz,
      },
    },
    { merge: true }
  );
}

export type SyncStreakReminderParams = {
  authenticated: boolean;
  userId?: string;
  lastLoginDate?: string;
  currentStreak?: number;
  pushEnabled: boolean;
  streakRemindersEnabled: boolean;
};

/**
 * Schedules at most one local notification. Cancels previous streak reminders first.
 * Requires physical permission; respects Settings toggles.
 */
export async function syncStreakLoginReminderSchedule(
  params: SyncStreakReminderParams
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  await ensureAndroidChannel();

  if (
    !params.authenticated ||
    !params.userId ||
    !params.pushEnabled ||
    !params.streakRemindersEnabled
  ) {
    await cancelScheduledStreakLoginReminders();
    return;
  }

  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") {
    await cancelScheduledStreakLoginReminders();
    return;
  }

  await cancelScheduledStreakLoginReminders();

  const now = new Date();
  const target = computeNextStreakReminderDate(
    now,
    params.lastLoginDate,
    STREAK_REMINDER_HOUR_LOCAL,
    STREAK_REMINDER_MINUTE_LOCAL
  );

  if (target.getTime() <= now.getTime()) {
    return;
  }

  const { title, body } = pickStreakReminderCopy(params.currentStreak);

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_SCHEDULED_NOTIFICATION_ID,
    content: {
      title,
      body,
      sound: true,
      data: {
        kind: STREAK_REMINDER_KIND,
        href: "/(tabs)/home",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  try {
    await persistReminderScheduleMeta(params.userId, target);
  } catch (e) {
    console.warn("streak reminder: failed to persist schedule metadata", e);
  }
}

/** Loads Settings and syncs from current auth + profile snapshot. */
export async function refreshStreakLoginReminderScheduleFromPreferences(
  profile: {
    uid: string;
    streak?: { lastLoginDate?: string; current?: number };
  } | null
): Promise<void> {
  const prefs = await loadSettingsPreferences();
  const user = auth.currentUser;
  if (!user) {
    await syncStreakLoginReminderSchedule({
      authenticated: false,
      userId: undefined,
      lastLoginDate: undefined,
      currentStreak: undefined,
      pushEnabled: prefs.notifications.pushNotifications,
      streakRemindersEnabled: prefs.notifications.streakLoginReminders,
    });
    return;
  }
  if (!profile || profile.uid !== user.uid) {
    return;
  }
  await syncStreakLoginReminderSchedule({
    authenticated: true,
    userId: user.uid,
    lastLoginDate: profile.streak?.lastLoginDate,
    currentStreak: profile.streak?.current,
    pushEnabled: prefs.notifications.pushNotifications,
    streakRemindersEnabled: prefs.notifications.streakLoginReminders,
  });
}

/**
 * Navigate after user taps a streak reminder. Waits for first auth resolution so routing is correct.
 */
export function routeAfterStreakReminderOpen(): void {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    try {
      if (user) {
        router.replace("/(tabs)/home" as any);
      } else {
        router.replace({
          pathname: "/(auth)/login",
          params: { redirect: "/(tabs)/home" },
        } as any);
      }
    } catch (e) {
      console.warn("Streak reminder deep link routing failed", e);
      try {
        router.replace("/" as any);
      } catch {
        /* ignore */
      }
    }
  });
}

export function isStreakReminderResponse(data: Record<string, unknown> | undefined): boolean {
  return data?.kind === STREAK_REMINDER_KIND;
}
