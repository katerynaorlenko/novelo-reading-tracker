import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BookStatus = "planned" | "reading" | "finished";

export type Book = {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  genre?: string;
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

type BooksState = {
  books: Book[];
};

const initialState: BooksState = {
  books: [],
};

const booksSlice = createSlice({
  name: "books",
  initialState,
  reducers: {
    setBooks(state, action: PayloadAction<Book[]>) {
      state.books = action.payload;
    },

    addBook(state, action: PayloadAction<Book>) {
      const exists = state.books.some((book) => book.id === action.payload.id);

      if (!exists) {
        state.books.unshift(action.payload);
      }
    },

    updateBook(state, action: PayloadAction<Book>) {
      const index = state.books.findIndex(
        (book) => book.id === action.payload.id,
      );

      if (index !== -1) {
        state.books[index] = action.payload;
      }
    },

    deleteBook(state, action: PayloadAction<string>) {
      state.books = state.books.filter((book) => book.id !== action.payload);
    },

    clearBooks(state) {
      state.books = [];
    },
  },
});

export const { setBooks, addBook, updateBook, deleteBook, clearBooks } =
  booksSlice.actions;

export default booksSlice.reducer;
