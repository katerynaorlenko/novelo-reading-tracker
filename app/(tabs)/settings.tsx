import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  const setupNotificationChannel = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reading-reminders", {
        name: "Reading Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  };

  const requestNotificationPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      setNotificationMessage(
        "Notification permission is required to enable reminders.",
      );
      return false;
    }

    return true;
  };

  const scheduleDailyReminder = async () => {
    const granted = await requestNotificationPermission();

    if (!granted) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to read 📚",
          body: "Open Novelo and continue your reading progress today.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });

      setDailyReminderEnabled(true);
      setNotificationMessage("Daily reminder is enabled for 20:00.");
    } catch (error) {
      console.log("Error scheduling daily reminder:", error);
      setNotificationMessage("Could not schedule daily reminder.");
    }
  };

  const scheduleTestReminder = async () => {
    const granted = await requestNotificationPermission();

    if (!granted) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Novelo test reminder",
          body: "This is a local notification test.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
          repeats: false,
        },
      });

      setNotificationMessage("Test reminder will appear in 3 seconds.");
    } catch (error) {
      console.log("Error scheduling test reminder:", error);
      setNotificationMessage("Could not schedule test reminder.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your reading experience</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reading Reminders</Text>
        <Text style={styles.sectionDescription}>
          Stay consistent with your reading habit by enabling daily reminders.
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Daily Reminder Status</Text>
          <View
            style={[
              styles.statusBadge,
              dailyReminderEnabled
                ? styles.statusBadgeEnabled
                : styles.statusBadgeDisabled,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                dailyReminderEnabled
                  ? styles.statusBadgeTextEnabled
                  : styles.statusBadgeTextDisabled,
              ]}
            >
              {dailyReminderEnabled ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={scheduleDailyReminder}>
          <Text style={styles.primaryButtonText}>Enable Daily Reminder</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={scheduleTestReminder}
        >
          <Text style={styles.secondaryButtonText}>Send Test Reminder</Text>
        </Pressable>

        {notificationMessage ? (
          <Text style={styles.notificationMessage}>{notificationMessage}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <Text style={styles.preferenceItem}>
          • Notifications for reading reminders
        </Text>
        <Text style={styles.preferenceItem}>• Reading progress tracking</Text>
        <Text style={styles.preferenceItem}>
          • Personal reading notes and quotes
        </Text>
        <Text style={styles.preferenceHint}>
          More customization options can be added here later.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.sectionDescription}>
          This section is planned for the future. It can include profile
          details, reading goals, and personal preferences.
        </Text>

        <View style={styles.comingSoonBox}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Profile settings, avatar, personal goals, and more.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  sectionDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 14,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeEnabled: {
    backgroundColor: "#DCFCE7",
  },

  statusBadgeDisabled: {
    backgroundColor: "#F3F4F6",
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  statusBadgeTextEnabled: {
    color: "#166534",
  },

  statusBadgeTextDisabled: {
    color: "#6B7280",
  },

  primaryButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  secondaryButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  notificationMessage: {
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
  },

  preferenceItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },

  preferenceHint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
  },

  comingSoonBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },

  comingSoonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4338CA",
    marginBottom: 6,
  },

  comingSoonText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});
