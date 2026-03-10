import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Book } from "./types";

interface BooksState {
  items: Book[];
}

const initialState: BooksState = {
  items: [],
};

const booksSlice = createSlice({
  name: "books",
  initialState,
  reducers: {
    addBook(state, action: PayloadAction<Book>) {
      state.items.push(action.payload);
    },

    removeBook(state, action: PayloadAction<string>) {
      state.items = state.items.filter((book) => book.id !== action.payload);
    },

    updateBookProgress(
      state,
      action: PayloadAction<{ id: string; currentPage: number }>,
    ) {
      const book = state.items.find((book) => book.id === action.payload.id);

      if (book) {
        book.currentPage = action.payload.currentPage;
      }
    },
  },
});

export const { addBook, removeBook, updateBookProgress } = booksSlice.actions;

export default booksSlice.reducer;
