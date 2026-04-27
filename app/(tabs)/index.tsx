import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type BookStatus = "planned" | "reading" | "finished";
type FilterStatus = "all" | BookStatus;
type SortType = "newest" | "progress" | "rating" | "title";

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
  startedAt?: string;
  finishedAt?: string;
  updatedAt?: string;
  lastReadAt?: string;
  readingHistory?: string[];
};

const STORAGE_KEY = "novelo_books";

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");

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
      setBooks(savedBooks ? JSON.parse(savedBooks) : []);
    } catch (error) {
      console.log("Error loading books:", error);
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round((current / total) * 100);
  };

  const formatShortDate = (value?: string) => {
    if (!value) return "Not updated yet";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not updated yet";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const continueReadingBook = useMemo(() => {
    const readingBooks = books.filter(
      (book) => book.status === "reading" && book.currentPage > 0,
    );

    if (readingBooks.length === 0) return null;

    return [...readingBooks].sort((a, b) => {
      const aDate = new Date(
        a.lastReadAt || a.updatedAt || Number(a.id),
      ).getTime();
      const bDate = new Date(
        b.lastReadAt || b.updatedAt || Number(b.id),
      ).getTime();

      return bDate - aDate;
    })[0];
  }, [books]);

  const filteredAndSortedBooks = useMemo(() => {
    const filtered = books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ? true : book.status === activeFilter;

      return matchesSearch && matchesFilter;
    });

    const sorted = [...filtered];

    if (sortBy === "progress") {
      return sorted.sort((a, b) => {
        const progressA = a.totalPages > 0 ? a.currentPage / a.totalPages : 0;
        const progressB = b.totalPages > 0 ? b.currentPage / b.totalPages : 0;

        return progressB - progressA;
      });
    }

    if (sortBy === "rating") {
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (sortBy === "title") {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted.sort((a, b) => {
      const aDate = new Date(a.updatedAt || Number(a.id)).getTime();
      const bDate = new Date(b.updatedAt || Number(b.id)).getTime();

      return bDate - aDate;
    });
  }, [books, searchQuery, activeFilter, sortBy]);

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

  const renderSortButton = (label: string, value: SortType) => {
    const isActive = sortBy === value;

    return (
      <Pressable
        key={value}
        style={[styles.sortButton, isActive && styles.sortButtonActive]}
        onPress={() => setSortBy(value)}
      >
        <Text
          style={[
            styles.sortButtonText,
            isActive && styles.sortButtonTextActive,
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

  const renderStars = (rating: number = 0) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.star,
              star <= rating ? styles.starFilled : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  const isLibraryEmpty = books.length === 0;
  const isFilteredEmpty =
    !isLibraryEmpty && filteredAndSortedBooks.length === 0;

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

      {continueReadingBook ? (
        <Pressable
          style={styles.continueCard}
          onPress={() =>
            router.push(`/book/${continueReadingBook.id}` as never)
          }
        >
          <Text style={styles.continueLabel}>Continue Reading</Text>

          <View style={styles.continueContent}>
            {continueReadingBook.coverUri ? (
              <Image
                source={{ uri: continueReadingBook.coverUri }}
                style={styles.continueCover}
              />
            ) : (
              <View style={styles.continueCoverPlaceholder}>
                <Text style={styles.continueCoverPlaceholderText}>
                  No Cover
                </Text>
              </View>
            )}

            <View style={styles.continueInfo}>
              <Text numberOfLines={1} style={styles.continueTitle}>
                {continueReadingBook.title}
              </Text>

              <Text numberOfLines={1} style={styles.continueAuthor}>
                {continueReadingBook.author}
              </Text>

              {renderStars(continueReadingBook.rating || 0)}

              <Text style={styles.continuePages}>
                {continueReadingBook.currentPage} /{" "}
                {continueReadingBook.totalPages} pages
              </Text>

              <View style={styles.continueProgressBackground}>
                <View
                  style={[
                    styles.continueProgressFill,
                    {
                      width: `${getProgressPercentage(
                        continueReadingBook.currentPage,
                        continueReadingBook.totalPages,
                      )}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.continueProgressText}>
                {getProgressPercentage(
                  continueReadingBook.currentPage,
                  continueReadingBook.totalPages,
                )}
                % completed
              </Text>

              <Text style={styles.lastUpdatedText}>
                Last read: {formatShortDate(continueReadingBook.lastReadAt)}
              </Text>
            </View>
          </View>

          <View style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </View>
        </Pressable>
      ) : null}

      {!isLibraryEmpty ? (
        <>
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

            <View style={styles.sortSection}>
              <Text style={styles.sortTitle}>Sort by</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortContainer}
              >
                {renderSortButton("Newest", "newest")}
                {renderSortButton("Progress", "progress")}
                {renderSortButton("Rating", "rating")}
                {renderSortButton("A–Z", "title")}
              </ScrollView>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Books</Text>
            <Text style={styles.sectionCount}>
              {filteredAndSortedBooks.length}
            </Text>
          </View>
        </>
      ) : null}

      {isLibraryEmpty ? (
        <View style={styles.emptyLibraryCard}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyEmoji}>📚</Text>
          </View>

          <Text style={styles.emptyLibraryTitle}>
            Start your reading journey
          </Text>
          <Text style={styles.emptyLibraryText}>
            Build your personal library, track progress, save notes, and turn
            reading into a clear daily habit.
          </Text>

          <Pressable
            style={styles.emptyLibraryButton}
            onPress={() => router.push("/modal" as never)}
          >
            <Text style={styles.emptyLibraryButtonText}>
              Add Your First Book
            </Text>
          </Pressable>
        </View>
      ) : isFilteredEmpty ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No books found</Text>
          <Text style={styles.emptyStateText}>
            Try another search, change the filter, or choose another sorting
            option.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredAndSortedBooks.map((book) => {
            const progress = getProgressPercentage(
              book.currentPage,
              book.totalPages,
            );

            const badgeStyles = getStatusBadgeStyle(book.status);

            return (
              <Pressable
                key={book.id}
                style={[
                  styles.card,
                  book.status === "reading" && styles.activeReadingCard,
                ]}
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

                    {renderStars(book.rating || 0)}

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

                    <Text style={styles.lastUpdatedText}>
                      Last updated: {formatShortDate(book.updatedAt)}
                    </Text>

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
    paddingBottom: 140,
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
    borderRadius: 18,
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

  continueCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },

  continueLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4338CA",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  continueContent: {
    flexDirection: "row",
    gap: 14,
  },

  continueCover: {
    width: 82,
    height: 116,
    borderRadius: 16,
  },

  continueCoverPlaceholder: {
    width: 82,
    height: 116,
    borderRadius: 16,
    backgroundColor: "#DDE3F7",
    alignItems: "center",
    justifyContent: "center",
  },

  continueCoverPlaceholderText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  continueInfo: {
    flex: 1,
    justifyContent: "center",
  },

  continueTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  continueAuthor: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  continuePages: {
    fontSize: 14,
    color: "#374151",
    marginTop: 10,
  },

  continueProgressBackground: {
    height: 10,
    backgroundColor: "#D8DEF5",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },

  continueProgressFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 999,
  },

  continueProgressText: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    fontWeight: "500",
  },

  continueButton: {
    marginTop: 14,
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  searchSection: {
    marginBottom: 18,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
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

  sortSection: {
    marginTop: 14,
  },

  sortTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },

  sortContainer: {
    gap: 8,
    paddingRight: 8,
  },

  sortButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },

  sortButtonActive: {
    backgroundColor: "#111827",
  },

  sortButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },

  sortButtonTextActive: {
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

  emptyLibraryCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginTop: 10,
  },

  emptyIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyEmoji: {
    fontSize: 36,
  },

  emptyLibraryTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    marginBottom: 10,
  },

  emptyLibraryText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 18,
  },

  emptyLibraryButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
  },

  emptyLibraryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
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
    borderRadius: 22,
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

  activeReadingCard: {
    borderColor: "#C4B5FD",
    backgroundColor: "#FCFBFF",
  },

  cardContent: {
    flexDirection: "row",
    gap: 14,
  },

  bookCover: {
    width: 84,
    height: 118,
    borderRadius: 16,
  },

  bookCoverPlaceholder: {
    width: 84,
    height: 118,
    borderRadius: 16,
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

  starsRow: {
    flexDirection: "row",
    marginTop: 8,
  },

  star: {
    fontSize: 16,
    marginRight: 2,
  },

  starFilled: {
    color: "#F59E0B",
  },

  starEmpty: {
    color: "#D1D5DB",
  },

  bookPages: {
    fontSize: 15,
    color: "#4B5563",
    marginTop: 12,
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

  lastUpdatedText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
