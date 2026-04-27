import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
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

type BookGenre =
  | "Fantasy"
  | "Romance"
  | "Classic"
  | "Self-development"
  | "Education"
  | "Mystery"
  | "Other";

type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  genre?: BookGenre;
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
const MAX_TOTAL_PAGES = 5000;

const GENRES: BookGenre[] = [
  "Fantasy",
  "Romance",
  "Classic",
  "Self-development",
  "Education",
  "Mystery",
  "Other",
];

export default function AddBookScreen() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [coverUri, setCoverUri] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>("planned");
  const [selectedGenre, setSelectedGenre] = useState<BookGenre>("Other");

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

  const renderStatusOption = (label: string, value: BookStatus) => {
    const isActive = selectedStatus === value;

    return (
      <Pressable
        key={value}
        style={[styles.statusOption, isActive && styles.statusOptionActive]}
        onPress={() => setSelectedStatus(value)}
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

  const renderGenreOption = (genre: BookGenre) => {
    const isActive = selectedGenre === genre;

    return (
      <Pressable
        key={genre}
        style={[styles.genreOption, isActive && styles.genreOptionActive]}
        onPress={() => setSelectedGenre(genre)}
      >
        <Text
          style={[
            styles.genreOptionText,
            isActive && styles.genreOptionTextActive,
          ]}
        >
          {genre}
        </Text>
      </Pressable>
    );
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCurrentPage("");
    setCoverUri("");
    setSelectedStatus("planned");
    setSelectedGenre("Other");
    setErrorMessage("");
  };

  const handleSaveBook = async () => {
    setErrorMessage("");

    if (!title.trim() || !author.trim() || !totalPages.trim()) {
      setErrorMessage("Please fill in title, author, and total pages.");
      return;
    }

    const total = Number(totalPages);
    let current = Number(currentPage || "0");

    if (!Number.isInteger(total) || total <= 0) {
      setErrorMessage("Total pages must be a whole number greater than 0.");
      return;
    }

    if (total > MAX_TOTAL_PAGES) {
      setErrorMessage(`Total pages cannot be more than ${MAX_TOTAL_PAGES}.`);
      return;
    }

    if (!Number.isInteger(current) || current < 0) {
      setErrorMessage("Current page must be a whole number from 0 upward.");
      return;
    }

    if (current > total) {
      setErrorMessage("Current page cannot be greater than total pages.");
      return;
    }

    if (selectedStatus === "planned") {
      current = 0;
    }

    if (selectedStatus === "finished") {
      current = total;
    }

    if (selectedStatus === "reading" && current <= 0) {
      current = 1;
    }

    const now = new Date().toISOString();

    const newBook: Book = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      totalPages: total,
      currentPage: current,
      status: selectedStatus,
      genre: selectedGenre,
      rating: 0,
      coverUri: coverUri || undefined,
      notes: "",
      favoriteQuote: "",
      thoughts: "",
      summary: "",
      startedAt:
        selectedStatus === "reading" || selectedStatus === "finished"
          ? now
          : undefined,
      finishedAt: selectedStatus === "finished" ? now : undefined,
      updatedAt: now,
      lastReadAt: undefined,
      readingHistory: [],
    };

    try {
      const savedBooks = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedBooks: Book[] = savedBooks ? JSON.parse(savedBooks) : [];
      const updatedBooks = [...parsedBooks, newBook];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));

      Alert.alert("Saved", "Book was added to your library.");
      resetForm();
      router.back();
    } catch (error) {
      console.log("Error saving book:", error);
      setErrorMessage("Could not save the book.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Add New Book</Text>
      <Text style={styles.subtitle}>
        Create a new book entry in your library
      </Text>

      <View style={styles.formCard}>
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
          placeholder="Example: 320"
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Current Page</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 40"
          value={currentPage}
          onChangeText={setCurrentPage}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusOptionsRow}>
          {renderStatusOption("Planned", "planned")}
          {renderStatusOption("Reading", "reading")}
          {renderStatusOption("Finished", "finished")}
        </View>

        <Text style={styles.helperText}>
          Planned sets current page to 0. Finished sets it to total pages.
        </Text>

        <Text style={styles.label}>Genre</Text>
        <View style={styles.genreOptionsWrap}>
          {GENRES.map(renderGenreOption)}
        </View>

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

        <Pressable style={styles.saveButton} onPress={handleSaveBook}>
          <Text style={styles.saveButtonText}>Save Book</Text>
        </Pressable>
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
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  formCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },

  statusOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
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

  genreOptionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  genreOption: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },

  genreOptionActive: {
    backgroundColor: "#6C63FF",
  },

  genreOptionText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },

  genreOptionTextActive: {
    color: "#FFFFFF",
  },

  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
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
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "500",
  },

  saveButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
