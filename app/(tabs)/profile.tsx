import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ProfileData = {
  name: string;
  bio: string;
  favoriteGenre: string;
};

const PROFILE_KEY = "novelo_profile";
const READING_PREFERENCES_KEY = "novelo_reading_preferences";

type ReadingPreferences = {
  mode: string;
  favoriteTime: string;
};

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: "Kateryna",
    bio: "Building a consistent reading habit with Novelo.",
    favoriteGenre: "Romance",
  });

  const [draftProfile, setDraftProfile] = useState<ProfileData>(profile);

  const [readingPreferences, setReadingPreferences] =
    useState<ReadingPreferences>({
      mode: "Focused",
      favoriteTime: "Afternoon",
    });

  useEffect(() => {
    loadProfile();
    loadReadingPreferences();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile) as ProfileData;
        setProfile(parsedProfile);
        setDraftProfile(parsedProfile);
      }
    } catch (error) {
      console.log("Error loading profile:", error);
    }
  };

  const loadReadingPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(
        READING_PREFERENCES_KEY,
      );

      if (savedPreferences) {
        const parsedPreferences = JSON.parse(
          savedPreferences,
        ) as ReadingPreferences;

        setReadingPreferences(parsedPreferences);
      }
    } catch (error) {
      console.log("Error loading reading preferences:", error);
    }
  };

  const saveProfile = async () => {
    const trimmedProfile: ProfileData = {
      name: draftProfile.name.trim(),
      bio: draftProfile.bio.trim(),
      favoriteGenre: draftProfile.favoriteGenre.trim(),
    };

    if (!trimmedProfile.name) {
      Alert.alert("Name required", "Please enter your profile name.");
      return;
    }

    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(trimmedProfile));
      setProfile(trimmedProfile);
      setDraftProfile(trimmedProfile);
      setIsEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error) {
      console.log("Error saving profile:", error);
      Alert.alert("Error", "Could not save your profile.");
    }
  };

  const cancelEditing = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your personal reading space</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.name.trim().charAt(0).toUpperCase() || "N"}
          </Text>
        </View>

        {isEditing ? (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={draftProfile.name}
              onChangeText={(text) =>
                setDraftProfile({ ...draftProfile, name: text })
              }
              placeholder="Enter your name"
              placeholderTextColor="#A7AAB5"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={draftProfile.bio}
              onChangeText={(text) =>
                setDraftProfile({ ...draftProfile, bio: text })
              }
              placeholder="Write something about your reading style"
              placeholderTextColor="#A7AAB5"
              multiline
            />

            <Text style={styles.label}>Favorite Genre</Text>
            <TextInput
              style={styles.input}
              value={draftProfile.favoriteGenre}
              onChangeText={(text) =>
                setDraftProfile({ ...draftProfile, favoriteGenre: text })
              }
              placeholder="Example: Fantasy"
              placeholderTextColor="#A7AAB5"
            />

            <View style={styles.editButtonsRow}>
              <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={saveProfile}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>Novelo Reader</Text>

            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.genrePill}>
              <Ionicons name="heart-outline" size={18} color="#6C63FF" />
              <Text style={styles.genrePillText}>
                {profile.favoriteGenre || "No favorite genre yet"}
              </Text>
            </View>

            <Pressable
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable
        style={styles.menuCard}
        onPress={() => router.push("/settings" as never)}
      >
        <View style={styles.menuIcon}>
          <Ionicons name="settings-outline" size={24} color="#6C63FF" />
        </View>

        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Settings</Text>
          <Text style={styles.menuSubtitle}>
            Reading goals, reminders and preferences
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
      </Pressable>

      <View style={styles.readingStyleCard}>
        <View style={styles.cardHeader}>
          <View style={styles.smallIconBox}>
            <Ionicons name="sparkles-outline" size={22} color="#6C63FF" />
          </View>

          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Reading Style</Text>
            <Text style={styles.cardSubtitle}>
              A short summary of your current reading routine.
            </Text>
          </View>
        </View>

        <View style={styles.styleRow}>
          <Text style={styles.styleLabel}>Mode</Text>
          <Text style={styles.styleValue}>{readingPreferences.mode}</Text>
        </View>

        <View style={styles.styleRow}>
          <Text style={styles.styleLabel}>Favorite time</Text>
          <Text style={styles.styleValue}>
            {readingPreferences.favoriteTime}
          </Text>
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
    marginTop: 22,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 18,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECECF7",
    marginBottom: 16,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 25,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  name: {
    fontSize: 27,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  role: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 3,
  },

  bio: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 12,
  },

  genrePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#F2EFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },

  genrePillText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6C63FF",
  },

  editProfileButton: {
    marginTop: 16,
    backgroundColor: "#6C63FF",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  editProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  label: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },

  bioInput: {
    minHeight: 90,
    textAlignVertical: "top",
    lineHeight: 22,
  },

  editButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#EEF0F5",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#374151",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#6C63FF",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ECECF7",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#F2EFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  menuTextWrapper: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  menuSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },

  readingStyleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECECF7",
    marginBottom: 18,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },

  smallIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F2EFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },

  styleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F6",
  },

  styleLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "700",
  },

  styleValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "900",
  },
});
