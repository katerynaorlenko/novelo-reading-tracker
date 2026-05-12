import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const REMINDER_ENABLED_KEY = "novelo_daily_reminder_enabled";
const REMINDER_TIME_KEY = "novelo_daily_reminder_time";
const READING_GOAL_KEY = "novelo_reading_goal";

type ReminderTime = {
  hour: number;
  minute: number;
};

type ReadingGoal = {
  booksPerYear: number;
  pagesPerDay: number;
};

export default function SettingsScreen() {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState<ReminderTime>({
    hour: 20,
    minute: 0,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [booksPerYear, setBooksPerYear] = useState("12");
  const [pagesPerDay, setPagesPerDay] = useState("30");
  const [goalMessage, setGoalMessage] = useState("");

  useEffect(() => {
    setupNotificationChannel();
    loadReminderSettings();
    loadReadingGoal();
  }, []);

  const setupNotificationChannel = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reading-reminders", {
        name: "Reading Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  };

  const loadReminderSettings = async () => {
    try {
      const savedEnabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
      const savedTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);

      if (savedEnabled) {
        setDailyReminderEnabled(savedEnabled === "true");
      }

      if (savedTime) {
        const parsed = JSON.parse(savedTime) as ReminderTime;
        setSelectedTime(parsed);
      }
    } catch (error) {
      console.log("Error loading reminder settings:", error);
    }
  };

  const loadReadingGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem(READING_GOAL_KEY);

      if (savedGoal) {
        const parsed: ReadingGoal = JSON.parse(savedGoal);
        setBooksPerYear(String(parsed.booksPerYear));
        setPagesPerDay(String(parsed.pagesPerDay));
      }
    } catch (error) {
      console.log("Error loading reading goal:", error);
    }
  };

  const saveReminderSettings = async (enabled: boolean, time: ReminderTime) => {
    try {
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
      await AsyncStorage.setItem(REMINDER_TIME_KEY, JSON.stringify(time));
    } catch (error) {
      console.log("Error saving reminder settings:", error);
    }
  };

  const saveReadingGoal = async () => {
    setGoalMessage("");

    const booksGoal = Number(booksPerYear);
    const pagesGoal = Number(pagesPerDay);

    if (!Number.isInteger(booksGoal) || booksGoal <= 0) {
      setGoalMessage("Books per year must be a whole number greater than 0.");
      return;
    }

    if (!Number.isInteger(pagesGoal) || pagesGoal <= 0) {
      setGoalMessage("Pages per day must be a whole number greater than 0.");
      return;
    }

    if (booksGoal > 500 || pagesGoal > 5000) {
      setGoalMessage("Please choose realistic goal values.");
      return;
    }

    try {
      const goal: ReadingGoal = {
        booksPerYear: booksGoal,
        pagesPerDay: pagesGoal,
      };

      await AsyncStorage.setItem(READING_GOAL_KEY, JSON.stringify(goal));
      setGoalMessage("Reading goals saved successfully.");
    } catch (error) {
      console.log("Error saving reading goal:", error);
      setGoalMessage("Could not save reading goals.");
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

  const formatTime = (hour: number, minute: number) => {
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const scheduleDailyReminder = async (time: ReminderTime) => {
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
          hour: time.hour,
          minute: time.minute,
        },
      });

      setDailyReminderEnabled(true);
      await saveReminderSettings(true, time);
      setNotificationMessage(
        `Daily reminder is enabled for ${formatTime(time.hour, time.minute)}.`,
      );
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
          body: `This is a local notification test for ${formatTime(
            selectedTime.hour,
            selectedTime.minute,
          )}.`,
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

  const handleTimeChange = async (event: { type?: string }, date?: Date) => {
    setShowTimePicker(false);

    if (event.type === "dismissed" || !date) {
      return;
    }

    const newTime = {
      hour: date.getHours(),
      minute: date.getMinutes(),
    };

    setSelectedTime(newTime);

    if (dailyReminderEnabled) {
      await scheduleDailyReminder(newTime);
    } else {
      await saveReminderSettings(false, newTime);
      setNotificationMessage(
        `Reminder time selected: ${formatTime(newTime.hour, newTime.minute)}`,
      );
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

        <Text style={styles.timeTitle}>Reminder Time</Text>

        <Pressable
          style={styles.timePickerButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timePickerButtonText}>
            {formatTime(selectedTime.hour, selectedTime.minute)}
          </Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={() => scheduleDailyReminder(selectedTime)}
        >
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
        <Text style={styles.sectionTitle}>Reading Goals</Text>
        <Text style={styles.sectionDescription}>
          Set simple goals to turn reading into a consistent habit.
        </Text>

        <Text style={styles.label}>Books per year</Text>
        <TextInput
          style={styles.input}
          value={booksPerYear}
          onChangeText={setBooksPerYear}
          keyboardType="numeric"
          placeholder="Example: 12"
        />

        <Text style={styles.label}>Pages per day</Text>
        <TextInput
          style={styles.input}
          value={pagesPerDay}
          onChangeText={setPagesPerDay}
          keyboardType="numeric"
          placeholder="Example: 30"
        />

        <Pressable style={styles.primaryButton} onPress={saveReadingGoal}>
          <Text style={styles.primaryButtonText}>Save Reading Goals</Text>
        </Pressable>

        {goalMessage ? (
          <Text style={styles.notificationMessage}>{goalMessage}</Text>
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

  timeTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },

  timePickerButton: {
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14,
  },

  timePickerButtonText: {
    color: "#5B21B6",
    fontSize: 16,
    fontWeight: "700",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
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
