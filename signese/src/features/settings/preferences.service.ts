import { readLocalJson, writeLocalJson } from "@/src/storage/localJsonFile";

const SETTINGS_FILE = "settings_preferences.json";
const WEB_SETTINGS_KEY = "signese_settings_preferences";

export type NotificationPreferences = {
  pushNotifications: boolean;
  dailyLearnReminders: boolean;
  /** Evening nudge to log in and keep your daily streak (local notification). */
  streakLoginReminders: boolean;
  dictionaryPostNotifications: boolean;
};

export type AppearancePreferences = {
  darkMode: boolean;
  classicLook: boolean;
};

export type PrivacyPreferences = {
  sendAnalyticsData: boolean;
};

export type SettingsPreferences = {
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
  privacy: PrivacyPreferences;
};

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  notifications: {
    pushNotifications: true,
    dailyLearnReminders: false,
    streakLoginReminders: true,
    dictionaryPostNotifications: false,
  },
  appearance: {
    darkMode: false,
    classicLook: true,
  },
  privacy: {
    sendAnalyticsData: false,
  },
};

export async function loadSettingsPreferences(): Promise<SettingsPreferences> {
  const raw = await readLocalJson<Partial<SettingsPreferences> | null>(
    SETTINGS_FILE,
    WEB_SETTINGS_KEY,
    null
  );

  if (!raw) return DEFAULT_SETTINGS_PREFERENCES;

  return {
    notifications: {
      pushNotifications:
        typeof raw.notifications?.pushNotifications === "boolean"
          ? raw.notifications.pushNotifications
          : DEFAULT_SETTINGS_PREFERENCES.notifications.pushNotifications,
      dailyLearnReminders:
        typeof raw.notifications?.dailyLearnReminders === "boolean"
          ? raw.notifications.dailyLearnReminders
          : DEFAULT_SETTINGS_PREFERENCES.notifications.dailyLearnReminders,
      streakLoginReminders:
        typeof raw.notifications?.streakLoginReminders === "boolean"
          ? raw.notifications.streakLoginReminders
          : DEFAULT_SETTINGS_PREFERENCES.notifications.streakLoginReminders,
      dictionaryPostNotifications:
        typeof raw.notifications?.dictionaryPostNotifications === "boolean"
          ? raw.notifications.dictionaryPostNotifications
          : DEFAULT_SETTINGS_PREFERENCES.notifications.dictionaryPostNotifications,
    },
    appearance: {
      darkMode:
        typeof raw.appearance?.darkMode === "boolean"
          ? raw.appearance.darkMode
          : DEFAULT_SETTINGS_PREFERENCES.appearance.darkMode,
      classicLook:
        typeof raw.appearance?.classicLook === "boolean"
          ? raw.appearance.classicLook
          : DEFAULT_SETTINGS_PREFERENCES.appearance.classicLook,
    },
    privacy: {
      sendAnalyticsData:
        typeof raw.privacy?.sendAnalyticsData === "boolean"
          ? raw.privacy.sendAnalyticsData
          : DEFAULT_SETTINGS_PREFERENCES.privacy.sendAnalyticsData,
    },
  };
}

export async function saveSettingsPreferences(next: SettingsPreferences): Promise<void> {
  await writeLocalJson(SETTINGS_FILE, WEB_SETTINGS_KEY, next);
}

