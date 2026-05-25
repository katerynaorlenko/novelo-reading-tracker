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

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: "Kateryna",
    bio: "Building a consistent reading habit with Novelo.",
    favoriteGenre: "Romance",
  });

  const [draftProfile, setDraftProfile] = useState<ProfileData>(profile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setDraftProfile(parsedProfile);
      }
    } catch (error) {
      console.log("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    if (!draftProfile.name.trim()) {
      Alert.alert("Name required", "Please enter your profile name.");
      return;
    }

    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(draftProfile));
      setProfile(draftProfile);
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

            <Text style={styles.bio}>{profile.bio}</Text>

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
            Reading goals, reminders and app preferences
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personalization</Text>

        <View style={styles.featureRow}>
          <Ionicons name="image-outline" size={22} color="#6C63FF" />
          <Text style={styles.featureText}>Profile photo</Text>
          <Text style={styles.comingSoon}>Soon</Text>
        </View>

        <View style={styles.featureRow}>
          <Ionicons name="color-palette-outline" size={22} color="#6C63FF" />
          <Text style={styles.featureText}>Theme customization</Text>
          <Text style={styles.comingSoon}>Soon</Text>
        </View>

        <View style={styles.featureRow}>
          <Ionicons name="trophy-outline" size={22} color="#6C63FF" />
          <Text style={styles.featureText}>Reading achievements</Text>
          <Text style={styles.comingSoon}>Soon</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>

        <Text style={styles.cardText}>
          Cloud sync, login and backup can be added later when the project moves
          from local storage to backend storage.
        </Text>
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
    marginBottom: 20,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ECECF7",
    marginBottom: 18,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  name: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  role: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },

  bio: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 16,
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
    marginTop: 16,
  },

  genrePillText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6C63FF",
  },

  editProfileButton: {
    marginTop: 18,
    backgroundColor: "#6C63FF",
    borderRadius: 18,
    paddingVertical: 15,
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
    minHeight: 100,
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
    marginBottom: 18,
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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECECF7",
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F6",
  },

  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginLeft: 10,
  },

  comingSoon: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6C63FF",
    backgroundColor: "#F2EFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  cardText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
});
