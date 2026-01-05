export interface ScoreInput {
  listeningRaw: number | null;
  readingRaw: number | null;
  writingTask1: number | null;
  writingTask2: number | null;
}

export interface TestRecord {
  id: string; // format: "b{book}-t{test}"
  bookNumber: number;
  testNumber: number;
  isCompleted: boolean;
  completedDate: string | null; // ISO string
  isResolved: boolean;
  resolvedDate: string | null; // ISO string
  scores: ScoreInput;
  calculatedBand: {
    listening: number;
    reading: number;
    writing: number;
    overall: number;
  };
}

export enum Tab {
  BOOKS = 'books',
  ANALYTICS = 'analytics',
}

export interface AppState {
  startDate: string; // ISO string
  records: TestRecord[];
  uiState?: {
    activeTab: Tab;
    selectedBook: number | null;
  };
}

export interface BandConversion {
  raw: number;
  band: number;
}