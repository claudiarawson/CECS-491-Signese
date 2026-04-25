import React, { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useLastNotificationResponse } from "expo-notifications";
import {
  configureStreakReminderNotificationHandler,
  isStreakReminderResponse,
  routeAfterStreakReminderOpen,
} from "@/src/services/notifications/streakReminderNotifications";

let handlerConfigured = false;

function StreakReminderNotificationBootstrapNative() {
  const lastResponse = useLastNotificationResponse();

  useEffect(() => {
    if (!handlerConfigured) {
      configureStreakReminderNotificationHandler();
      handlerConfigured = true;
    }
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (!isStreakReminderResponse(data)) {
        return;
      }
      routeAfterStreakReminderOpen();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    const data = lastResponse.notification.request.content.data as Record<string, unknown> | undefined;
    if (!isStreakReminderResponse(data)) {
      return;
    }
    routeAfterStreakReminderOpen();
    void Notifications.clearLastNotificationResponseAsync();
  }, [lastResponse]);

  return null;
}

/**
 * Registers notification defaults, tap routing for streak reminders, and cold-start deep links.
 * Render once inside the root layout (under providers). No-op on web.
 */
export function StreakReminderNotificationBootstrap() {
  if (Platform.OS === "web") {
    return null;
  }
  return <StreakReminderNotificationBootstrapNative />;
}
