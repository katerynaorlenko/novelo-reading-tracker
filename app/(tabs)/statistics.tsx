import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type BookStatus = "planned" | "reading" | "finished";

type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  rating?: number;
  coverUri?: string;
  notes?: string;
  favoriteQuote?: string;
  thoughts?: string;
  summary?: string;
};

const STORAGE_KEY = "novelo_books";
const MAX_TOTAL_PAGES = 5000;

export default function StatisticsScreen() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    loadBooks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, []),
  );

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

  const stats = useMemo(() => {
    const validBooks = books.filter(
      (book) =>
        book.totalPages > 0 &&
        book.totalPages <= MAX_TOTAL_PAGES &&
        book.currentPage >= 0 &&
        book.currentPage <= book.totalPages,
    );

    const totalBooks = validBooks.length;
    const plannedBooks = validBooks.filter(
      (book) => book.status === "planned",
    ).length;
    const readingBooks = validBooks.filter(
      (book) => book.status === "reading",
    ).length;
    const finishedBooks = validBooks.filter(
      (book) => book.status === "finished",
    ).length;

    const totalPagesRead = validBooks.reduce(
      (sum, book) => sum + book.currentPage,
      0,
    );

    const totalPagesInLibrary = validBooks.reduce(
      (sum, book) => sum + book.totalPages,
      0,
    );

    const completionRate =
      totalBooks === 0 ? 0 : Math.round((finishedBooks / totalBooks) * 100);

    const averageProgress =
      validBooks.length === 0
        ? 0
        : Math.round(
            validBooks.reduce(
              (sum, book) => sum + (book.currentPage / book.totalPages) * 100,
              0,
            ) / validBooks.length,
          );

    const ratedBooks = validBooks.filter((book) => (book.rating || 0) > 0);
    const ratedBooksCount = ratedBooks.length;

    const averageRating =
      ratedBooksCount === 0
        ? 0
        : Number(
            (
              ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) /
              ratedBooksCount
            ).toFixed(1),
          );

    return {
      totalBooks,
      plannedBooks,
      readingBooks,
      finishedBooks,
      totalPagesRead,
      totalPagesInLibrary,
      completionRate,
      averageProgress,
      averageRating,
      ratedBooksCount,
    };
  }, [books]);

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);

    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              star <= rounded ? styles.starFilled : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Reading Statistics</Text>
      <Text style={styles.subtitle}>Your reading overview in one place</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroValue}>{stats.completionRate}%</Text>
        <Text style={styles.heroLabel}>Completion Rate</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalBooks}</Text>
          <Text style={styles.statLabel}>Total Books</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.plannedBooks}</Text>
          <Text style={styles.statLabel}>Planned</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.readingBooks}</Text>
          <Text style={styles.statLabel}>Reading</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.finishedBooks}</Text>
          <Text style={styles.statLabel}>Finished</Text>
        </View>
      </View>

      <View style={styles.largeCard}>
        <Text style={styles.largeCardValue}>{stats.totalPagesRead}</Text>
        <Text style={styles.largeCardLabel}>Total Pages Read</Text>
      </View>

      <View style={styles.largeCard}>
        <Text style={styles.largeCardValue}>{stats.totalPagesInLibrary}</Text>
        <Text style={styles.largeCardLabel}>Total Pages in Library</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.averageProgress}%</Text>
          <Text style={styles.summaryLabel}>Average Progress</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {stats.readingBooks}:{stats.finishedBooks}
          </Text>
          <Text style={styles.summaryLabel}>Reading vs Finished</Text>
        </View>
      </View>

      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>Library Rating</Text>

        {stats.ratedBooksCount === 0 ? (
          <Text style={styles.ratingEmptyText}>No rated books yet</Text>
        ) : (
          <>
            <Text style={styles.ratingValue}>{stats.averageRating} / 5</Text>
            {renderStars(stats.averageRating)}
            <Text style={styles.ratingSubtext}>
              Based on {stats.ratedBooksCount} rated book
              {stats.ratedBooksCount > 1 ? "s" : ""}
            </Text>
          </>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Quick Insight</Text>
        <Text style={styles.infoText}>
          {stats.totalBooks === 0
            ? "Start by adding your first book to build your reading library."
            : `You have ${stats.totalBooks} books in your library, ${stats.finishedBooks} finished, and ${stats.readingBooks} currently in progress.`}
        </Text>
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

  heroCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 18,
  },

  heroValue: {
    fontSize: 34,
    fontWeight: "700",
    color: "#4338CA",
  },

  heroLabel: {
    fontSize: 15,
    color: "#555",
    marginTop: 6,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    alignItems: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6C63FF",
  },

  statLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },

  largeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  largeCardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  largeCardLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },

  summaryLabel: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
    textAlign: "center",
  },

  ratingCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },

  ratingTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#9A3412",
  },

  ratingValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#C2410C",
  },

  starsRow: {
    flexDirection: "row",
    marginTop: 8,
  },

  star: {
    fontSize: 24,
    marginHorizontal: 2,
  },

  starFilled: {
    color: "#F59E0B",
  },

  starEmpty: {
    color: "#D1D5DB",
  },

  ratingSubtext: {
    fontSize: 13,
    color: "#7C2D12",
    marginTop: 8,
    textAlign: "center",
  },

  ratingEmptyText: {
    fontSize: 14,
    color: "#7C2D12",
  },

  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});
