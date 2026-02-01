
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
  name: string;
  auraColor: string;
  kiColor: string;
  textColor: string;
}
