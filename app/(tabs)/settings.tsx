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

      setNotificationMessage("Daily reminder scheduled for 20:00.");
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reading Reminders</Text>

        <Pressable
          style={styles.reminderButton}
          onPress={scheduleDailyReminder}
        >
          <Text style={styles.reminderButtonText}>Enable Daily Reminder</Text>
        </Pressable>

        <Pressable
          style={styles.testReminderButton}
          onPress={scheduleTestReminder}
        >
          <Text style={styles.testReminderButtonText}>Send Test Reminder</Text>
        </Pressable>

        {notificationMessage ? (
          <Text style={styles.notificationMessage}>{notificationMessage}</Text>
        ) : null}
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
    marginBottom: 24,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  reminderButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  reminderButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  testReminderButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  testReminderButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  notificationMessage: {
    marginTop: 10,
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
});
