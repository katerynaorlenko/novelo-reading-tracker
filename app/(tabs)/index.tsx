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
  genre?: string;
  rating?: number;
  coverUri?: string;
  updatedAt?: string;
  lastReadAt?: string;
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

  const totalPagesRead = useMemo(() => {
    return books.reduce((sum, book) => sum + book.currentPage, 0);
  }, [books]);

  const finishedBooksCount = useMemo(() => {
    return books.filter((book) => book.status === "finished").length;
  }, [books]);

  const getProgressPercentage = (current: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round((current / total) * 100);
  };

  const formatShortDate = (value?: string) => {
    if (!value) return "Not updated yet";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not updated yet";

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
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.genre || "").toLowerCase().includes(query);

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

  const renderStars = (rating: number = 0) => (
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

  const renderGenreBadge = (genre?: string) => {
    if (!genre) return null;

    return (
      <View style={styles.genreBadge}>
        <Text style={styles.genreBadgeText}>{genre}</Text>
      </View>
    );
  };

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
      <View style={styles.brandBar}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>📖</Text>
        </View>

        <View>
          <Text style={styles.brandTitle}>NOVELO</Text>
          <Text style={styles.brandSubtitle}>Your reading space</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>READING TRACKER</Text>
        </View>

        <Text style={styles.heroTitle}>Track your reading.</Text>

        <Text style={styles.heroSubtitle}>
          Build your habit and organize your books beautifully.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{books.length}</Text>
            <Text style={styles.statLabel}>Books</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{finishedBooksCount}</Text>
            <Text style={styles.statLabel}>Finished</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalPagesRead}</Text>
            <Text style={styles.statLabel}>Pages</Text>
          </View>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/modal" as never)}
        >
          <Text style={styles.addButtonText}>+ Add Book</Text>
        </Pressable>
      </View>

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
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, author or genre"
              placeholderTextColor="#A7AAB5"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

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
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyLibraryTitle}>
            Start your reading journey
          </Text>
          <Text style={styles.emptyLibraryText}>
            Add your first book and start tracking your reading progress.
          </Text>
        </View>
      ) : isFilteredEmpty ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No books found</Text>
          <Text style={styles.emptyStateText}>
            Try another search or change the filter.
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

                    {renderGenreBadge(book.genre)}
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
    backgroundColor: "#F7F7FF",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 150,
  },

  brandBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 16,
  },

  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },

  logoEmoji: {
    fontSize: 23,
  },

  brandTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#6C63FF",
    letterSpacing: 1.2,
  },

  brandSubtitle: {
    fontSize: 14,
    color: "#7B7280",
    marginTop: 2,
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ECECF7",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },

  heroBadge: {
    backgroundColor: "#F2EFFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2DAFF",
    marginBottom: 16,
  },

  heroBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6C63FF",
    letterSpacing: 1.5,
  },

  heroTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
    paddingHorizontal: 8,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9E5FF",
  },

  statNumber: {
    fontSize: 21,
    fontWeight: "900",
    color: "#6C63FF",
  },

  statLabel: {
    fontSize: 12,
    color: "#7B7280",
    marginTop: 4,
    fontWeight: "700",
  },

  addButton: {
    width: "100%",
    backgroundColor: "#6C63FF",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  continueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ECECF7",
  },

  continueLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6C63FF",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  continueContent: {
    flexDirection: "row",
    gap: 14,
  },

  continueCover: {
    width: 88,
    height: 124,
    borderRadius: 16,
  },

  continueCoverPlaceholder: {
    width: 88,
    height: 124,
    borderRadius: 16,
    backgroundColor: "#EEF0F5",
    alignItems: "center",
    justifyContent: "center",
  },

  continueCoverPlaceholderText: {
    color: "#6B7280",
    fontWeight: "700",
  },

  continueInfo: {
    flex: 1,
    justifyContent: "center",
  },

  continueTitle: {
    fontSize: 22,
    fontWeight: "900",
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
    height: 9,
    backgroundColor: "#E5E7F2",
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
    fontWeight: "700",
  },

  continueButton: {
    marginTop: 16,
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECECF7",
  },

  searchIcon: {
    fontSize: 22,
    color: "#9CA3AF",
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },

  filtersContainer: {
    gap: 10,
    paddingRight: 8,
    marginBottom: 16,
  },

  filterButton: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECF7",
  },

  filterButtonActive: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  filterButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  filterButtonTextActive: {
    color: "#FFFFFF",
  },

  sortSection: {
    marginBottom: 18,
  },

  sortTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B7280",
    marginBottom: 8,
  },

  sortContainer: {
    gap: 8,
    paddingRight: 8,
  },

  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECF7",
  },

  sortButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  sortButtonText: {
    fontSize: 13,
    fontWeight: "900",
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
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
  },

  sectionCount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#6C63FF",
    backgroundColor: "#EEEAFE",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  list: {
    width: "100%",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECECF7",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },

  activeReadingCard: {
    borderColor: "#C4B5FD",
  },

  cardContent: {
    flexDirection: "row",
    gap: 14,
  },

  bookCover: {
    width: 86,
    height: 122,
    borderRadius: 16,
  },

  bookCoverPlaceholder: {
    width: 86,
    height: 122,
    borderRadius: 16,
    backgroundColor: "#EEF0F5",
    alignItems: "center",
    justifyContent: "center",
  },

  bookCoverPlaceholderText: {
    color: "#6B7280",
    fontWeight: "700",
  },

  bookInfo: {
    flex: 1,
  },

  bookTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },

  bookAuthor: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 3,
  },

  genreBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 8,
  },

  genreBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5B21B6",
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
    marginTop: 10,
  },

  progressBarBackground: {
    height: 9,
    backgroundColor: "#ECECF3",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 9,
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
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
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

  emptyLibraryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#ECECF7",
    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyLibraryTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  emptyLibraryText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ECECF7",
    alignItems: "center",
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
