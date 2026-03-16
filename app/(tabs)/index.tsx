import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
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
};

const STORAGE_KEY = "novelo_books";

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    saveBooks();
  }, [books]);

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

  const saveBooks = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.log("Error saving books:", error);
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

  const totalBooks = books.length;
  const plannedBooks = books.filter((book) => book.status === "planned").length;
  const readingBooks = books.filter((book) => book.status === "reading").length;
  const finishedBooks = books.filter(
    (book) => book.status === "finished",
  ).length;
  const totalPagesRead = books.reduce((sum, book) => sum + book.currentPage, 0);

  const handleAddBook = () => {
    if (!title.trim() || !author.trim() || !totalPages.trim()) return;

    const total = Number(totalPages);
    const current = Number(currentPage || "0");

    if (
      Number.isNaN(total) ||
      Number.isNaN(current) ||
      total <= 0 ||
      current < 0
    ) {
      return;
    }

    const safeCurrentPage = current > total ? total : current;

    const newBook: Book = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      totalPages: total,
      currentPage: safeCurrentPage,
      status: getBookStatus(safeCurrentPage, total),
    };

    setBooks((prev) => [...prev, newBook]);

    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCurrentPage("");
  };

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));

    setProgressInputs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleProgressInputChange = (id: string, value: string) => {
    setProgressInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleUpdateProgress = (id: string) => {
    const inputValue = progressInputs[id] || "";
    const newCurrentPage = Number(inputValue);

    if (Number.isNaN(newCurrentPage) || newCurrentPage < 0) {
      return;
    }

    setBooks((prevBooks) =>
      prevBooks.map((book) => {
        if (book.id !== id) return book;

        const safeCurrentPage =
          newCurrentPage > book.totalPages ? book.totalPages : newCurrentPage;

        return {
          ...book,
          currentPage: safeCurrentPage,
          status: getBookStatus(safeCurrentPage, book.totalPages),
        };
      }),
    );

    setProgressInputs((prev) => ({
      ...prev,
      [id]: "",
    }));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Novelo</Text>
      <Text style={styles.subtitle}>My Library</Text>

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Reading Statistics</Text>

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
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Book Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter book title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Author</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter author name"
          value={author}
          onChangeText={setAuthor}
        />

        <Text style={styles.label}>Total Pages</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 300"
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Current Page</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 50"
          value={currentPage}
          onChangeText={setCurrentPage}
          keyboardType="numeric"
        />

        <Pressable style={styles.button} onPress={handleAddBook}>
          <Text style={styles.buttonText}>Save Book</Text>
        </Pressable>
      </View>

      {books.length === 0 ? (
        <Text style={styles.text}>No books yet</Text>
      ) : (
        <View style={styles.list}>
          {books.map((book) => {
            const progress = getProgressPercentage(
              book.currentPage,
              book.totalPages,
            );

            return (
              <View key={book.id} style={styles.card}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>

                <Text style={styles.bookPages}>
                  Progress: {book.currentPage} / {book.totalPages} pages
                </Text>

                <View style={styles.progressBarBackground}>
                  <View
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                  />
                </View>

                <Text style={styles.progressText}>{progress}% completed</Text>

                <Text style={styles.bookStatus}>Status: {book.status}</Text>

                <Text style={styles.updateLabel}>Update Current Page</Text>
                <TextInput
                  style={styles.updateInput}
                  placeholder="Enter new page"
                  value={progressInputs[book.id] || ""}
                  onChangeText={(value) =>
                    handleProgressInputChange(book.id, value)
                  }
                  keyboardType="numeric"
                />

                <Pressable
                  style={styles.updateButton}
                  onPress={() => handleUpdateProgress(book.id)}
                >
                  <Text style={styles.updateButtonText}>Update Progress</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteBook(book.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
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
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 40,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 20,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },

  statsSection: {
    marginBottom: 24,
  },

  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
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
    padding: 16,
    alignItems: "center",
  },

  pagesReadValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4338CA",
  },

  pagesReadLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },

  form: {
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 16,
  },

  text: {
    fontSize: 16,
    marginTop: 16,
    color: "#666",
    textAlign: "center",
  },

  list: {
    width: "100%",
    marginTop: 8,
  },

  card: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  bookTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  bookAuthor: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },

  bookPages: {
    fontSize: 14,
    color: "#444",
    marginTop: 8,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 999,
  },

  progressText: {
    fontSize: 13,
    color: "#555",
    marginTop: 8,
  },

  bookStatus: {
    fontSize: 14,
    color: "#6C63FF",
    marginTop: 8,
    fontWeight: "600",
  },

  updateLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },

  updateInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },

  updateButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteButton: {
    marginTop: 12,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
