import { AppState, TestRecord, Tab } from '../types';
import { generateInitialRecords } from '../constants';

const STORAGE_KEY = 'ielts_tracker_data_v4'; // Bumped version to force reset for new schedule

// "Monday 5 January" occurs in 2026. If you meant 2025, Jan 5 was a Sunday. 
// Setting to 2026-01-05 (Monday) to match your specific day/date request.
// You can edit this string if you meant a different year.
const DEFAULT_START_DATE = '2026-01-05T00:00:00.000Z'; 

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure records exist
      if (!parsed.records) {
        return {
           startDate: DEFAULT_START_DATE,
           records: generateInitialRecords(),
           uiState: { activeTab: Tab.BOOKS, selectedBook: null }
        }
      }
      return {
        startDate: parsed.startDate || DEFAULT_START_DATE,
        records: parsed.records,
        uiState: parsed.uiState || { activeTab: Tab.BOOKS, selectedBook: null }
      };
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }

  // Default state
  return {
    startDate: DEFAULT_START_DATE,
    records: generateInitialRecords(),
    uiState: { activeTab: Tab.BOOKS, selectedBook: null }
  };
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};