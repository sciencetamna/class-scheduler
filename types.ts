
export interface ScheduleItem {
  id: string;
  day: number; // 1-5 for Mon-Fri
  period: number; // 1-7 for periods
  subject: string;
  classId: string; // The free-form class name, e.g., "3-1" or "관광경영과"
}

export interface ProgressData {
  [key: string]: string; // Key: 'w{week}-c{classId}-s{session}' -> e.g., 'w1-c3-1-s1'
}

export interface Week {
  id: number;
  label: string;
  dates: string;
}