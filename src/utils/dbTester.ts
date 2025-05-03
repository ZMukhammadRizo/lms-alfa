import supabase from '../config/supabaseClient';

/**
 * Utility to test database setup for the Grades feature
 */
export async function testGradesDBSetup(userId: string): Promise<{
  success: boolean;
  tables: Record<string, boolean>;
  userData: any;
  message: string;
}> {
  const tables = {
    classes: false,
    subjects: false,
    teachers: false,
    classstudents: false,
    classsubjects: false,
    quarters: false,
    scores: false,
    attendance: false
  };
  
  const result = {
    success: false,
    tables,
    userData: null,
    message: ''
  };

  try {
    // Verify each table exists by trying to fetch a single row
    for (const table of Object.keys(tables)) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      tables[table] = !error && data !== null;
    }
    
    // Check if user is assigned to any class
    const { data: userClasses, error: userClassesError } = await supabase
      .from('classstudents')
      .select('classid')
      .eq('studentid', userId);
    
    if (userClassesError || !userClasses || userClasses.length === 0) {
      result.message = 'User is not assigned to any class.';
      return result;
    }
    
    // Get class details
    const classIds = userClasses.map(c => c.classid);
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .in('id', classIds);
    
    if (classError || !classData || classData.length === 0) {
      result.message = 'Could not find class details.';
      return result;
    }
    
    // Get subjects assigned to classes
    const { data: classSubjectsData, error: classSubjectsError } = await supabase
      .from('classsubjects')
      .select('id, classid, subjectid, teacherid')
      .in('classid', classIds);
    
    if (classSubjectsError || !classSubjectsData || classSubjectsData.length === 0) {
      result.message = 'No subjects found for classes.';
      return result;
    }
    
    // Get subject details
    const subjectIds = classSubjectsData.map(cs => cs.subjectid);
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, subjectname')
      .in('id', subjectIds);
      
    if (subjectsError || !subjectsData || subjectsData.length === 0) {
      result.message = 'Error fetching subject details.';
      return result;
    }
    
    // Get teacher details
    const teacherIds = classSubjectsData.map(cs => cs.teacherid).filter(Boolean);
    let teachersData = [];
    if (teacherIds.length > 0) {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .in('id', teacherIds);
      
      if (!error && data) {
        teachersData = data;
      }
    }
    
    // Combine the data
    const combinedSubjects = classSubjectsData.map(classSubject => {
      const subject = subjectsData.find(s => s.id === classSubject.subjectid);
      const teacher = teachersData.find(t => t.id === classSubject.teacherid);
      
      if (!subject) return null;
      
      return {
        id: classSubject.id,
        subject: subject,
        teacher: teacher || null,
        classId: classSubject.classid
      };
    }).filter(Boolean);

    // Return user data with all the relevant information
    result.userData = {
      classes: classData,
      subjects: combinedSubjects
    };
    
    result.success = true;
    result.message = 'Database setup verified successfully.';
    return result;
  } catch (error) {
    console.error('Error testing database setup:', error);
    result.message = `Error: ${error.message || 'Unknown error'}`;
    return result;
  }
} 