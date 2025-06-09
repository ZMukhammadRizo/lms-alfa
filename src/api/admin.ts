/**
 * DEPRECATED: These functions are now replaced by frontend/src/services/dashboardService.ts
 * Please use the functions from dashboardService instead.
 */

import supabase from '../config/supabaseClient';

interface DashboardStats {
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

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  created_at: string;
}

interface PerformanceData {
  subject: string;
  completion: number;
}

interface TopStudent {
  id: string;
  name: string;
  grade: string;
  performance: number;
  subject: string;
}

interface RecentAssessment {
  id: string;
  title: string;
  date: string;
  participation: string;
  avgScore: string;
}

interface AttendanceData {
  day: string;
  attendance: number;
}

// Fetch all dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('Fetching dashboard stats...');

    // Get user count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log('Total users count:', totalUsers);

    // Get student count - use a more reliable method
    const { data: students, error: studentsError, count: countStudents } = await supabase
      .from('users')
      .select('id, status', { count: 'exact' })
      .eq('role', 'Student');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    }

    const totalStudents = students?.length || 0;
    console.log('Student data fetched:', {
      totalStudents,
      countFromAPI: countStudents,
      actualLength: students?.length
    });

    // Count inactive students (if status field exists)
    const inactiveStudents = students?.filter(student => student.status === 'inactive').length || 0;
    console.log('Inactive students:', inactiveStudents);

    // Get teacher count
    const { count: totalTeachers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    console.log('Total teachers:', totalTeachers);

    // Get class count
    const { count: totalClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true });

    // Get active classes (classes with status 'active')
    const { count: activeClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get subject count
    const { count: totalSubjects } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    // Get upcoming events count
    const now = new Date();
    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', now.toISOString());

    // For storage usage, we'd need to query Supabase storage API
    // This is a simplification
    const storageUsed = 68; // Example percentage, could be fetched from actual storage stats

    const stats = {
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents,
      inactiveStudents: inactiveStudents,
      totalTeachers: totalTeachers || 0,
      totalClasses: totalClasses || 0,
      totalSubjects: totalSubjects || 0,
      activeClasses: activeClasses || 0,
      upcomingEvents: upcomingEvents || 0,
      systemHealth: {
        status: 'Healthy',
        uptime: '99.9%',
        storageUsed: storageUsed
      }
    };

    console.log('Dashboard stats collected:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
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
};

// Fetch recent activities
export const getRecentActivities = async (limit = 5): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*, users(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Format the data for display
    return (data || []).map(activity => {
      const user = activity.users;
      return {
        id: activity.id,
        user: `${user.first_name} ${user.last_name}`,
        action: activity.action,
        time: formatTimeAgo(new Date(activity.created_at)),
        created_at: activity.created_at
      };
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    // Return mock data as fallback
    return [
      { id: '1', user: 'John Doe', action: 'created a new class', time: '2 hours ago', created_at: new Date().toISOString() },
      { id: '2', user: 'Jane Smith', action: 'added 5 new students', time: '3 hours ago', created_at: new Date().toISOString() },
      { id: '3', user: 'Robert Johnson', action: 'updated Biology curriculum', time: '5 hours ago', created_at: new Date().toISOString() },
      { id: '4', user: 'Emily Davis', action: 'scheduled a new event', time: '1 day ago', created_at: new Date().toISOString() },
      { id: '5', user: 'Michael Wilson', action: 'created a new assessment', time: '1 day ago', created_at: new Date().toISOString() },
    ];
  }
};

// Fetch subject performance data
export const getPerformanceData = async (): Promise<PerformanceData[]> => {
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
    // Return mock data as fallback
    return [
      { subject: 'Mathematics', completion: 78 },
      { subject: 'Science', completion: 92 },
      { subject: 'Language', completion: 64 },
      { subject: 'History', completion: 85 },
    ];
  }
};

// Fetch top performing students
export const getTopStudents = async (limit = 4): Promise<TopStudent[]> => {
  try {
    const { data, error } = await supabase
      .from('student_performance')
      .select('*, users(first_name, last_name), subjects(name)')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(student => ({
      id: student.id,
      name: `${student.users.first_name} ${student.users.last_name}`,
      grade: calculateGrade(student.score),
      performance: student.score,
      subject: student.subjects.name
    }));
  } catch (error) {
    console.error('Error fetching top students:', error);
    // Return mock data as fallback
    return [
      { id: '1', name: 'Emma Johnson', grade: 'A+', performance: 98, subject: 'Mathematics' },
      { id: '2', name: 'Noah Williams', grade: 'A', performance: 95, subject: 'Science' },
      { id: '3', name: 'Olivia Brown', grade: 'A', performance: 93, subject: 'Literature' },
      { id: '4', name: 'Liam Davis', grade: 'A-', performance: 91, subject: 'History' },
    ];
  }
};

// Fetch recent assessments
export const getRecentAssessments = async (limit = 4): Promise<RecentAssessment[]> => {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(assessment => ({
      id: assessment.id,
      title: assessment.title,
      date: formatDate(assessment.date),
      participation: `${assessment.participation_rate}%`,
      avgScore: `${assessment.average_score}%`
    }));
  } catch (error) {
    console.error('Error fetching recent assessments:', error);
    // Return mock data as fallback
    return [
      { id: '1', title: 'Mid-term Examination', date: '2023-06-15', participation: '95%', avgScore: '76%' },
      { id: '2', title: 'Biology Quiz', date: '2023-06-10', participation: '98%', avgScore: '82%' },
      { id: '3', title: 'Mathematics Test', date: '2023-06-08', participation: '92%', avgScore: '74%' },
      { id: '4', title: 'Literature Essay', date: '2023-06-05', participation: '88%', avgScore: '81%' },
    ];
  }
};

// Fetch attendance data
export const getAttendanceData = async (): Promise<AttendanceData[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_attendance')
      .select('day, attendance_rate')
      .order('day_order', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      day: item.day,
      attendance: item.attendance_rate
    }));
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    // Return mock data as fallback
    return [
      { day: 'Monday', attendance: 94 },
      { day: 'Tuesday', attendance: 92 },
      { day: 'Wednesday', attendance: 88 },
      { day: 'Thursday', attendance: 91 },
      { day: 'Friday', attendance: 85 },
    ];
  }
};

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