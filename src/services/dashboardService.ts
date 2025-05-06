import supabase from "../config/supabaseClient";
import { useAuth } from '../contexts/AuthContext';

/**
 * Dashboard Data Service
 * Centralized service for fetching all dashboard-related data from Supabase
 */

// Dashboard statistics interface
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  inactiveStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  activeClasses: number;
  upcomingEvents: number;
  systemHealth: {
    status: string;
    uptime: string;
    storageUsed: number;
  };
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  created_at: string;
}

export interface PerformanceData {
  subject: string;
  completion: number;
}

export interface TopStudent {
  id: string;
  name: string;
  grade: string;
  performance: number;
  subject: string;
}

export interface RecentAssessment {
  id: string;
  title: string;
  date: string;
  participation: string;
  avgScore: string;
}

export interface AttendanceData {
  day: string;
  attendance: number;
}

// Student Dashboard Interfaces
export interface StudentAssignment {
  id: string;
  title: string;
  dueDate: string;
  subject: string;
  status: string;
}

export interface StudentGrade {
  id: string;
  title: string;
  grade: number;
  subject: string;
  date: string;
}

export interface StudentCourse {
  id: string;
  name: string;
  progress: number;
  teacher: string;
  nextClass: string;
}

export interface StudentLesson {
  id: string;
  title: string;
  subject: string;
  time: string;
  duration: string;
  room: string;
}

export interface StudentStats {
  courses: number;
  assignments: number;
  averageGrade: string;
  progress: string;
}

// Teacher Dashboard Interfaces
export interface TeacherClass {
  id: string;
  name: string;
  grade: string;
  section: string;
  students: number;
  averagePerformance: number;
  nextSession: string;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  dueDate: string;
  class: string;
  subject: string;
  submissionRate: number;
}

export interface TeacherStudent {
  id: string;
  name: string;
  grade: string;
  performance: number;
  attendance: number;
  lastActivity: string;
}

export interface TeacherStats {
  classes: number;
  students: number;
  assignments: number;
  averageAttendance: string;
}

// Define interfaces for the data we expect
export interface CourseInfo {
  id: string;
  name: string;
  // Add other relevant fields like teacher name if needed
}

export interface AssignmentInfo {
  id: string;
  title: string;
  dueDate: string;
  courseName?: string; // Optional: Name of the class/subject
}

export interface ScheduleEntry {
  id: string;
  title: string; // Subject or Lesson name
  startTime: string;
  endTime: string;
  location?: string;
}

export interface RecentGrade {
  id: string;
  lessonName: string;
  subjectName: string;
  score: number;
  date: string;
}

/**
 * Fetch all dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get user count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get student count
    const { data: students, count: totalStudents } = await supabase
      .from('users')
      .select('id, status', { count: 'exact' })
      .eq('role', 'Student');

    const inactiveStudents = students?.filter(s => s.status === 'inactive').length || 0;

    // Get teacher count
    const { count: totalTeachers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'Teacher');

    // Get class count
    const { count: totalClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true });

    // Get active classes
    const { count: activeClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get subject count
    const { count: totalSubjects } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    // // Get upcoming events (REMOVED - table doesn't exist)
    // const { count: upcomingEvents } = await supabase
    //   .from('events')
    //   .select('*', { count: 'exact', head: true })
    //   .gte('event_date', new Date().toISOString());
    const upcomingEvents = 0; // Default to 0

    return {
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      inactiveStudents,
      totalTeachers: totalTeachers || 0,
      totalClasses: totalClasses || 0,
      totalSubjects: totalSubjects || 0,
      activeClasses: activeClasses || 0,
      upcomingEvents: upcomingEvents || 0,
      systemHealth: {
        status: 'Healthy',
        uptime: '99.9%',
        storageUsed: 68 // Could be fetched from storage stats API
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      totalStudents: 0,
      inactiveStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
      activeClasses: 0,
      upcomingEvents: 0,
      systemHealth: {
        status: 'Error',
        uptime: '0%',
        storageUsed: 0
      }
    };
  }
}

/**
 * Fetch recent activities
 */
export async function getRecentActivities(limit = 5): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*, users(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(activity => ({
      id: activity.id,
      user: activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : 'Unknown User',
      action: activity.action,
      time: formatTimeAgo(new Date(activity.created_at)),
      created_at: activity.created_at
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Fetch subject performance data
 */
export async function getPerformanceData(): Promise<PerformanceData[]> {
  try {
    const { data, error } = await supabase
      .from('subject_performance')
      .select('subject_name, completion_rate');

    if (error) throw error;

    return (data || []).map(item => ({
      subject: item.subject_name,
      completion: item.completion_rate
    }));
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return [];
  }
}

/**
 * Fetch top performing students
 */
export async function getTopStudents(limit = 4): Promise<TopStudent[]> {
  console.warn("getTopStudents: 'student_performance' table/view does not exist or is not implemented. Returning empty array.");
  return [];
  /* // Original code commented out
  try {
    console.log(`Fetching top ${limit} students...`);
    const { data, error } = await supabase
      .from('student_performance') 
      .select('student_id, subject_id, score') // Select known/likely columns, adjust as needed
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching top students:", error);
      console.error(`Details: ${JSON.stringify(error)}`);
      throw error;
    }

    if (!data) {
      console.log("No top student data found.");
      return [];
    }

    console.log("Raw top student data:", data);

    // Manual fetching of related data (less efficient, but avoids join error)
    const studentIds = data.map(s => s.student_id);
    const subjectIds = data.map(s => s.subject_id);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, firstName, lastName')
      .in('id', studentIds);

    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, subjectname') // Assuming subjectname column exists
      .in('id', subjectIds);
    
    if (usersError) console.error("Error fetching user names for top students:", usersError);
    if (subjectsError) console.error("Error fetching subject names for top students:", subjectsError);

    const usersMap = new Map(usersData?.map(u => [u.id, `${u.firstName} ${u.lastName}`]) || []);
    const subjectsMap = new Map(subjectsData?.map(s => [s.id, s.subjectname]) || []);

    // Format the response
    const formattedData: TopStudent[] = data.map(item => ({
      id: item.student_id,
      name: usersMap.get(item.student_id) || 'Unknown Student',
      performance: item.score,
      subject: subjectsMap.get(item.subject_id) || 'Unknown Subject',
      grade: 'N/A' // Grade info is not available from student_performance
    }));

    console.log("Formatted top student data:", formattedData);
    return formattedData;

  } catch (error) {
    // Catch block remains the same
    console.error('Error fetching top students:', error);
    return [];
  }
  */
}

/**
 * Fetch recent assessments
 */
export async function getRecentAssessments(limit = 4): Promise<RecentAssessment[]> {
  console.warn("getRecentAssessments: 'assessments' table does not exist or is not implemented. Returning empty array.");
  return [];
  /* // Original code commented out
  try {
    const { data, error } = await supabase
      .from('assessments') // Table does not exist
      .select('*')
      .order('date', { descending: true })
      .limit(limit);

    if (error) throw error;

    // Format the response
    return data.map(item => ({
      id: item.id,
      title: item.title,
      date: formatDate(item.date),
      participation: `${item.participation_rate}%`,
      avgScore: `${item.average_score}%`,
    }));

  } catch (error) {
    console.error('Error fetching recent assessments:', error);
    return [];
  }
  */
}

/**
 * Fetch attendance data
 */
export async function getAttendanceData(): Promise<AttendanceData[]> {
  console.warn("getAttendanceData: 'daily_attendance' view/table does not exist or is not implemented. Returning empty array.");
  return [];
  /* // Original code commented out
  try {
    const { data, error } = await supabase
      .from('daily_attendance') // View/Table does not exist
      .select('day, attendance_rate')
      .order('day_order', { ascending: true });

    if (error) throw error;

    return data.map(item => ({
      day: item.day,
      attendance: item.attendance_rate,
    }));

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return [];
  }
  */
}

/**
 * Fetch student's upcoming assignments
 */
export async function getStudentAssignments(studentId: string, limit = 5): Promise<StudentAssignment[]> {
  if (!studentId) return [];

  try {
    // 1. Get class IDs for the student
    const { data: studentClasses, error: studentClassesError } = await supabase
      .from('classstudents')
      .select('classid')
      .eq('studentid', studentId);

    if (studentClassesError || !studentClasses || studentClasses.length === 0) {
      console.error('Error fetching student classes or no classes found:', studentClassesError);
      return []; // Return empty array if no classes found
    }
    const classIds = studentClasses.map(sc => sc.classid);

    // 2. Fetch assignments for those classes
    const today = new Date().toISOString(); // Get current date/time
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      // Remove status column, fetch classid if needed later
      .select('id, title, duedate, classid') 
      .in('classid', classIds) // Filter by the student's classes
      .gt('duedate', today) // Add filter for future due dates
      .order('duedate', { ascending: true })
      .limit(limit);

    if (assignmentsError) {
      console.error('Error fetching student assignments:', assignmentsError);
      return []; // Return empty on error
    }

    return assignments.map((assignment: any) => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.duedate,
      subject: 'General',
      // Set status to 'Upcoming' as these are assignments due in the future
      status: 'Upcoming' 
    }));
  } catch (error) {
    console.error('Error in getStudentAssignments logic:', error);
    return []; // Return empty on general error
  }
}

/**
 * Fetch student's recent grades
 */
export async function getStudentGrades(studentId: string): Promise<StudentGrade[]> {
  try {
    // First check if the table exists by querying without filtering
    const { data: checkData, error: checkError } = await supabase
      .from('grades')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('Grades table not found or error, returning mock data');
      return getMockGrades();
    }
    
    // Query using appropriate columns from your schema
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      // Replace with the actual column that links to students if it exists
      // .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching student grades:', error);
      return getMockGrades();
    }

    return data.map((grade: any) => ({
      id: grade.id,
      title: grade.title || 'Assessment',
      grade: grade.score || 0,
      subject: grade.subject || 'General',
      date: grade.created_at
    }));
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return getMockGrades();
  }
}

// Mock grades data
export function getMockGrades(): StudentGrade[] {
  return [
    {
      id: '1',
      title: 'Midterm Exam',
      grade: 85,
      subject: 'Mathematics',
      date: new Date(Date.now() - 7 * 86400000).toISOString() // 7 days ago
    },
    { id: '2', title: 'History Essay', grade: 88, subject: 'History', date: '2023-05-05' },
    { id: '3', title: 'Biology Quiz', grade: 95, subject: 'Biology', date: '2023-05-02' },
  ];
}

/**
 * Fetch student's enrolled courses
 */
export async function getStudentCourses(studentId: string): Promise<CourseInfo[]> {
  if (!studentId) return [];

  // 1. Get class IDs for the student
  const { data: studentClasses, error: studentClassesError } = await supabase
    .from('classstudents')
    .select('classid')
    .eq('studentid', studentId);

  if (studentClassesError || !studentClasses) {
    console.error('Error fetching student classes:', studentClassesError);
    return [];
  }
  if (studentClasses.length === 0) return [];

  const classIds = studentClasses.map(sc => sc.classid);

  // 2. Get subject IDs linked to those classes
  const { data: classSubjects, error: classSubjectsError } = await supabase
    .from('classsubjects')
    .select('subjectid')
    .in('classid', classIds);

  if (classSubjectsError || !classSubjects) {
    console.error('Error fetching class subjects:', classSubjectsError);
    return [];
  }
  if (classSubjects.length === 0) return [];

  const subjectIds = [...new Set(classSubjects.map(cs => cs.subjectid))]; // Unique subject IDs

  // 3. Get subject details
  const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
    .select('id, subjectname')
    .in('id', subjectIds);

  if (subjectsError || !subjects) {
    console.error('Error fetching subjects:', subjectsError);
    return [];
  }

  return subjects.map(subject => ({
      id: subject.id,
      name: subject.subjectname,
  }));
}

/**
 * Get the count of active assignments for a student.
 */
export const getStudentAssignmentCount = async (studentId: string): Promise<number> => {
  if (!studentId) return 0;

  // 1. Get class IDs for the student
  const { data: studentClasses, error: studentClassesError } = await supabase
    .from('classstudents')
    .select('classid')
    .eq('studentid', studentId);

  if (studentClassesError || !studentClasses || studentClasses.length === 0) {
    console.error('Error fetching student classes or no classes found:', studentClassesError);
    return 0;
  }

  const classIds = studentClasses.map(sc => sc.classid);

  // 2. Count assignments for those classes with future due dates
  const today = new Date().toISOString();
  const { count, error: countError } = await supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .in('classid', classIds)
    .gt('duedate', today); // Filter for assignments due in the future

  if (countError) {
    console.error('Error counting assignments:', countError);
    return 0;
  }

  return count || 0;
};

/**
 * Get the student's schedule for today.
 */
export const getStudentTodaySchedule = async (studentId: string): Promise<ScheduleEntry[]> => {
    if (!studentId) return [];

    // 1. Get class IDs for the student
    const { data: studentClasses, error: studentClassesError } = await supabase
        .from('classstudents')
        .select('classid')
        .eq('studentid', studentId);

    if (studentClassesError || !studentClasses || studentClasses.length === 0) {
        console.error('Error fetching student classes or no classes found:', studentClassesError);
        return [];
    }
    const classIds = studentClasses.map(sc => sc.classid);

    // 2. Get today's day index (0=Sun, 1=Mon, ..., 6=Sat)
    const todayIndex = new Date().getDay();
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 3. Fetch timetable entries for today
    const { data: timetableEntries, error: timetableError } = await supabase
        .from('timetable')
        .select('*, subjects(subjectname)') // Fetch related subject name
        .in('classId', classIds)
        // Filter by the specific date instead of just the day index
        .eq('day_date', todayDate) // Assuming 'day_date' column exists and stores YYYY-MM-DD
        // .eq('day', todayIndex) // Remove or keep this if needed for recurring entries without a specific date
        .order('start_time', { ascending: true })
        .order('start_minute', { ascending: true });

    if (timetableError) {
        console.error('Error fetching timetable:', timetableError);
        return [];
    }

    // Format the entries
    return timetableEntries.map(entry => {
        const startTime = `${String(entry.start_time).padStart(2, '0')}:${String(entry.start_minute).padStart(2, '0')}`;
        const endTime = `${String(entry.end_time).padStart(2, '0')}:${String(entry.end_minute).padStart(2, '0')}`;
        return {
            id: entry.id,
            title: entry.title || entry.subjects?.subjectname || 'Scheduled Item',
            startTime: startTime,
            endTime: endTime,
            location: entry.location,
        };
    });
};

/**
 * Get upcoming assignments for the student.
 */
export const getStudentUpcomingAssignments = async (studentId: string, limit = 5): Promise<AssignmentInfo[]> => {
  if (!studentId) return [];

  const { data: studentClasses, error: studentClassesError } = await supabase
    .from('classstudents')
    .select('classid')
    .eq('studentid', studentId);

  if (studentClassesError || !studentClasses || studentClasses.length === 0) {
    console.error('Error fetching student classes or no classes found:', studentClassesError);
    return [];
  }
  const classIds = studentClasses.map(sc => sc.classid);

  const today = new Date().toISOString();
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, title, duedate, classes(classname)') // Fetch related class name
    .in('classid', classIds)
    .gt('duedate', today)
    .order('duedate', { ascending: true })
    .limit(limit);

  if (assignmentsError) {
    console.error('Error fetching upcoming assignments:', assignmentsError);
    return [];
  }

  return assignments.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    dueDate: assignment.duedate,
    courseName: assignment.classes?.[0]?.classname || 'Unknown Class',
  }));
};

/**
 * Get recent grades for the student.
 */
export const getStudentRecentGrades = async (studentId: string, limit = 5): Promise<RecentGrade[]> => {
  if (!studentId) return [];

  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    // Revert to explicit foreign key hint syntax
    .select(`
      id,
      score,
      created_at,
      lessons:lesson_id ( lessonname, subjects:subjectid ( subjectname ) )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (scoresError) {
    console.error('Error fetching recent scores:', scoresError);
    return [];
  }

  // Flatten and format the data - access objects directly using type assertion
  return scores.map(score => {
    // --- Remove logging ---
    // console.log('[getStudentRecentGrades] Raw score data:', JSON.stringify(score, null, 2));
    // ------------------------

    const lessonData = score.lessons as any; // Assert type to access as object
    const subjectData = lessonData?.subjects as any; // Assert type to access as object

    // --- Remove logging ---
    // console.log('[getStudentRecentGrades] Mapped lessonData:', lessonData);
    // console.log('[getStudentRecentGrades] Mapped subjectData:', subjectData);
    // ------------------------

    return {
        id: score.id,
        lessonName: lessonData?.lessonname || 'Unknown Lesson',
        subjectName: subjectData?.subjectname || 'Unknown Subject',
        score: score.score,
        date: score.created_at,
    }
  });
};

/**
 * Fetch student's lessons (e.g., for the current week or a specific timeframe)
 */
export const getStudentLessons = async (studentId: string, limit = 10): Promise<StudentLesson[]> => {
    if (!studentId) return [];

    // 1. Get class IDs for the student
    const { data: studentClasses, error: studentClassesError } = await supabase
        .from('classstudents')
        .select('classid')
        .eq('studentid', studentId);

    if (studentClassesError || !studentClasses || studentClasses.length === 0) {
        console.error('Error fetching student classes or no classes found:', studentClassesError);
        return [];
    }
    const classIds = studentClasses.map(sc => sc.classid);

    // 2. Get subject IDs linked to those classes
    const { data: classSubjects, error: classSubjectsError } = await supabase
        .from('classsubjects')
        .select('subjectid')
        .in('classid', classIds);

    if (classSubjectsError || !classSubjects || classSubjects.length === 0) {
        console.error('Error fetching class subjects:', classSubjectsError);
        return [];
    }
    const subjectIds = [...new Set(classSubjects.map(cs => cs.subjectid))];

    // 3. Fetch lessons for those subjects (adjust filtering as needed, e.g., by date)
    const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*, subjects(subjectname)') // Fetch related subject name
        .in('subjectid', subjectIds)
        // Add date filters here if needed, e.g., for the current week
        .order('lesson_date', { ascending: true }) // Assuming a lesson_date column exists
        .limit(limit);

    if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        // Add mock data return if desired
        return [];
    }

    // Format the entries
    return lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.lessonname || 'Lesson',
        subject: lesson.subjects?.subjectname || 'Unknown Subject',
        // Assuming time/duration/room are stored directly or calculable
        time: lesson.start_time || 'N/A', // Placeholder
        duration: lesson.duration || 'N/A', // Placeholder
        room: lesson.room || 'N/A', // Placeholder
    }));
};

/**
 * Fetch teacher's classes
 */
export async function getTeacherClasses(teacherId: string): Promise<TeacherClass[]> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*, sections(grade, letter)')
      .eq('teacherId', teacherId)
      .eq('status', 'active');

    if (error) throw error;

    const classesWithStudentCount = await Promise.all((data || []).map(async (classItem) => {
      // Get student count for each class
      const { count } = await supabase
        .from('classstudents')
        .select('*', { count: 'exact', head: true })
        .eq('classid', classItem.id)
        .eq('status', 'active');

      // Get average performance for each class
      const { data: performanceData } = await supabase
        .from('student_performance')
        .select('score')
        .eq('class_id', classItem.id);

      let averagePerformance = 0;
      if (performanceData && performanceData.length > 0) {
        const total = performanceData.reduce((sum, item) => sum + item.score, 0);
        averagePerformance = Math.round(total / performanceData.length);
      }

      return {
        id: classItem.id,
        name: classItem.classname,
        grade: classItem.sections?.grade || '',
        section: classItem.sections?.letter || '',
        students: count || 0,
        averagePerformance,
        nextSession: 'TBD' // This would need to be fetched from a schedule table
      };
    }));

    return classesWithStudentCount;
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return [];
  }
}

/**
 * Fetch teacher's assignments
 */
export async function getTeacherAssignments(teacherId: string): Promise<TeacherAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, classes(classname), subjects(name)')
      .eq('teacher_id', teacherId)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return await Promise.all((data || []).map(async (assignment) => {
      // Get submission rate for each assignment
      const { count: totalStudents } = await supabase
        .from('classstudents')
        .select('*', { count: 'exact', head: true })
        .eq('classid', assignment.class_id);

      const { count: submittedCount } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)
        .eq('status', 'submitted');

      // Fix the TypeScript error by ensuring totalStudents is not null
      const totalStudentsCount = totalStudents || 0;
      const submissionRate = totalStudentsCount > 0 
        ? Math.round((submittedCount || 0) / totalStudentsCount * 100) 
        : 0;

      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.due_date,
        class: assignment.classes?.classname || 'Unknown Class',
        subject: assignment.subjects?.name || 'General',
        submissionRate
      };
    }));
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return [];
  }
}

/**
 * Fetch teacher's students
 */
export async function getTeacherStudents(teacherId: string): Promise<TeacherStudent[]> {
  try {
    // First get classes taught by this teacher
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('teacherId', teacherId)
      .eq('status', 'active');

    if (!classes || classes.length === 0) return [];

    const classIds = classes.map(c => c.id);

    // Then get students in those classes
    const { data: classStudents } = await supabase
      .from('classstudents')
      .select('studentid, classid')
      .in('classid', classIds)
      .eq('status', 'active');

    if (!classStudents || classStudents.length === 0) return [];

    const studentIds = [...new Set(classStudents.map(cs => cs.studentid))];

    // Get student details
    const { data: students } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', studentIds);

    if (!students) return [];

    // Get performance and attendance data for each student
    return await Promise.all(students.map(async (student) => {
      // Get performance data
      const { data: performanceData } = await supabase
        .from('student_performance')
        .select('score')
        .eq('student_id', student.id);

      let performance = 0;
      if (performanceData && performanceData.length > 0) {
        const total = performanceData.reduce((sum, item) => sum + item.score, 0);
        performance = Math.round(total / performanceData.length);
      }

      // Get attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id);

      let attendanceRate = 0;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(a => a.status === 'PRESENT').length;
        attendanceRate = Math.round(presentCount / attendanceData.length * 100);
      }

      // Get last activity
      const { data: activityData } = await supabase
        .from('activities')
        .select('created_at')
        .eq('user_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastActivity = activityData && activityData.length > 0 
        ? formatTimeAgo(new Date(activityData[0].created_at))
        : 'Never';

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        grade: calculateGrade(performance),
        performance,
        attendance: attendanceRate,
        lastActivity
      };
    }));
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return [];
  }
}

/**
 * Fetch teacher's dashboard stats
 */
export async function getTeacherStats(teacherId: string): Promise<TeacherStats> {
  try {
    // Get classes count
    const { count: classesCount } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('teacherId', teacherId)
      .eq('status', 'active');

    // Get classes taught by this teacher
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('teacherId', teacherId)
      .eq('status', 'active');

    if (!classes || classes.length === 0) {
      return {
        classes: 0,
        students: 0,
        assignments: 0,
        averageAttendance: '0%'
      };
    }

    const classIds = classes.map(c => c.id);

    // Get students count
    const { count: studentsCount } = await supabase
      .from('classstudents')
      .select('*', { count: 'exact', head: true })
      .in('classid', classIds)
      .eq('status', 'active');

    // Get assignments count
    const { count: assignmentsCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId);

    // Get average attendance
    const { data: attendanceData } = await supabase
      .from('daily_attendance')
      .select('attendance_rate');

    let averageAttendance = 0;
    if (attendanceData && attendanceData.length > 0) {
      const total = attendanceData.reduce((sum, item) => sum + item.attendance_rate, 0);
      averageAttendance = Math.round(total / attendanceData.length);
    }

    return {
      classes: classesCount || 0,
      students: studentsCount || 0,
      assignments: assignmentsCount || 0,
      averageAttendance: `${averageAttendance}%`
    };
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return {
      classes: 0,
      students: 0,
      assignments: 0,
      averageAttendance: '0%'
    };
  }
}

// Helper functions
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(seconds) + ' seconds ago';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

function calculateGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
} 