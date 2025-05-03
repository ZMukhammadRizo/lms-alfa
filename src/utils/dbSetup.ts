import supabase from '../config/supabaseClient';
import { toast } from 'react-toastify';

/**
 * Sets up necessary database tables for grades if they don't exist
 */
export async function setupGradesTables() {
  console.log('🔧 Checking if grades tables need setup...');

  try {
    // First, check if our tables exist
    const { data: scoresData, error: scoresError } = await supabase
      .from('scores')
      .select('id')
      .limit(1);

    // If table doesn't exist, we need to create it
    if (scoresError && scoresError.code === '42P01') {
      console.log('⚠️ Scores table missing - attempting to create it');
      await createScoresTable();
    } else {
      console.log('✅ Scores table already exists');
    }

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('id')
      .limit(1);

    // If table doesn't exist, we need to create it
    if (attendanceError && attendanceError.code === '42P01') {
      console.log('⚠️ Attendance table missing - attempting to create it');
      await createAttendanceTable();
    } else {
      console.log('✅ Attendance table already exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Error setting up database tables:', error);
    toast.error('Database setup failed. Using mock data.');
    return false;
  }
}

/**
 * Creates the scores table
 */
async function createScoresTable() {
  try {
    const { error } = await supabase.rpc('create_scores_table');
    
    if (error) {
      console.error('❌ Error creating scores table:', error);
      return false;
    }
    
    console.log('✅ Scores table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating scores table:', error);
    return false;
  }
}

/**
 * Creates the attendance table
 */
async function createAttendanceTable() {
  try {
    const { error } = await supabase.rpc('create_attendance_table');
    
    if (error) {
      console.error('❌ Error creating attendance table:', error);
      return false;
    }
    
    console.log('✅ Attendance table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating attendance table:', error);
    return false;
  }
} 