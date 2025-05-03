import supabase from '../config/supabaseClient';
import { fetchParentChildren } from './timetableService'; // Adjust path if necessary

/**
 * Interface for assignment data
 */
export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  subjectid?: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  grade?: number | null;
  submission_date?: string | null;
  attachments?: AttachmentFile[];
  feedback_provided?: boolean;
  file_url?: string | null;
  classid?: string;
  className?: string;
  studentId?: string;
  studentName?: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  url?: string;
}

/**
 * Get all assignments for a SINGLE student
 * Export this function so student panel can use it
 */
export async function getAssignmentsForSingleStudent(studentId: string): Promise<Assignment[]> {
  try {
    if (!studentId || studentId.trim() === '') return [];

    const { error: tableCheckError } = await supabase
      .from('assignments').select('id').limit(1);
    if (tableCheckError) return [];

    const { data: studentData, error: studentError } = await supabase
      .from('classstudents').select('classid').eq('studentid', studentId);
    if (studentError || !studentData || studentData.length === 0) return [];
    
    const classIds = studentData.map(item => item.classid);
    if (classIds.length === 0) return [];

    const { data, error } = await supabase
      .from('assignments')
      .select('*, class:classid(*)') // Fetching class details
      .in('classid', classIds)
      .order('duedate', { ascending: true });

    if (error || !data) return [];

    return data.map((assignment: any): Assignment => {
      let calculatedStatus = assignment.status || 'pending';
      const dueDate = new Date(assignment.duedate);
      const today = new Date();
      if (dueDate < today && calculatedStatus !== 'completed') calculatedStatus = 'overdue';
      if (getDaysRemaining(assignment.duedate) > 7 && calculatedStatus === 'pending') calculatedStatus = 'upcoming';

      const className = assignment.class?.classname || 'Unknown Class';

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        due_date: assignment.duedate,
        subject: assignment.subject || 'General',
        subjectid: assignment.subjectid,
        status: calculatedStatus,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        grade: assignment.grade,
        submission_date: assignment.submission_date,
        attachments: getAttachmentsFromDescription(assignment.description || ''),
        feedback_provided: assignment.feedback_provided || false,
        file_url: assignment.file_url || null,
        classid: assignment.classid,
        className: className,
        studentId: studentId // Add studentId here
      };
    });
  } catch (error) {
    console.error(`Error fetching assignments for student ${studentId}:`, error);
    return [];
  }
}

/**
 * Get all assignments for ALL children of a parent
 */
export async function fetchParentAssignments(parentId: string): Promise<Assignment[]> {
  if (!parentId) {
    console.error("[fetchParentAssignments] Parent ID is required.");
    return [];
  }

  try {
    // 1. Fetch the parent's children (ID and Name)
    const children = await fetchParentChildren(parentId);
    if (!children || children.length === 0) {
      console.log("[fetchParentAssignments] No children found for parent.");
      return [];
    }
    console.log("[fetchParentAssignments] Found children:", children);

    // 2. Fetch assignments for each child concurrently
    const assignmentPromises = children.map(child => 
      getAssignmentsForSingleStudent(child.id).then(assignments => 
        // Add student name to each assignment fetched for this child
        assignments.map(assignment => ({ ...assignment, studentName: child.name }))
      )
    );
    
    const results = await Promise.all(assignmentPromises);
    console.log("[fetchParentAssignments] Assignments per child:", results);

    // 3. Flatten the array of arrays into a single array
    const allAssignments = results.flat();

    // 4. Optional: Deduplicate assignments if multiple children share classes/assignments
    // (Simple deduplication based on assignment ID)
    const uniqueAssignmentsMap = new Map<string, Assignment>();
    allAssignments.forEach(assignment => {
      if (!uniqueAssignmentsMap.has(assignment.id)) {
        uniqueAssignmentsMap.set(assignment.id, assignment);
      } else {
        // If already present, maybe append child name if needed?
        // For now, just keep the first one encountered.
      }
    });

    const uniqueAssignments = Array.from(uniqueAssignmentsMap.values());
    console.log("[fetchParentAssignments] Unique assignments:", uniqueAssignments);

    // Sort combined list by due date
    uniqueAssignments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    return uniqueAssignments;

  } catch (error) {
    console.error("[fetchParentAssignments] Failed:", error);
    return [];
  }
}

/**
 * Get all courses for filtering
 */
export async function getStudentCourses(studentId: string): Promise<any[]> {
  try {
    // Try to get subjects 
    const { data, error } = await supabase
      .from('subjects')
      .select('id, subjectname')
      .order('subjectname');

    if (error || !data || !data.length) {
      console.error('Error fetching courses:', error);
      return [];
    }

    // Transform the data
    return data.map(course => ({
      id: course.id,
      name: course.subjectname,
      teacher: 'Teacher' // Default teacher name since we can't join to users
    }));
  } catch (error) {
    console.error('Error in getStudentCourses:', error);
    return [];
  }
}

/**
 * Submit an assignment
 */
export async function submitAssignment(assignmentId: string, studentId: string, files: File[]): Promise<boolean> {
  try {
    // First update the assignment status
    const { error: updateError } = await supabase
      .from('assignments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);
    
    if (updateError) {
      console.error('Error updating assignment status:', updateError);
      return false;
    }

    // For each file, upload to storage
    for (const file of files) {
      const fileName = `${studentId}/${assignmentId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, file);
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    return false;
  }
}

// Helper function to get days remaining until due date
export const getDaysRemaining = (dueDateStr: string): number => {
  try {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    
    // If dueDate is invalid, return 0
    if (isNaN(dueDate.getTime())) {
      return 0;
    }
    
    // Set time to 00:00:00 for accurate day calculation
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const differenceMs = dueDate.getTime() - today.getTime();
    const differenceDays = Math.ceil(differenceMs / (1000 * 3600 * 24));
    
    return differenceDays;
  } catch (error) {
    console.error('Error calculating days remaining:', error);
    return 0;
  }
};

// Helper function to extract attachments from description text
// This is a workaround since we don't have a proper attachments table yet
export const getAttachmentsFromDescription = (description: string): AttachmentFile[] => {
  // Look for patterns like [attachment: filename.pdf] in the description
  const regex = /\[attachment:\s*([^\]]+)\]/g;
  const matches = [...description.matchAll(regex)];
  
  if (!matches.length) {
    // If no matches, provide default mock attachment for testing
    if (description.toLowerCase().includes('problem set')) {
      return [{ id: '1', name: 'Problem_Set.pdf', size: '1.2 MB' }];
    }
    if (description.toLowerCase().includes('lab')) {
      return [
        { id: '2', name: 'Lab_Instructions.pdf', size: '2.4 MB' },
        { id: '3', name: 'Data_Collection_Template.xlsx', size: '0.8 MB' }
      ];
    }
    return [];
  }
  
  return matches.map((match, index) => ({
    id: `attachment-${index + 1}`,
    name: match[1].trim(),
    size: '1.0 MB', // Default size
  }));
};

