import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type BookStatus = "planned" | "reading" | "finished";
type DetailsTab = "overview" | "notes";

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
  genre?: string;
  lastReadAt?: string;
  readingHistory?: string[];
};

const STORAGE_KEY = "novelo_books";

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [book, setBook] = useState<Book | null>(null);
  const [currentPageInput, setCurrentPageInput] = useState("");
  const [notes, setNotes] = useState("");
  const [favoriteQuote, setFavoriteQuote] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>("planned");
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailsTab>("overview");

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      const savedBooks = await AsyncStorage.getItem(STORAGE_KEY);
      if (!savedBooks) return;

      const parsedBooks: Book[] = JSON.parse(savedBooks);
      const foundBook = parsedBooks.find((item) => item.id === id);

      if (foundBook) {
        setBook(foundBook);
        setCurrentPageInput(foundBook.currentPage.toString());
        setNotes(foundBook.notes || "");
        setFavoriteQuote(foundBook.favoriteQuote || "");
        setThoughts(foundBook.thoughts || "");
        setSummary(foundBook.summary || "");
        setSelectedStatus(foundBook.status);
        setRating(foundBook.rating || 0);
      }
    } catch (error) {
      console.log("Error loading book details:", error);
    }
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getBookStatus = (current: number, total: number): BookStatus => {
    if (current <= 0) return "planned";
    if (current >= total) return "finished";
    return "reading";
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total <= 0) return 0;
    return Math.round((current / total) * 100);
  };

  const saveBookChanges = async (updatedBook: Book) => {
    try {
      const savedBooks = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedBooks: Book[] = savedBooks ? JSON.parse(savedBooks) : [];

      const updatedBooks = parsedBooks.map((item) =>
        item.id === updatedBook.id ? updatedBook : item,
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));

      setBook(updatedBook);
      setSelectedStatus(updatedBook.status);
      setCurrentPageInput(updatedBook.currentPage.toString());
      setRating(updatedBook.rating || 0);
    } catch (error) {
      console.log("Error saving book changes:", error);
    }
  };

  const handleUpdateProgress = async () => {
    if (!book) return;

    const newCurrentPage = Number(currentPageInput);

    if (Number.isNaN(newCurrentPage) || newCurrentPage < 0) {
      Alert.alert(
        "Invalid value",
        "Current page must be 0 or a positive number.",
      );
      return;
    }

    const safeCurrentPage =
      newCurrentPage > book.totalPages ? book.totalPages : newCurrentPage;

    const nextStatus = getBookStatus(safeCurrentPage, book.totalPages);
    const now = new Date().toISOString();

    const updatedBook: Book = {
      ...book,
      currentPage: safeCurrentPage,
      status: nextStatus,
      updatedAt: now,
      lastReadAt: now,
      readingHistory: [...(book.readingHistory || []), now],
      startedAt:
        (nextStatus === "reading" || nextStatus === "finished") &&
        !book.startedAt
          ? now
          : book.startedAt,
      finishedAt:
        nextStatus === "finished" ? book.finishedAt || now : undefined,
    };

    await saveBookChanges(updatedBook);
    Alert.alert("Updated", "Reading progress updated.");
  };

  const handleChangeStatus = async (newStatus: BookStatus) => {
    if (!book) return;

    let updatedCurrentPage = book.currentPage;

    if (newStatus === "planned") {
      updatedCurrentPage = 0;
    }

    if (newStatus === "finished") {
      updatedCurrentPage = book.totalPages;
    }

    if (newStatus === "reading" && updatedCurrentPage <= 0) {
      updatedCurrentPage = 1;
    }

    const now = new Date().toISOString();

    const updatedBook: Book = {
      ...book,
      status: newStatus,
      currentPage: updatedCurrentPage,
      updatedAt: now,
      startedAt:
        (newStatus === "reading" || newStatus === "finished") && !book.startedAt
          ? now
          : newStatus === "planned"
            ? undefined
            : book.startedAt,
      finishedAt: newStatus === "finished" ? book.finishedAt || now : undefined,
    };

    await saveBookChanges(updatedBook);
  };

  const handleSetRating = async (newRating: number) => {
    if (!book) return;

    const updatedBook: Book = {
      ...book,
      rating: newRating,
      updatedAt: new Date().toISOString(),
    };

    await saveBookChanges(updatedBook);
  };

  const handleSaveNotes = async () => {
    if (!book) return;

    const updatedBook: Book = {
      ...book,
      notes,
      favoriteQuote,
      thoughts,
      summary,
      rating,
      updatedAt: new Date().toISOString(),
    };

    await saveBookChanges(updatedBook);
    Alert.alert("Saved", "Book notes were saved.");
  };

  const handleDeleteBook = async () => {
    if (!book) return;

    Alert.alert("Delete book", "Are you sure you want to delete this book?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const savedBooks = await AsyncStorage.getItem(STORAGE_KEY);
            const parsedBooks: Book[] = savedBooks
              ? JSON.parse(savedBooks)
              : [];
            const updatedBooks = parsedBooks.filter(
              (item) => item.id !== book.id,
            );

            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(updatedBooks),
            );
            router.back();
          } catch (error) {
            console.log("Error deleting book:", error);
          }
        },
      },
    ]);
  };

  const renderStatusOption = (label: string, value: BookStatus) => {
    const isActive = selectedStatus === value;

    return (
      <Pressable
        key={value}
        style={[styles.statusOption, isActive && styles.statusOptionActive]}
        onPress={() => handleChangeStatus(value)}
      >
        <Text
          style={[
            styles.statusOptionText,
            isActive && styles.statusOptionTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderRatingStars = () => {
    return (
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;

          return (
            <Pressable key={star} onPress={() => handleSetRating(star)}>
              <Text
                style={[
                  styles.ratingStar,
                  isFilled ? styles.ratingStarFilled : styles.ratingStarEmpty,
                ]}
              >
                ★
              </Text>
            </Pressable>
          );
        })}
      </View>
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

  if (!book) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Book not found.</Text>
      </View>
    );
  }

  const progress = getProgressPercentage(book.currentPage, book.totalPages);
  const badgeStyles = getStatusBadgeStyle(book.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          {book.coverUri ? (
            <Image source={{ uri: book.coverUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>No Cover</Text>
            </View>
          )}

          <View style={styles.heroInfo}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>

            {renderRatingStars()}

            <View style={[styles.statusBadge, badgeStyles.container]}>
              <Text style={[styles.statusBadgeText, badgeStyles.text]}>
                {book.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressTopRow}>
            <Text style={styles.infoText}>
              {book.currentPage} / {book.totalPages} pages
            </Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === "overview" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab("overview")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              activeTab === "overview" && styles.segmentButtonTextActive,
            ]}
          >
            Overview
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            activeTab === "notes" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab("notes")}
        >
          <Text
            style={[
              styles.segmentButtonText,
              activeTab === "notes" && styles.segmentButtonTextActive,
            ]}
          >
            Notes
          </Text>
        </Pressable>
      </View>

      {activeTab === "overview" ? (
        <>
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>Reading Timeline</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Started reading</Text>
              <Text style={styles.metaValue}>
                {formatDisplayDate(book.startedAt)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Finished on</Text>
              <Text style={styles.metaValue}>
                {formatDisplayDate(book.finishedAt)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Last updated</Text>
              <Text style={styles.metaValue}>
                {formatDisplayDate(book.updatedAt)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Last read</Text>
              <Text style={styles.metaValue}>
                {formatDisplayDate(book.lastReadAt)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Status</Text>

            <View style={styles.statusOptionsRow}>
              {renderStatusOption("Planned", "planned")}
              {renderStatusOption("Reading", "reading")}
              {renderStatusOption("Finished", "finished")}
            </View>

            <Text style={styles.helperText}>
              Planned sets current page to 0. Finished sets it to total pages.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Progress</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter current page"
              value={currentPageInput}
              onChangeText={setCurrentPageInput}
              keyboardType="numeric"
            />

            <Pressable
              style={styles.primaryButton}
              onPress={handleUpdateProgress}
            >
              <Text style={styles.primaryButtonText}>Update Progress</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write your notes about this book..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Text style={styles.label}>Favorite Quote</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add your favorite quote..."
            value={favoriteQuote}
            onChangeText={setFavoriteQuote}
            multiline
          />

          <Text style={styles.label}>Thoughts</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write your thoughts..."
            value={thoughts}
            onChangeText={setThoughts}
            multiline
          />

          <Text style={styles.label}>Summary</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write a short summary..."
            value={summary}
            onChangeText={setSummary}
            multiline
          />

          <Pressable style={styles.primaryButton} onPress={handleSaveNotes}>
            <Text style={styles.primaryButtonText}>Save Notes</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.deleteButton} onPress={handleDeleteBook}>
        <Text style={styles.deleteButtonText}>Delete Book</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  contentContainer: { padding: 20, paddingBottom: 140 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { fontSize: 18, color: "#555" },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },

  heroContent: { flexDirection: "row", gap: 16 },
  coverImage: { width: 120, height: 170, borderRadius: 16 },
  coverPlaceholder: {
    width: 120,
    height: 170,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  heroInfo: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  author: { fontSize: 16, color: "#6B7280", marginTop: 6 },

  ratingRow: { flexDirection: "row", marginTop: 10 },
  ratingStar: { fontSize: 30, marginRight: 6 },
  ratingStarFilled: { color: "#F59E0B" },
  ratingStarEmpty: { color: "#D1D5DB" },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  plannedBadge: { backgroundColor: "#E5E7EB" },
  plannedBadgeText: { color: "#4B5563" },
  readingBadge: { backgroundColor: "#EDE9FE" },
  readingBadgeText: { color: "#5B21B6" },
  finishedBadge: { backgroundColor: "#DCFCE7" },
  finishedBadgeText: { color: "#166534" },

  progressSection: { marginTop: 18 },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoText: { fontSize: 15, color: "#4B5563", fontWeight: "500" },
  progressPercent: { fontSize: 14, color: "#6C63FF", fontWeight: "700" },
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

  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 4,
    marginTop: 18,
    marginBottom: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentButtonActive: { backgroundColor: "#6C63FF" },
  segmentButtonText: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  segmentButtonTextActive: { color: "#FFFFFF" },

  metaCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metaTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  metaLabel: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  metaValue: { fontSize: 14, color: "#111827", fontWeight: "600" },

  section: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  statusOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statusOption: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  statusOptionActive: { backgroundColor: "#6C63FF" },
  statusOptionText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  statusOptionTextActive: { color: "#FFFFFF" },
  helperText: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    minHeight: 90,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  deleteButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 22,
  },
  deleteButtonText: { color: "#DC2626", fontSize: 16, fontWeight: "700" },
});
