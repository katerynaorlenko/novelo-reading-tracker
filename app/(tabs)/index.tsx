import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
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

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [coverUri, setCoverUri] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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

  const pickCoverImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorMessage("Gallery permission is required to choose a cover.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCoverUri(result.assets[0].uri);
        setErrorMessage("");
      }
    } catch (error) {
      console.log("Error picking image:", error);
      setErrorMessage("Could not open gallery.");
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

  const handleAddBook = () => {
    if (!title.trim() || !author.trim() || !totalPages.trim()) {
      setErrorMessage("Please fill in title, author, and total pages.");
      return;
    }

    const total = Number(totalPages);
    const current = Number(currentPage || "0");

    if (Number.isNaN(total) || total <= 0) {
      setErrorMessage("Total pages must be a number greater than 0.");
      return;
    }

    if (Number.isNaN(current) || current < 0) {
      setErrorMessage("Current page must be 0 or a positive number.");
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
      coverUri: coverUri || undefined,
    };

    setBooks((prev) => [...prev, newBook]);

    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCurrentPage("");
    setCoverUri("");
    setErrorMessage("");
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

        <Text style={styles.label}>Book Cover</Text>
        <Pressable style={styles.coverButton} onPress={pickCoverImage}>
          <Text style={styles.coverButtonText}>Choose Cover</Text>
        </Pressable>

        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.previewImage} />
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

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
                {book.coverUri ? (
                  <Image
                    source={{ uri: book.coverUri }}
                    style={styles.bookCover}
                  />
                ) : null}

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
    marginTop: 20,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 20,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
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

  coverButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },

  coverButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  previewImage: {
    width: 110,
    height: 150,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: "center",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "500",
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

  bookCover: {
    width: 100,
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: "center",
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
