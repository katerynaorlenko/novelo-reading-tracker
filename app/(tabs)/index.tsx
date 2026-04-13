import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

type BookStatus = "planned" | "reading" | "finished";
type FilterStatus = "all" | BookStatus;

type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  coverUri?: string;
  notes?: string;
  favoriteQuote?: string;
  thoughts?: string;
  summary?: string;
};

const STORAGE_KEY = "novelo_books";

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

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
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.log("Error loading books:", error);
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round((current / total) * 100);
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ? true : book.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [books, searchQuery, activeFilter]);

  const renderFilterButton = (label: string, value: FilterStatus) => {
    const isActive = activeFilter === value;

    return (
      <Pressable
        key={value}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setActiveFilter(value)}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const getStatusBadgeStyle = (status: BookStatus) => {
    if (status === "planned") {
      return {
        container: styles.plannedBadge,
        text: styles.plannedBadgeText,
      };
    }

    if (status === "finished") {
      return {
        container: styles.finishedBadge,
        text: styles.finishedBadgeText,
      };
    }

    return {
      container: styles.readingBadge,
      text: styles.readingBadgeText,
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Novelo</Text>
        <Text style={styles.subtitle}>My Library</Text>
      </View>

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/modal" as never)}
      >
        <Text style={styles.addButtonText}>+ Add Book</Text>
      </Pressable>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or author"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {renderFilterButton("All", "all")}
          {renderFilterButton("Planned", "planned")}
          {renderFilterButton("Reading", "reading")}
          {renderFilterButton("Finished", "finished")}
        </ScrollView>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Books</Text>
        <Text style={styles.sectionCount}>{filteredBooks.length}</Text>
      </View>

      {filteredBooks.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No books found</Text>
          <Text style={styles.emptyStateText}>
            Add a new book or change your search and filter options.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredBooks.map((book) => {
            const progress = getProgressPercentage(
              book.currentPage,
              book.totalPages,
            );

            const badgeStyles = getStatusBadgeStyle(book.status);

            return (
              <Pressable
                key={book.id}
                style={styles.card}
                onPress={() => router.push(`/book/${book.id}` as never)}
              >
                <View style={styles.cardContent}>
                  {book.coverUri ? (
                    <Image
                      source={{ uri: book.coverUri }}
                      style={styles.bookCover}
                    />
                  ) : (
                    <View style={styles.bookCoverPlaceholder}>
                      <Text style={styles.bookCoverPlaceholderText}>
                        No Cover
                      </Text>
                    </View>
                  )}

                  <View style={styles.bookInfo}>
                    <Text numberOfLines={1} style={styles.bookTitle}>
                      {book.title}
                    </Text>

                    <Text numberOfLines={1} style={styles.bookAuthor}>
                      {book.author}
                    </Text>

                    <Text style={styles.bookPages}>
                      {book.currentPage} / {book.totalPages} pages
                    </Text>

                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.progressText}>
                        {progress}% completed
                      </Text>

                      <View style={[styles.statusBadge, badgeStyles.container]}>
                        <Text
                          style={[styles.statusBadgeText, badgeStyles.text]}
                        >
                          {book.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 36,
  },

  headerBlock: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 8,
  },

  addButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#6C63FF",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  searchSection: {
    marginBottom: 18,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },

  filtersContainer: {
    gap: 10,
    paddingRight: 8,
  },

  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },

  filterButtonActive: {
    backgroundColor: "#6C63FF",
  },

  filterButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },

  filterButtonTextActive: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
  },

  sectionCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6C63FF",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  emptyStateCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  list: {
    width: "100%",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },

  cardContent: {
    flexDirection: "row",
    gap: 14,
  },

  bookCover: {
    width: 84,
    height: 118,
    borderRadius: 14,
  },

  bookCoverPlaceholder: {
    width: 84,
    height: 118,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  bookCoverPlaceholderText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  bookInfo: {
    flex: 1,
    justifyContent: "center",
  },

  bookTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  bookAuthor: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  bookPages: {
    fontSize: 15,
    color: "#4B5563",
    marginTop: 14,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: "#ECECF3",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 999,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  progressText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  plannedBadge: {
    backgroundColor: "#E5E7EB",
  },

  plannedBadgeText: {
    color: "#4B5563",
  },

  readingBadge: {
    backgroundColor: "#EDE9FE",
  },

  readingBadgeText: {
    color: "#5B21B6",
  },

  finishedBadge: {
    backgroundColor: "#DCFCE7",
  },

  finishedBadgeText: {
    color: "#166534",
  },
});
