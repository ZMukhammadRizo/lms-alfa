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
  console.log(`[Service Debug] Fetching schedule for teacher: ${teacherId}`);
  try {
    const today = new Date();
    const requestedDay = today.getDay();

    const { data: teacherClasses, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .eq('teacherid', teacherId);
    
    if (classesError) throw classesError;
    
    if (!teacherClasses || teacherClasses.length === 0) {
      console.log('[Service Debug] Teacher has no assigned classes.');
      return [];
    }
    
    const classIds = teacherClasses.map(c => c.id);
    console.log(`[Service Debug] Fetching timetable for class IDs: ${classIds.join(', ')}`);

    // Modified query to fetch related names more directly
    const { data: schedule, error: scheduleError } = await supabase
      .from('timetable')
      .select(`
        id,
        classId,
        start_time,
        end_time,
        day,
        location,
        subjectId,
        subject_name:subjects ( subjectname ), 
        class_name:classes ( classname )
      `)
      .in('classId', classIds);
    
    if (scheduleError) {
      console.error('[Service Debug] Schedule fetch error:', scheduleError);
      throw scheduleError;
    }
    
    if (!schedule || schedule.length === 0) {
      console.log('[Service Debug] No schedule found in DB for this teacher classes');
      return [];
    }
    
    console.log('[Service Debug] Raw schedule data from DB:', schedule);

    // --- Deduplication Step --- 
    const uniqueScheduleMap = new Map<string, any>();
    schedule.forEach(item => {
      if (!uniqueScheduleMap.has(item.id)) { // Use timetable entry ID for uniqueness
        uniqueScheduleMap.set(item.id, item);
      }
    });
    const uniqueSchedule = Array.from(uniqueScheduleMap.values());
    console.log(`[Service Debug] Schedule data after deduplication (removed ${schedule.length - uniqueSchedule.length} duplicates):`, uniqueSchedule);
    // --- End Deduplication --- 

    // Define expected shape (adjust based on new query structure)
    type ScheduleQueryResult = {
        id: string;
        classId: string;
        start_time: string | number | null;
        end_time: string | number | null;
        location: string | null;
        subjectId: string;
        day: string | number | null;
        // These might now be objects, not arrays, if the relationship is one-to-one
        subject_name: { subjectname: string | null } | null; 
        class_name: { classname: string | null } | null;
    };

    const typedScheduleData: ScheduleQueryResult[] = uniqueSchedule; // Use unique data
    
    let todayNumberAdjusted = requestedDay - 1;
    if (todayNumberAdjusted === -1) {
      todayNumberAdjusted = 6;
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    console.log(`[Service Debug] Filtering for adjusted day number: ${todayNumberAdjusted} (Original JS day: ${requestedDay})`); 
    
    // Filter entries for today using the adjusted day number primarily
    // Reverted filter logic to original state without internal logs
    const todayEntries = typedScheduleData.filter(entry => {
      const entryDay = entry.day;
      if (entryDay === null || entryDay === undefined) return false;
      
      const entryDayStr = String(entryDay).toLowerCase();
      let entryDayNum = parseInt(entryDayStr);

      if (isNaN(entryDayNum)) {
          const nameIndex = dayNames.indexOf(entryDayStr);
          if (nameIndex !== -1) {
              entryDayNum = nameIndex - 1;
              if (entryDayNum === -1) entryDayNum = 6;
          } else {
              return false; 
          }
      } else {
          entryDayNum = entryDayNum % 7; 
      }
      const match = entryDayNum === todayNumberAdjusted;
      return match;
    });
    
    console.log(`[Service Debug] Found ${todayEntries.length} entries after filtering for today:`, todayEntries);

    todayEntries.sort((a: ScheduleQueryResult, b: ScheduleQueryResult) => {
        const timeA = String(a.start_time || '99:99'); 
        const timeB = String(b.start_time || '99:99'); 
        return timeA.localeCompare(timeB);      
    });

    // Updated mapping logic to use new query structure
    const formattedSchedule = todayEntries.map((item: ScheduleQueryResult): UpcomingClass => {
      const formattedStartTime = formatTime(item.start_time);
      const formattedEndTime = formatTime(item.end_time);
      const timeString = `${formattedStartTime} - ${formattedEndTime}`;

      // Extract names using the new structure, check for nulls
      const subjectName = item.subject_name?.subjectname || 'No Subject';
      const className = item.class_name?.classname || 'No Class';

      return {
        id: item.id,
        subject: subjectName,
        className: className,
        time: timeString, 
        duration: '', 
        room: item.location || 'N/A'
      };
    });

    console.log('[Service Debug] Final formatted schedule returned:', formattedSchedule); 
    return formattedSchedule;
  } catch (error) {
    console.error('[Service Debug] Error in fetchTodaySchedule catch block:', error); 
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
const formatTime = (timeInput: string | number | null): string => {
  if (timeInput === null || timeInput === undefined) return 'N/A';

  try {
    let hours: number;
    let minutes: number = 0; // Default minutes to 0

    if (typeof timeInput === 'number') {
      // If input is a number, assume it's the hour
      hours = timeInput;
    } else if (typeof timeInput === 'string') {
      // If input is a string, try to parse it
      const parts = timeInput.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      } else {
        // Try parsing as just an hour number if split fails
        hours = parseInt(timeInput, 10);
      }
      // If parsing results in NaN, throw error
      if (isNaN(hours) || isNaN(minutes)) {
         throw new Error("Invalid time string format");
      }
    } else {
       throw new Error("Unsupported time input type");
    }
    
    // Ensure hours and minutes are valid numbers after parsing
    if (isNaN(hours) || isNaN(minutes)) {
         throw new Error("Parsed time values are not valid numbers");
    }

    // Format the time using Date object
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); // Using numeric hour for cleaner output e.g., 9:00 AM

  } catch (e) {
    console.error("Error formatting time:", timeInput, e);
    return String(timeInput); // Return original value stringified on error
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