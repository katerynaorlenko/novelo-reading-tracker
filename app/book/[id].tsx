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

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [book, setBook] = useState<Book | null>(null);
  const [currentPageInput, setCurrentPageInput] = useState("");
  const [notes, setNotes] = useState("");
  const [favoriteQuote, setFavoriteQuote] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>("planned");

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
      }
    } catch (error) {
      console.log("Error loading book details:", error);
    }
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

    const updatedBook: Book = {
      ...book,
      currentPage: safeCurrentPage,
      status: getBookStatus(safeCurrentPage, book.totalPages),
    };

    await saveBookChanges(updatedBook);
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

    const updatedBook: Book = {
      ...book,
      status: newStatus,
      currentPage: updatedCurrentPage,
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
    };

    await saveBookChanges(updatedBook);
    Alert.alert("Saved", "Book notes were saved.");
  };

  const handleDeleteBook = async () => {
    if (!book) return;

    Alert.alert("Delete book", "Are you sure you want to delete this book?", [
      {
        text: "Cancel",
        style: "cancel",
      },
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

  if (!book) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Book not found.</Text>
      </View>
    );
  }

  const progress = getProgressPercentage(book.currentPage, book.totalPages);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {book.coverUri ? (
        <Image source={{ uri: book.coverUri }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverPlaceholderText}>No Cover</Text>
        </View>
      )}

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Progress: {book.currentPage} / {book.totalPages} pages
        </Text>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.progressText}>{progress}% completed</Text>
        <Text style={styles.statusText}>Status: {book.status}</Text>
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

        <Pressable style={styles.primaryButton} onPress={handleUpdateProgress}>
          <Text style={styles.primaryButtonText}>Update Progress</Text>
        </Pressable>
      </View>

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

      <Pressable style={styles.deleteButton} onPress={handleDeleteBook}>
        <Text style={styles.deleteButtonText}>Delete Book</Text>
      </Pressable>
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

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    fontSize: 18,
    color: "#555",
  },

  coverImage: {
    width: 150,
    height: 210,
    borderRadius: 16,
    alignSelf: "center",
    marginTop: 8,
  },

  coverPlaceholder: {
    width: 150,
    height: 210,
    borderRadius: 16,
    alignSelf: "center",
    marginTop: 8,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  coverPlaceholderText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18,
  },

  author: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginTop: 6,
  },

  infoCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },

  infoText: {
    fontSize: 16,
    color: "#333",
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 999,
  },

  progressText: {
    fontSize: 14,
    color: "#555",
    marginTop: 10,
  },

  statusText: {
    fontSize: 15,
    color: "#6C63FF",
    marginTop: 8,
    fontWeight: "600",
  },

  section: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

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

  statusOptionActive: {
    backgroundColor: "#6C63FF",
  },

  statusOptionText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },

  statusOptionTextActive: {
    color: "#FFFFFF",
  },

  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },

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

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  deleteButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
