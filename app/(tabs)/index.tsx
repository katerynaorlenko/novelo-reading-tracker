import { StyleSheet, Text, View } from "react-native";

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novelo</Text>
      <Text style={styles.subtitle}>My Library</Text>
      <Text style={styles.text}>No books yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 20,
    marginTop: 8,
  },
  text: {
    fontSize: 16,
    marginTop: 16,
    color: "#666",
  },
});
