import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type BookStatus = "planned" | "reading" | "finished";

type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  coverUri?: string;
};

const STORAGE_KEY = "novelo_books";

export default function StatisticsScreen() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const savedBooks = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      }
    } catch (error) {
      console.log("Error loading books:", error);
    }
  };

  const totalBooks = books.length;
  const plannedBooks = books.filter((book) => book.status === "planned").length;
  const readingBooks = books.filter((book) => book.status === "reading").length;
  const finishedBooks = books.filter(
    (book) => book.status === "finished",
  ).length;
  const totalPagesRead = books.reduce((sum, book) => sum + book.currentPage, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Reading Statistics</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalBooks}</Text>
          <Text style={styles.statLabel}>Total Books</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{plannedBooks}</Text>
          <Text style={styles.statLabel}>Planned</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{readingBooks}</Text>
          <Text style={styles.statLabel}>Reading</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{finishedBooks}</Text>
          <Text style={styles.statLabel}>Finished</Text>
        </View>
      </View>

      <View style={styles.pagesReadCard}>
        <Text style={styles.pagesReadValue}>{totalPagesRead}</Text>
        <Text style={styles.pagesReadLabel}>Total Pages Read</Text>
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6C63FF",
  },

  statLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },

  pagesReadCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 8,
  },

  pagesReadValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4338CA",
  },

  pagesReadLabel: {
    fontSize: 15,
    color: "#555",
    marginTop: 6,
  },
});
