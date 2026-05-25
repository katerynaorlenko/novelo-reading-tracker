import { Ionicons } from "@expo/vector-icons";
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
const READING_MODE_KEY = "novelo_reading_mode";
const FAVORITE_TIME_KEY = "novelo_favorite_reading_time";

type ReminderTime = {
  hour: number;
  minute: number;
};

type ReadingGoal = {
  booksPerYear: number;
  pagesPerDay: number;
};

type ReadingMode = "calm" | "focused" | "motivated";
type FavoriteReadingTime = "morning" | "afternoon" | "evening" | "night";

export default function SettingsScreen() {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const [preferenceMessage, setPreferenceMessage] = useState("");

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState<ReminderTime>({
    hour: 20,
    minute: 0,
  });

  const [booksPerYear, setBooksPerYear] = useState("35");
  const [pagesPerDay, setPagesPerDay] = useState("50");

  const [readingMode, setReadingMode] = useState<ReadingMode>("calm");
  const [favoriteReadingTime, setFavoriteReadingTime] =
    useState<FavoriteReadingTime>("evening");

  useEffect(() => {
    setupNotificationChannel();
    loadReminderSettings();
    loadReadingGoal();
    loadPreferences();
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
        setSelectedTime(JSON.parse(savedTime));
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

  const loadPreferences = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(READING_MODE_KEY);
      const savedTime = await AsyncStorage.getItem(FAVORITE_TIME_KEY);

      if (
        savedMode === "calm" ||
        savedMode === "focused" ||
        savedMode === "motivated"
      ) {
        setReadingMode(savedMode);
      }

      if (
        savedTime === "morning" ||
        savedTime === "afternoon" ||
        savedTime === "evening" ||
        savedTime === "night"
      ) {
        setFavoriteReadingTime(savedTime);
      }
    } catch (error) {
      console.log("Error loading preferences:", error);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0",
    )}`;
  };

  const saveReminderSettings = async (enabled: boolean, time: ReminderTime) => {
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
    await AsyncStorage.setItem(REMINDER_TIME_KEY, JSON.stringify(time));
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
          hour: selectedTime.hour,
          minute: selectedTime.minute,
        },
      });

      setDailyReminderEnabled(true);
      await saveReminderSettings(true, selectedTime);

      setNotificationMessage(
        `Daily reminder is enabled for ${formatTime(
          selectedTime.hour,
          selectedTime.minute,
        )}.`,
      );
    } catch (error) {
      console.log("Error scheduling reminder:", error);
      setNotificationMessage("Could not schedule daily reminder.");
    }
  };

  const disableDailyReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setDailyReminderEnabled(false);
      await saveReminderSettings(false, selectedTime);
      setNotificationMessage("Daily reminder has been disabled.");
    } catch (error) {
      console.log("Error disabling reminder:", error);
      setNotificationMessage("Could not disable daily reminder.");
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

  const changeHour = (direction: "up" | "down") => {
    setSelectedTime((current) => {
      const newHour =
        direction === "up" ? (current.hour + 1) % 24 : (current.hour + 23) % 24;

      return {
        ...current,
        hour: newHour,
      };
    });
  };

  const changeMinute = (direction: "up" | "down") => {
    setSelectedTime((current) => {
      const newMinute =
        direction === "up"
          ? (current.minute + 5) % 60
          : (current.minute + 55) % 60;

      return {
        ...current,
        minute: newMinute,
      };
    });
  };

  const saveReadingGoal = async () => {
    setGoalMessage("");

    const booksGoal = Number(booksPerYear);
    const pagesGoal = Number(pagesPerDay);

    if (!Number.isInteger(booksGoal) || booksGoal <= 0) {
      setGoalMessage("Books per year must be greater than 0.");
      return;
    }

    if (!Number.isInteger(pagesGoal) || pagesGoal <= 0) {
      setGoalMessage("Pages per day must be greater than 0.");
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

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem(READING_MODE_KEY, readingMode);
      await AsyncStorage.setItem(FAVORITE_TIME_KEY, favoriteReadingTime);
      setPreferenceMessage("Reading preferences saved successfully.");
    } catch (error) {
      console.log("Error saving preferences:", error);
      setPreferenceMessage("Could not save reading preferences.");
    }
  };

  const renderOption = (
    label: string,
    value: string,
    activeValue: string,
    onPress: () => void,
  ) => {
    const isActive = value === activeValue;

    return (
      <Pressable
        style={[styles.optionButton, isActive && styles.optionButtonActive]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.optionButtonText,
            isActive && styles.optionButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Personalize your Novelo experience</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="notifications-outline" size={24} color="#6C63FF" />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.sectionTitle}>Reading Reminders</Text>
            <Text style={styles.sectionDescription}>
              Build consistency with daily reading alerts.
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Daily reminder</Text>

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

        <Text style={styles.label}>Reminder time</Text>

        <View style={styles.timeCard}>
          <Text style={styles.timeText}>
            {formatTime(selectedTime.hour, selectedTime.minute)}
          </Text>

          <View style={styles.timeControls}>
            <Pressable
              style={styles.timeButton}
              onPress={() => changeHour("up")}
            >
              <Text style={styles.timeButtonText}>Hour +</Text>
            </Pressable>

            <Pressable
              style={styles.timeButton}
              onPress={() => changeMinute("up")}
            >
              <Text style={styles.timeButtonText}>Min +</Text>
            </Pressable>
          </View>

          <View style={styles.timeControls}>
            <Pressable
              style={styles.timeButtonSecondary}
              onPress={() => changeHour("down")}
            >
              <Text style={styles.timeButtonSecondaryText}>Hour -</Text>
            </Pressable>

            <Pressable
              style={styles.timeButtonSecondary}
              onPress={() => changeMinute("down")}
            >
              <Text style={styles.timeButtonSecondaryText}>Min -</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={
            dailyReminderEnabled ? disableDailyReminder : scheduleDailyReminder
          }
        >
          <Text style={styles.primaryButtonText}>
            {dailyReminderEnabled ? "Disable Reminder" : "Enable Reminder"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={scheduleTestReminder}
        >
          <Text style={styles.secondaryButtonText}>Send Test Reminder</Text>
        </Pressable>

        {notificationMessage ? (
          <Text style={styles.message}>{notificationMessage}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="flag-outline" size={24} color="#6C63FF" />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.sectionTitle}>Reading Goals</Text>
            <Text style={styles.sectionDescription}>
              Set clear goals for your yearly reading progress.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Books per year</Text>
        <TextInput
          style={styles.input}
          value={booksPerYear}
          onChangeText={setBooksPerYear}
          keyboardType="numeric"
          placeholder="Example: 35"
          placeholderTextColor="#A7AAB5"
        />

        <Text style={styles.label}>Pages per day</Text>
        <TextInput
          style={styles.input}
          value={pagesPerDay}
          onChangeText={setPagesPerDay}
          keyboardType="numeric"
          placeholder="Example: 50"
          placeholderTextColor="#A7AAB5"
        />

        <Pressable style={styles.primaryButton} onPress={saveReadingGoal}>
          <Text style={styles.primaryButtonText}>Save Reading Goals</Text>
        </Pressable>

        {goalMessage ? <Text style={styles.message}>{goalMessage}</Text> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="sparkles-outline" size={24} color="#6C63FF" />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.sectionTitle}>Reading Preferences</Text>
            <Text style={styles.sectionDescription}>
              Adjust the app to match your reading routine.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Reading mode</Text>

        <View style={styles.optionsRow}>
          {renderOption("Calm", "calm", readingMode, () =>
            setReadingMode("calm"),
          )}
          {renderOption("Focused", "focused", readingMode, () =>
            setReadingMode("focused"),
          )}
          {renderOption("Motivated", "motivated", readingMode, () =>
            setReadingMode("motivated"),
          )}
        </View>

        <Text style={styles.label}>Favorite reading time</Text>

        <View style={styles.optionsWrap}>
          {renderOption("Morning", "morning", favoriteReadingTime, () =>
            setFavoriteReadingTime("morning"),
          )}
          {renderOption("Afternoon", "afternoon", favoriteReadingTime, () =>
            setFavoriteReadingTime("afternoon"),
          )}
          {renderOption("Evening", "evening", favoriteReadingTime, () =>
            setFavoriteReadingTime("evening"),
          )}
          {renderOption("Night", "night", favoriteReadingTime, () =>
            setFavoriteReadingTime("night"),
          )}
        </View>

        <Pressable style={styles.primaryButton} onPress={savePreferences}>
          <Text style={styles.primaryButtonText}>Save Preferences</Text>
        </Pressable>

        {preferenceMessage ? (
          <Text style={styles.message}>{preferenceMessage}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="color-palette-outline" size={24} color="#6C63FF" />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.sectionTitle}>Personalization</Text>
            <Text style={styles.sectionDescription}>
              Extra customization options planned for future versions.
            </Text>
          </View>
        </View>

        <View style={styles.preferenceRow}>
          <Ionicons name="image-outline" size={22} color="#6C63FF" />
          <Text style={styles.preferenceText}>Profile photo</Text>
          <View style={styles.soonBadge}>
            <Text style={styles.soonBadgeText}>Soon</Text>
          </View>
        </View>

        <View style={styles.preferenceRow}>
          <Ionicons name="moon-outline" size={22} color="#6C63FF" />
          <Text style={styles.preferenceText}>Dark mode</Text>
          <View style={styles.soonBadge}>
            <Text style={styles.soonBadgeText}>Soon</Text>
          </View>
        </View>

        <View style={styles.preferenceRow}>
          <Ionicons name="trophy-outline" size={22} color="#6C63FF" />
          <Text style={styles.preferenceText}>Reading achievements</Text>
          <View style={styles.soonBadge}>
            <Text style={styles.soonBadgeText}>Soon</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="information-circle-outline" size={24} color="#6C63FF" />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.sectionTitle}>About Novelo</Text>
            <Text style={styles.sectionDescription}>
              A personal reading tracker built with Expo and React Native.
            </Text>
          </View>
        </View>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Storage</Text>
          <Text style={styles.aboutValue}>Local device</Text>
        </View>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Native features</Text>
          <Text style={styles.aboutValue}>Images, reminders</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FF",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 150,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#ECECF7",
  },

  cardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  cardHeaderText: {
    flex: 1,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F2EFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },

  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 20,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  statusLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  statusBadgeEnabled: {
    backgroundColor: "#DCFCE7",
  },

  statusBadgeDisabled: {
    backgroundColor: "#F3F4F6",
  },

  statusBadgeText: {
    fontSize: 13,
    fontWeight: "900",
  },

  statusBadgeTextEnabled: {
    color: "#166534",
  },

  statusBadgeTextDisabled: {
    color: "#6B7280",
  },

  label: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  timeCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },

  timeText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#6C63FF",
    textAlign: "center",
    marginBottom: 14,
  },

  timeControls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  timeButton: {
    flex: 1,
    backgroundColor: "#6C63FF",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },

  timeButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  timeButtonSecondary: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2DAFF",
  },

  timeButtonSecondaryText: {
    color: "#6C63FF",
    fontWeight: "900",
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
    color: "#111827",
  },

  primaryButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: "#0F766E",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  message: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 12,
  },

  optionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  optionButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  optionButtonActive: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  optionButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
  },

  optionButtonTextActive: {
    color: "#FFFFFF",
  },

  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F6",
  },

  preferenceText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "800",
  },

  soonBadge: {
    backgroundColor: "#F2EFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  soonBadgeText: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "900",
  },

  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F6",
  },

  aboutLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "700",
  },

  aboutValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "900",
  },
});