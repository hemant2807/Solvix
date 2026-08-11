import type { PracticeSheet, SheetCategory, SheetQuestion } from './types';
import { striverA2zSheet } from './striverA2z';
import { striverSdeSheet } from './striverSde';
import { blind75Sheet } from './blind75';
import { blind150Sheet } from './blind150';
import { neetcode150Sheet } from './neetcode150';
import { loveBabbar450Sheet } from './loveBabbar450';

export * from './types';

export const PRACTICE_SHEETS: PracticeSheet[] = [
  striverA2zSheet,
  striverSdeSheet,
  blind75Sheet,
  blind150Sheet,
  neetcode150Sheet,
  loveBabbar450Sheet
];

export const DEFAULT_SHEET_ID = 'striver-sde';

export function getSheetById(id: string): PracticeSheet {
  const sheet = PRACTICE_SHEETS.find((s) => s.id === id);
  return sheet || striverSdeSheet;
}

let flatQuestionIndex: Map<string, SheetQuestion> | null = null;

function getFlatQuestionIndex(): Map<string, SheetQuestion> {
  if (!flatQuestionIndex) {
    flatQuestionIndex = new Map();
    for (const sheet of PRACTICE_SHEETS) {
      for (const question of sheet.questions) {
        if (!flatQuestionIndex.has(question.name)) {
          flatQuestionIndex.set(question.name, question);
        }
      }
    }
  }
  return flatQuestionIndex;
}

// Best-effort lookup by problem name, matched across every bundled sheet.
// Used to tag submissions/sessions for problems solved outside the sheet flow.
export function findSheetQuestionByName(name: string): SheetQuestion | undefined {
  return getFlatQuestionIndex().get(name);
}

export function findDifficultyByQuestionName(name: string): 'Easy' | 'Medium' | 'Hard' | undefined {
  return getFlatQuestionIndex().get(name)?.difficulty;
}

export const SHEET_CATEGORIES: { id: SheetCategory; label: string }[] = [
  { id: 'curated', label: 'Curated Sheets' },
  { id: 'company', label: 'Company Sheets' },
  { id: 'contest', label: 'Contest Sheets' },
  { id: 'custom', label: 'Custom Sheets' }
];
