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
};

export const getProgressPercentage = (
  currentPage: number,
  totalPages: number,
) => {
  if (totalPages <= 0) return 0;

  const safeCurrentPage = Math.min(Math.max(currentPage, 0), totalPages);

  return Math.round((safeCurrentPage / totalPages) * 100);
};

export const getBookStatus = (
  currentPage: number,
  totalPages: number,
): BookStatus => {
  if (currentPage <= 0) return "planned";
  if (currentPage >= totalPages) return "finished";
  return "reading";
};

export const calculateCompletionRate = (books: Book[]) => {
  if (books.length === 0) return 0;

  const finishedBooks = books.filter((book) => book.status === "finished");

  return Math.round((finishedBooks.length / books.length) * 100);
};

export const calculateBooksLeft = (
  finishedBooks: number,
  booksPerYear: number,
) => {
  return Math.max(0, booksPerYear - finishedBooks);
};

export const calculateTotalPagesRead = (books: Book[]) => {
  return books.reduce((sum, book) => sum + Math.max(0, book.currentPage), 0);
};

export const getFavoriteGenre = (books: Book[]) => {
  if (books.length === 0) return "—";

  const genreCounts = books.reduce<Record<string, number>>((acc, book) => {
    const genre = book.genre || "Other";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const favoriteGenre = Object.entries(genreCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return favoriteGenre ? favoriteGenre[0] : "—";
};

export const filterBooksByQuery = (books: Book[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return books;

  return books.filter((book) => {
    return (
      book.title.toLowerCase().includes(normalizedQuery) ||
      book.author.toLowerCase().includes(normalizedQuery) ||
      (book.genre || "").toLowerCase().includes(normalizedQuery)
    );
  });
};

export const sortBooksByProgress = (books: Book[]) => {
  return [...books].sort((a, b) => {
    const progressA = getProgressPercentage(a.currentPage, a.totalPages);
    const progressB = getProgressPercentage(b.currentPage, b.totalPages);

    return progressB - progressA;
  });
};
