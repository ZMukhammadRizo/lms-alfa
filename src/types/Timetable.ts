export interface TimeSlot {
  id: string;
  day: number;
  startTime: number;
  endTime: number;
  classId?: string;
  className?: string;
  teacher?: string;
  room?: string;
  color?: string;
  title?: string;
  subjectId?: string;
  teacherId?: string;
  day_date?: string;
  start_minute?: number;
  end_minute?: number;
  classes?: { classname: string | null }[];
}

export interface TimetableDay {
  name: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: TimeSlot[];
}

export interface Timetable {
  id: string;
  name: string;
  days: TimetableDay[];
} 