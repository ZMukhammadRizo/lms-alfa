import { supabase } from './supabaseClient';
// import { useUserStore } from '../stores/useUserStore'; // Assuming user store provides parent ID
import type { ClassEvent } from '../pages/parent/ParentCalendar'; // Assuming ClassEvent is defined there
import type { TimeSlot } from '../types/Timetable'; // Assuming TimeSlot type is correct for timetable table
// We might not need the Student type if we query users directly
// import type { Student } from '../types/supabase'; 

// Helper to map Supabase TimeSlot (with numbers) to Calendar ClassEvent
const mapTimeSlotToClassEvent = (slot: Partial<TimeSlot> & {id: string}, className: string | null): ClassEvent | null => {
  // Check for essential numeric/string fields that are expected
  if (slot.id === null || slot.id === undefined || 
      slot.startTime === null || slot.startTime === undefined || 
      slot.endTime === null || slot.endTime === undefined || 
      slot.day === null || slot.day === undefined) {
      console.warn('[mapTimeSlotToClassEvent] Skipping timetable slot due to missing essential data (id, startTime, endTime, or day): ', slot);
      return null; 
  }
  
  // Use start/end times directly as they are numbers
  const startTime = slot.startTime;
  const endTime = slot.endTime;
  // Assume slot.day is already the correct 0-6 index (e.g., 0=Mon or 0=Sun? Check data/adjust if needed)
  // If Supabase returns 1-7 or 0-6 where 0=Sunday, adjust here.
  // Example adjustment if DB uses 1=Monday...7=Sunday:
  // const dayIndex = (slot.day >= 1 && slot.day <= 7) ? slot.day - 1 : 0;
  // Example if DB uses 0=Sunday...6=Saturday:
  // const dayIndex = slot.day === 0 ? 6 : slot.day - 1;
  // Assuming DB uses 0=Monday...6=Sunday based on previous logic needed:
   const dayIndex = (slot.day >= 0 && slot.day <= 6) ? slot.day : 0; // Use directly if 0-6 Mon-Sun

  // Provide defaults for potentially missing optional fields, using correct names from log
  const eventTitle = slot.title || className || 'Scheduled Class';
  const courseName = className || 'Unknown Course'; // Use joined classname primarily
  const teacherName = slot.teacher || 'N/A'; // Ensure 'teacher' field exists or use teacherId lookup
  const roomLocation = slot.location || 'N/A'; // Use 'location' from logged data
  const eventColor = slot.color || '#4F46E5'; // Default color

  return {
    id: slot.id, 
    title: eventTitle,
    course: courseName,
    startTime: startTime,
    endTime: endTime,
    day: dayIndex, // The calculated 0-6 index
    teacher: teacherName,
    location: roomLocation,
    color: eventColor,
    classId: slot.classId, // Add classId to the returned event
    childName: undefined 
  };
};

// Fetches children (users with role 'student' linked to parent)
export const fetchParentChildren = async (parentId: string): Promise<{ id: string; name: string }[]> => {
   if (!parentId) {
    console.error("[fetchParentChildren] Parent ID is required.");
    return [];
  }
  
  try {
     console.log("[fetchParentChildren] Fetching children (users) for parent ID:", parentId);
     const { data: childrenUsers, error: childrenError } = await supabase
      .from('users') 
      .select('id, firstName, lastName') 
      .eq('parent_id', parentId) 
      // .eq('role', 'student') // Optional role filter

    if (childrenError) {
      console.error('[fetchParentChildren] Error fetching children users:', childrenError);
      throw childrenError;
    }

    if (!childrenUsers) {
        console.log('[fetchParentChildren] No children users found.');
        return [];
    }
    
    return childrenUsers.map(u => ({
        id: u.id, 
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown Child'
    }));

  } catch(error) {
      console.error('[fetchParentChildren] Failed:', error);
      return [];
  }
}

// Fetches timetable based on the CLASSES the children are enrolled in
export const fetchParentTimetable = async (parentId: string): Promise<ClassEvent[]> => {
  if (!parentId) {
    console.error("[fetchParentTimetable] Parent ID is required.");
    return [];
  }

  try {
    // 1. Fetch the parent's children's USER IDs
    const childrenDetails = await fetchParentChildren(parentId);
    if (!childrenDetails || childrenDetails.length === 0) {
      console.log('[fetchParentTimetable] No children found for this parent.');
      return [];
    }
    const childrenUserIds = childrenDetails.map(child => child.id);
    console.log('[fetchParentTimetable] Found children user IDs:', childrenUserIds);

    // 2. Fetch the CLASS IDs these children are enrolled in
    // ASSUMPTION: 'classstudents' table links users (studentid) to classes (classid)
    const { data: enrollments, error: enrollError } = await supabase
      .from('classstudents')
      .select('classid') // Select the class ID
      .in('studentid', childrenUserIds); // Filter by the children's user IDs

    if (enrollError) {
      console.error('[fetchParentTimetable] Error fetching class enrollments:', enrollError);
      throw enrollError;
    }

    if (!enrollments || enrollments.length === 0) {
        console.log('[fetchParentTimetable] Children not enrolled in any classes.');
        return [];
    }

    // Get unique class IDs
    const classIds = [...new Set(enrollments.map(e => e.classid))];
    console.log('[fetchParentTimetable] Found class IDs for children:', classIds);

    if (classIds.length === 0) {
        return [];
    }

    // 3. Fetch timetable slots for these CLASS IDs
    const { data: timetableSlots, error: timetableError } = await supabase
      .from('timetable') 
      // Remove the inline comment from the select string
      .select(`
        id, 
        start_time, 
        end_time, 
        day, 
        location, 
        color, 
        title, 
        teacherId, 
        classId, 
        classes ( classname ) 
      `)
      .in('classId', classIds);

    if (timetableError) {
      console.error('[fetchParentTimetable] Error fetching timetable slots:', timetableError);
      throw timetableError;
    }
    
    if (!timetableSlots) {
      console.log('[fetchParentTimetable] No timetable slots found for these classes.');
      return [];
    }
    console.log('[fetchParentTimetable] Raw timetable slots:', timetableSlots);

    // 4. Map the timetable slots, filtering out nulls from invalid entries
    const events: ClassEvent[] = timetableSlots
      .map((slot) => {
          // Map raw db names to expected TimeSlot names for the mapper
          const mappedSlot: Partial<TimeSlot> & {id: string} = {
            id: slot.id, 
            startTime: slot.start_time,
            endTime: slot.end_time,
            day: slot.day,
            location: slot.location,
            color: slot.color,
            title: slot.title,
            teacherId: slot.teacherId,
            classId: slot.classId,
            classes: slot.classes, // Pass the joined object
            // Map other fields if needed by mapTimeSlotToClassEvent
          };
          const className = slot.classes?.classname; 
          return mapTimeSlotToClassEvent(mappedSlot, className); 
      })
      .filter((event): event is ClassEvent => event !== null); // Filter out null results

    console.log('[fetchParentTimetable] Mapped events:', events);
    return events;

  } catch (error) {
    console.error('[fetchParentTimetable] Failed:', error);
    return []; 
  }
}; 

// Fetches a map of childId -> [classId] for enrollments
export const fetchChildrenEnrollments = async (parentId: string): Promise<Map<string, string[]>> => {
  const enrollmentMap = new Map<string, string[]>();
  if (!parentId) {
    console.error("[fetchChildrenEnrollments] Parent ID required.");
    return enrollmentMap;
  }

  try {
    // 1. Get children user IDs
    const children = await fetchParentChildren(parentId);
    if (!children || children.length === 0) return enrollmentMap;
    const childrenUserIds = children.map(c => c.id);

    // 2. Fetch enrollments from classstudents
    const { data: enrollments, error } = await supabase
      .from('classstudents')
      .select('studentid, classid')
      .in('studentid', childrenUserIds);

    if (error) {
      console.error("[fetchChildrenEnrollments] Error fetching enrollments:", error);
      throw error;
    }

    if (!enrollments) return enrollmentMap;

    // 3. Build the map
    for (const enrollment of enrollments) {
      const studentId = enrollment.studentid;
      const classId = enrollment.classid;
      if (!enrollmentMap.has(studentId)) {
        enrollmentMap.set(studentId, []);
      }
      enrollmentMap.get(studentId)?.push(classId);
    }

    console.log("[fetchChildrenEnrollments] Enrollment map:", enrollmentMap);
    return enrollmentMap;

  } catch (error) {
    console.error("[fetchChildrenEnrollments] Failed:", error);
    return enrollmentMap; // Return empty map on error
  }
}; 