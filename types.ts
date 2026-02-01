
export interface Habit {
  id: number;
  text: string;
  done: boolean;
  created_at?: string;
}

export interface HistoryRecord {
  date: string;
  progress: number;
}

export interface Transformation {
  image: string;
  // Added fallback property to provide a backup URL when local assets fail to load
  fallback: string;
  name: string;
  auraColor: string;
  kiColor: string;
  textColor: string;
}
