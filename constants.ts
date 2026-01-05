import { BandConversion, TestRecord } from './types';

// Approximate Academic Reading/Listening to Band Score
export const RAW_TO_BAND: BandConversion[] = [
  { raw: 40, band: 9.0 }, { raw: 39, band: 9.0 },
  { raw: 38, band: 8.5 }, { raw: 37, band: 8.5 },
  { raw: 36, band: 8.0 }, { raw: 35, band: 8.0 },
  { raw: 34, band: 7.5 }, { raw: 33, band: 7.5 }, { raw: 32, band: 7.5 },
  { raw: 31, band: 7.0 }, { raw: 30, band: 7.0 },
  { raw: 29, band: 6.5 }, { raw: 28, band: 6.5 }, { raw: 27, band: 6.5 },
  { raw: 26, band: 6.0 }, { raw: 25, band: 6.0 }, { raw: 24, band: 6.0 },
  { raw: 23, band: 6.0 },
  { raw: 22, band: 5.5 }, { raw: 21, band: 5.5 }, { raw: 20, band: 5.5 },
  { raw: 19, band: 5.5 },
  { raw: 18, band: 5.0 }, { raw: 17, band: 5.0 }, { raw: 16, band: 5.0 },
];

export const getBandScore = (raw: number | null): number => {
  if (raw === null) return 0;
  const match = RAW_TO_BAND.find(c => c.raw === raw);
  if (match) return match.band;
  // Fallback for lower scores
  if (raw >= 13) return 4.5;
  if (raw >= 10) return 4.0;
  return 3.5;
};

export const calculateWriting = (t1: number | null, t2: number | null): number => {
  const v1 = t1 || 0;
  const v2 = t2 || 0;
  if (v1 === 0 && v2 === 0) return 0;
  // IELTS Writing weight: Task 2 is worth double Task 1
  // Formula: (T1 + 2*T2) / 3
  const weighted = (v1 + (v2 * 2)) / 3;
  return Math.round(weighted * 2) / 2;
};

export const calculateOverall = (l: number, r: number, w: number): number => {
  // Average of 3 skills
  const avg = (l + r + w) / 3;
  return Math.round(avg * 2) / 2;
};

export const INITIAL_BOOKS_START = 5;
export const INITIAL_BOOKS_END = 20;

export const generateInitialRecords = (): TestRecord[] => {
  const records: TestRecord[] = [];
  for (let b = INITIAL_BOOKS_START; b <= INITIAL_BOOKS_END; b++) {
    for (let t = 1; t <= 4; t++) {
      records.push({
        id: `b${b}-t${t}`,
        bookNumber: b,
        testNumber: t,
        isCompleted: false,
        completedDate: null,
        isResolved: false,
        resolvedDate: null,
        scores: {
          listeningRaw: null,
          readingRaw: null,
          writingTask1: null,
          writingTask2: null,
        },
        calculatedBand: {
          listening: 0,
          reading: 0,
          writing: 0,
          overall: 0,
        },
      });
    }
  }
  return records;
};

export const TARGET_SCORES = {
  listening: 8.0,
  reading: 9.0,
  writing: 7.0,
};