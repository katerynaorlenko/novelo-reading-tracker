import {
    Book,
    calculateBooksLeft,
    calculateCompletionRate,
    calculateTotalPagesRead,
    filterBooksByQuery,
    getBookStatus,
    getFavoriteGenre,
    getProgressPercentage,
    sortBooksByProgress,
} from "./readingStats";

const books: Book[] = [
  {
    id: "1",
    title: "Harry Potter",
    author: "J.K. Rowling",
    totalPages: 400,
    currentPage: 200,
    status: "reading",
    genre: "Fantasy",
    rating: 5,
  },
  {
    id: "2",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    totalPages: 300,
    currentPage: 300,
    status: "finished",
    genre: "Fantasy",
    rating: 4,
  },
  {
    id: "3",
    title: "Atomic Habits",
    author: "James Clear",
    totalPages: 250,
    currentPage: 0,
    status: "planned",
    genre: "Self-development",
    rating: 0,
  },
];

describe("readingStats utilities", () => {
  test("calculates reading progress percentage", () => {
    expect(getProgressPercentage(200, 400)).toBe(50);
  });

  test("limits progress percentage to 100 when current page is too high", () => {
    expect(getProgressPercentage(500, 400)).toBe(100);
  });

  test("returns planned status for zero pages", () => {
    expect(getBookStatus(0, 400)).toBe("planned");
  });

  test("returns finished status when current page equals total pages", () => {
    expect(getBookStatus(400, 400)).toBe("finished");
  });

  test("calculates library completion rate", () => {
    expect(calculateCompletionRate(books)).toBe(33);
  });

  test("calculates books left for yearly goal", () => {
    expect(calculateBooksLeft(1, 35)).toBe(34);
  });

  test("calculates total pages read", () => {
    expect(calculateTotalPagesRead(books)).toBe(500);
  });

  test("detects favorite genre", () => {
    expect(getFavoriteGenre(books)).toBe("Fantasy");
  });

  test("filters books by title, author or genre", () => {
    const result = filterBooksByQuery(books, "tolkien");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("The Hobbit");
  });

  test("sorts books by reading progress from highest to lowest", () => {
    const result = sortBooksByProgress(books);

    expect(result[0].title).toBe("The Hobbit");
    expect(result[1].title).toBe("Harry Potter");
    expect(result[2].title).toBe("Atomic Habits");
  });
});
