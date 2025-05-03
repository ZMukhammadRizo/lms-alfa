import supabase from '../config/supabaseClient';

export interface TeacherDashboardStats {
  coursesCount: number;
  studentsCount: number;
  assignmentsCount: number;
  messagesCount: number;
}

export interface UpcomingClass {
  id: string;
  subject: string;
  className: string;
  time: string;
  duration: string;
  room: string;
}

export interface PendingAssignment {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  submissions: string;
}

/**
 * Fetch dashboard statistics for teacher
 */
export const fetchDashboardStats = async (teacherId: string): Promise<TeacherDashboardStats> => {
  console.log(`Fetching dashboard stats for teacher: ${teacherId}`);
  let actualCoursesCount = 0, studentCount = 0, assignmentsCount = 0, messagesCount = 0;
  let classIds: string[] = [];
  let subjectIds: string[] = [];

  try {
    console.log('1. Fetching teacher classes...');
    let teacherClasses: { id: string }[] | null = null;
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id')
        .eq('teacherid', teacherId);
      if (error) throw error;
      teacherClasses = data;
      console.log('  -> Teacher classes fetched:', teacherClasses);
    } catch (classesError) {
      console.error('ERROR fetching teacher classes:', classesError);
      throw classesError; // Re-throw to handle in outer catch
    }
    
    if (teacherClasses && teacherClasses.length > 0) {
      classIds = teacherClasses.map(c => c.id);
      console.log(`2. Fetching subjects for ${classIds.length} classes...`, classIds);
      try {
        const { data: classSubjects, error: subjectsError } = await supabase
          .from('classsubjects')
          .select('subjectid')
          .in('classid', classIds);
        
        if (subjectsError) throw subjectsError;
        
        if (classSubjects) {
          subjectIds = [...new Set(classSubjects.map(cs => cs.subjectid))]; // Ensure unique subject IDs
          console.log(`  -> Subjects fetched: ${subjectIds.length} unique subjects`, subjectIds);
        } else {
          console.log('  -> No subjects found for these classes.');
        }
      } catch (subjectsError) {
         console.error('ERROR fetching class subjects:', subjectsError);
         // Don't throw here, allow other stats to load
      }
    }
    
    if (classIds.length > 0) {
        console.log(`3. Fetching unique students for ${classIds.length} classes...`);
        try {
          const { data: uniqueStudents, error: studentCountError } = await supabase
            .from('classstudents')
            .select('studentid') // Only fetch studentid
            .in('classid', classIds);
          
          if (studentCountError) throw studentCountError;
          
          if (uniqueStudents) {
            const uniqueStudentIds = new Set(uniqueStudents.map(s => s.studentid));
            studentCount = uniqueStudentIds.size;
            console.log(`  -> Student count: ${studentCount}`);
          } else {
            console.log('  -> No students found in classstudents.');
          }
        } catch (studentError) {
            console.error('ERROR fetching students:', studentError);
            // Don't throw
        }
    }
    
    // Fetch assignments count based on the teacher's CLASSES
    if (classIds.length > 0) {
      console.log(`4. Fetching assignment count for ${classIds.length} classes...`, classIds);
      try {
         const { count, error: assignmentsError } = await supabase
           .from('assignments')
           .select('*', { count: 'exact', head: true })
           .in('classid', classIds); // Filter by classid
        
         if (assignmentsError) throw assignmentsError; // Throw inside try
        
         assignmentsCount = count || 0;
         console.log(`  -> Assignments count: ${assignmentsCount}`);
       } catch (error) {
         console.error('ERROR fetching assignments count:', error);
         // Don't throw here, allow other stats to potentially load
       }
    }
    
    // Fetch unread messages count
    console.log(`5. Fetching unread messages count for teacher ${teacherId}...`);
    try {
      const { count: messagesCountData, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', teacherId)
        .eq('is_read', false);
        
      if (messagesError) throw messagesError;
      messagesCount = messagesCountData || 0;
      console.log(`  -> Messages count: ${messagesCount}`);
    } catch (msgError) {
      console.error('ERROR fetching messages count:', msgError);
      // Don't throw
    }
      
    // Count courses by counting unique class-subject combinations taught by this teacher
    console.log(`6. Calculating courses count for ${classIds.length} classes...`);
    try {
       if (teacherClasses && teacherClasses.length > 0) {
           const classIds = teacherClasses.map(c => c.id);
           const { count: coursesCount, error: coursesCountError } = await supabase
               .from('classsubjects')
               .select('*', { count: 'exact', head: true })
               .in('classid', classIds);
               
           if (coursesCountError) {
               throw coursesCountError;
           }
           
           actualCoursesCount = coursesCount || 0;
           console.log(`  -> Courses count: ${actualCoursesCount}`);
       }
    } catch (fallbackErr) {
         console.error("Error during course count:", fallbackErr);
         actualCoursesCount = subjectIds.length > 0 ? subjectIds.length : 0; // Fallback
    }

    console.log('Dashboard stats fetch complete:', { actualCoursesCount, studentCount, assignmentsCount, messagesCount });
    return {
      coursesCount: actualCoursesCount,
      studentsCount: studentCount || 0,
      assignmentsCount: assignmentsCount,
      messagesCount: messagesCount || 0
    };
  } catch (error) {
    console.error('FATAL Error fetching dashboard stats:', error);
    // Return zero counts on fatal error
    return { coursesCount: 0, studentsCount: 0, assignmentsCount: 0, messagesCount: 0 };
  }
};

/**
 * Fetch today's schedule for teacher
 */
export const fetchTodaySchedule = async (teacherId: string): Promise<UpcomingClass[]> => {
  console.log(`Fetching schedule for teacher: ${teacherId}`);
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const requestedDay = today.getDay(); // Default to today's day of week
    
    // Get classes taught by this teacher
    const { data: teacherClasses, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('teacherid', teacherId);
    
    if (classesError) throw classesError;
    
    if (!teacherClasses || teacherClasses.length === 0) {
      return [];
    }
    
    const classIds = teacherClasses.map(c => c.id);
    
    // Try to find schedule entries for today
    // Based on database structure, either check a dedicated schedule table
    const { data: schedule, error: scheduleError } = await supabase
      .from('timetable') // Or 'lessons' based on your DB structure
      .select(`
        id,
        classId,
        start_time,
        end_time,
        day,
        location,
        subjectId,
        classes:classId (
          id, 
          classname
        ),
        subjects:subjectId (
          id,
          subjectname
        )
      `)
      .in('classId', classIds)
      // Get all schedule entries for this teacher's classes and filter by day in the client
      // This is more reliable than trying to guess the exact day format
      ;
    
    if (scheduleError) {
      console.error('Schedule fetch error:', scheduleError);
      throw scheduleError;
    }
    
    if (!schedule || schedule.length === 0) {
      console.log('No schedule found for today');
      return [];
    }
    
    console.log('Raw schedule data:', schedule);
    
    // Define expected shape of schedule data
    type ScheduleQueryResult = {
        id: string;
        classId: string;
        start_time: string | null;
        end_time: string | null;
        location: string | null;
        subjectId: string;
        day: string | number | null;
        // These are arrays in the Supabase response due to the join
        classes: { id: string; classname: string | null }[];
        subjects: { id: string; subjectname: string | null }[];
    };

    const typedScheduleData: ScheduleQueryResult[] = schedule || [];
    
    // Get today's day name and potential day formats
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayNumber = requestedDay; // 0-6
    const todayName = dayNames[todayNumber];
    const todayShortName = dayShort[todayNumber];
    
    console.log(`Filtering for day: ${todayNumber}, ${todayName}, ${todayShortName}`);
    
    // Filter entries for today using various possible day formats
    const todayEntries = typedScheduleData.filter(entry => {
      const entryDay = entry.day;
      if (entryDay === null) return false;
      
      // Convert to string to handle all formats
      const dayStr = String(entryDay).toLowerCase();
      
      return (
        dayStr === String(todayNumber) ||
        dayStr === todayName ||
        dayStr === todayShortName ||
        dayStr.includes(todayShortName) || // Handle cases like "mon-1" or "mon_1"
        dayStr.includes(todayName) || // Handle longer formats
        (todayNumber === 0 && dayStr === '7') // Some systems use 1-7 with Sunday as 7
      );
    });
    
    console.log(`Found ${todayEntries.length} entries for today:`, todayEntries);

    // Sort client-side with explicit types
    todayEntries.sort((a: ScheduleQueryResult, b: ScheduleQueryResult) => {
        const timeA = a.start_time || '99:99';
        const timeB = b.start_time || '99:99';
        return timeA.localeCompare(timeB);
    });

    // Format data with explicit types
    const formattedSchedule = todayEntries.map((item: ScheduleQueryResult): UpcomingClass => ({
      id: item.id,
      subject: item.subjects[0]?.subjectname || 'No Subject',
      className: item.classes[0]?.classname || 'No Class',
      time: formatTime(item.start_time),
      duration: calculateDuration(item.start_time, item.end_time),
      room: item.location || 'N/A'
    }));

    // Log the final formatted schedule
    console.log('Formatted schedule:', formattedSchedule);
    return formattedSchedule;
  } catch (error) {
    console.error('Error fetching today schedule:', error);
    return [];
  }
};

/**
 * Fetch pending assignments for teacher
 */
export const fetchPendingAssignments = async (teacherId: string): Promise<PendingAssignment[]> => {
  console.log(`Fetching pending assignments for teacher: ${teacherId}`);
  try {
    // Get classes taught by this teacher
    const { data: teacherClasses, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('teacherid', teacherId);
    
    if (classesError) throw classesError;
    
    if (!teacherClasses || teacherClasses.length === 0) {
      return [];
    }
    
    const classIds = teacherClasses.map(c => c.id);
    
    let subjectIds: string[] = [];
    // Get subjects for these classes
    if (classIds.length > 0) {
      const { data: classSubjects, error: subjectsError } = await supabase
        .from('classsubjects')
        .select('subjectid')
        .in('classid', classIds);
      
      if (subjectsError) throw subjectsError;
      
      if (classSubjects && classSubjects.length > 0) {
        subjectIds = classSubjects.map(cs => cs.subjectid);
      }
    }
    
    // Get pending assignments for these classes or subjects
    // Try both approaches to accommodate different DB structures
    const now = new Date();
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        duedate,
        classid,
        classes:classid (
          classname
        )
      `)
      .in('classid', classIds)
      .gte('duedate', now.toISOString())
      .order('duedate', { ascending: true });
      
    if (assignmentsError) throw assignmentsError;
    
    if (!assignments || assignments.length === 0) {
      return [];
    }
    
    // Define expected shape for assignment data
    type AssignmentQueryResult = {
      id: string;
      title: string | null;
      duedate: string | null;
      classid: string;
      classes: { classname: string | null }[];
    };

    const typedAssignments: AssignmentQueryResult[] = assignments || [];

    // Map with explicit types
    const assignmentsWithCounts = await Promise.all(
        typedAssignments.map(async (assignment: AssignmentQueryResult): Promise<PendingAssignment> => {
            console.log('Processing assignment:', assignment);
            let submissionCount = 0;
            let totalStudents = 0;

            try {
              // Get student count for this class
              console.log(` -> Fetching student count for class: ${assignment.classid}`);
              const { data: classStudents, error: studentsError } = await supabase
                .from('classstudents')
                .select('studentid', { count: 'exact' })
                .eq('classid', assignment.classid);
              
              if (!studentsError && classStudents) {
                totalStudents = classStudents.length;
              } else if (studentsError) {
                console.error(` -> Error fetching student count for class ${assignment.classid}:`, studentsError);
              }
              console.log(` -> Total students for class ${assignment.classid}: ${totalStudents}`);
              
              // Get submission count
              console.log(` -> Fetching submission count for assignment: ${assignment.id}`);
              const { count, error: submissionsError } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('assignmentid', assignment.id);
              
              if (!submissionsError) {
                submissionCount = count || 0;
              } else {
                console.error(` -> Error fetching submission count for assignment ${assignment.id}:`, submissionsError);
              }
              console.log(` -> Submission count for assignment ${assignment.id}: ${submissionCount}`);
            } catch (countError) {
              console.error('Error getting counts:', countError);
            }

            // Log the joined classes data
            console.log(` -> Joined classes data for assignment ${assignment.id}:`, assignment.classes);

            return {
                id: assignment.id,
                title: assignment.title || 'Untitled Assignment',
                className: assignment.classes[0]?.classname || 'Unknown Class',
                dueDate: formatDueDate(assignment.duedate),
                submissions: `${submissionCount}/${totalStudents}`
            };
        })
    );

    console.log('Final pending assignments with counts:', assignmentsWithCounts);
    return assignmentsWithCounts;
  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    return [];
  }
};

// Helper Functions
const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return 'N/A';
  try {
    // Best guess: timeStr is 'HH:MM:SS' or 'HH:MM'
    const parts = timeStr.split(':');
    if (parts.length < 2) throw new Error("Invalid time format");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) throw new Error("Invalid time format");

    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error("Error formatting time:", timeStr, e);
    return timeStr; // Return original string on error
  }
};

const calculateDuration = (startTime: string | null, endTime: string | null): string => {
  if (!startTime || !endTime) return '-';
  try {
    // Use today's date just to parse the time part
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diff = end.getTime() - start.getTime();

    // Check for invalid dates or negative duration
    if (isNaN(diff) || diff < 0) {
        console.warn("Invalid start/end time for duration calc:", startTime, endTime);
        return '-';
    }
    const minutes = Math.floor(diff / 60000);

    if (minutes === 0) return '-'; // Show dash for zero duration
    if (minutes < 60) {
      return `${minutes} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} mins` : `${hours} hr`;
    }
  } catch (e) {
     console.error("Error calculating duration:", startTime, endTime, e);
    return '-'; // Return dash on error
  }
};

const formatDueDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';
  try {
    const dueDate = new Date(dateStr);
     if (isNaN(dueDate.getTime())) return dateStr; // Invalid date string

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDay = new Date(dueDate);
    dueDay.setHours(0,0,0,0); // Normalize due date to start of day

    if (dueDay.getTime() === today.getTime()) {
      return 'Today';
    }
    if (dueDay.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    // Calculate difference in days from start of today
    const diffTime = dueDay.getTime() - today.getTime(); // Compare normalized dates
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && diffDays < 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < 0) {
        return `Overdue`; // Simplified overdue message
    } else {
      // For dates today (but not start of day), or >= 7 days away
      return dueDate.toLocaleDateString([], {month: 'short', day: 'numeric'});
    }
  } catch (e) {
     console.error("Error formatting due date:", dateStr, e);
    return dateStr; // Return original on error
  }
};

/**
 * Helper function to get the schedule for a specific day
 * This could be used if you want to add a day selector in the UI
 */
export const fetchScheduleForDay = async (teacherId: string, dayOfWeek: number): Promise<UpcomingClass[]> => {
  // Create a date object for the specified day
  const targetDate = new Date();
  const currentDay = targetDate.getDay();
  const daysToAdd = (dayOfWeek - currentDay + 7) % 7; // Calculate days to add to get to the requested day
  
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  
  console.log(`Fetching schedule for day ${dayOfWeek} (${targetDate.toLocaleDateString()})`);
  
  // Reuse the same function but override the day
  try {
    // Similar implementation as fetchTodaySchedule but with dayOfWeek instead of today
    // For now, we'll just call the existing function
    // In a future enhancement, this could be refactored to be more flexible
    return await fetchTodaySchedule(teacherId);
  } catch (error) {
    console.error(`Error fetching schedule for day ${dayOfWeek}:`, error);
    return [];
  }
}; 