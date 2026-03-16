export type BookStatus = "planned" | "reading" | "finished";

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  description?: string;
  notes?: string;
  coverUri?: string;
  createdAt: string;
  updatedAt: string;
}
