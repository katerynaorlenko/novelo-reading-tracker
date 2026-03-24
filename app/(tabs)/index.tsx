import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
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
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [coverUri, setCoverUri] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
      notes: "",
      favoriteQuote: "",
      thoughts: "",
      summary: "",
    };

    setBooks((prev) => [...prev, newBook]);

    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCurrentPage("");
    setCoverUri("");
    setErrorMessage("");
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Novelo</Text>
      <Text style={styles.subtitle}>My Library</Text>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Add New Book</Text>

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

      <Text style={styles.sectionTitle}>Your Books</Text>

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

      {filteredBooks.length === 0 ? (
        <Text style={styles.emptyText}>No matching books found</Text>
      ) : (
        <View style={styles.list}>
          {filteredBooks.map((book) => {
            const progress = getProgressPercentage(
              book.currentPage,
              book.totalPages,
            );

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
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>{book.author}</Text>

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

                    <Text style={styles.progressText}>
                      {progress}% completed
                    </Text>

                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{book.status}</Text>
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
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
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
    backgroundColor: "#FFFFFF",
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

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },

  filtersContainer: {
    paddingBottom: 12,
    gap: 10,
  },

  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
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

  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },

  list: {
    width: "100%",
  },

  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  cardContent: {
    flexDirection: "row",
    gap: 14,
  },

  bookCover: {
    width: 85,
    height: 120,
    borderRadius: 12,
  },

  bookCoverPlaceholder: {
    width: 85,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
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
    marginTop: 10,
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

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    color: "#5B21B6",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
