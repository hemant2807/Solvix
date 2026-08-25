export type SheetCategory = 'curated' | 'company' | 'contest' | 'custom';

export interface SheetQuestion {
  id: string;
  name: string;
  leetcodeUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
  category?: string;
}

export interface PracticeSheet {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: SheetCategory;
  author?: string;
  totalQuestions: number;
  questions: SheetQuestion[];
}
