export interface DailyGoal {
  target: number;
  completed: number;
}

export interface WeeklyActivityDay {
  dayName: string;
  dateStr: string;
  solvedCount: number;
  timeSpentSeconds: number;
  isToday: boolean;
}

export interface FocusProblem {
  id: string;
  name: string;
  leetcodeUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sheetName: string;
}

export interface DashboardStats {
  todaySolved: number;
  todayTimeSpentSeconds: number;
  currentStreak: number;
  totalSolved: number;
  totalBookmarks: number;
  totalNotes: number;
}
