// src/types.ts

export type TaskPriority = "High" | "Medium" | "Low";
export type ProcrastinationRisk = "Critical" | "High" | "Moderate" | "Low";

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  category: string;
  deadline: string; // ISO string or simple date YYYY-MM-DD
  priority: TaskPriority;
  isUrgent: boolean;
  isImportant: boolean;
  isCompleted: boolean;
  procrastinationRisk: ProcrastinationRisk;
  savingExplanation?: string;
  timeBlockMinutes?: number;
  gettingStartedTip?: string;
  
  // Breakdown breaker details
  subtasks?: SubTask[];
  draftContent?: string;
  procrastinationQuote?: string;
  breakdownApplied?: boolean;
}

export interface CalendarBlock {
  start: string; // HH:MM
  end: string;   // HH:MM
  title: string;
  taskId: string; // Associated Task ID (if focusing on a specific task)
  type: "focus" | "break" | "buffer";
  reason: string;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: string[]; // List of YYYY-MM-DD dates completed
  isCompletedToday: boolean;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  audio?: string; // Base64 audio if speech generation was enabled
}
