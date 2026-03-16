import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Book = {
  id: string;
  title: string;
  author: string;
  status: "planned" | "reading" | "finished";
};

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const handleAddBook = () => {
    if (!title.trim() || !author.trim()) {
      return;
    }

    const newBook: Book = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      status: "planned",
    };

    setBooks((prevBooks) => [...prevBooks, newBook]);
    setTitle("");
    setAuthor("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Novelo</Text>
      <Text style={styles.subtitle}>My Library</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Book title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Author"
          value={author}
          onChangeText={setAuthor}
        />

        <Pressable style={styles.button} onPress={handleAddBook}>
          <Text style={styles.buttonText}>Save Book</Text>
        </Pressable>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
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
  form: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
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
  bookStatus: {
    fontSize: 14,
    color: "#6C63FF",
    marginTop: 8,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
