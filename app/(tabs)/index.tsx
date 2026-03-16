import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Book = {
  id: string;
  title: string;
  author: string;
  status: "planned" | "reading" | "finished";
};

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);

  const handleAddBook = () => {
    const newBook: Book = {
      id: Date.now().toString(),
      title: "Atomic Habits",
      author: "James Clear",
      status: "reading",
    };

    setBooks((prevBooks) => [...prevBooks, newBook]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novelo</Text>
      <Text style={styles.subtitle}>My Library</Text>

      {books.length === 0 ? (
        <Text style={styles.text}>No books yet</Text>
      ) : (
        <View style={styles.list}>
          {books.map((book) => (
            <View key={book.id} style={styles.card}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
              <Text style={styles.bookStatus}>Status: {book.status}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.button} onPress={handleAddBook}>
        <Text style={styles.buttonText}>Add Book</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginTop: 16,
    color: "#666",
  },
  list: {
    width: "100%",
    marginTop: 16,
    marginBottom: 24,
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
  bookStatus: {
    fontSize: 14,
    color: "#6C63FF",
    marginTop: 8,
    fontWeight: "600",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
