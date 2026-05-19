export type Genre = "romance" | "fantasy" | "horror" | "action" | "school" | "sci-fi";

export interface Story {
  id: string;
  author_id: string | null;
  author_name: string;
  author_avatar: string | null;
  title: string;
  slug: string;
  synopsis: string | null;
  cover_url: string | null;
  cover_gradient: string | null;
  genre: string;
  tags: string[] | null;
  status: string;
  is_premium: boolean;
  is_vip: boolean;
  views: number;
  likes_count: number;
  comments_count: number;
  unlock_count: number;
  favorite_count: number;
  is_trending: boolean;
  is_recommended: boolean;
  created_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  title: string;
  content: string;
  order_index: number;
  is_premium: boolean;
  coin_price: number;
  word_count: number;
  reader_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  coin_balance: number;
  is_verified: boolean;
  created_at: string;
}

export const GENRES: { value: string; label: string }[] = [
  { value: "all", label: "All Genres" },
  { value: "romance", label: "Romance" },
  { value: "fantasy", label: "Fantasy" },
  { value: "horror", label: "Horror" },
  { value: "action", label: "Action" },
  { value: "school", label: "School" },
  { value: "sci-fi", label: "Sci-Fi" },
];

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
