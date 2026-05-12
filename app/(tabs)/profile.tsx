import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your reading identity and settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FF",
    padding: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    marginTop: 24,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
});
