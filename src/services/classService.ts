import { supabase } from './supabaseClient';
import { Class, NewClass } from '../types/Class';

interface ClassFilterOptions {
  level?: string;
  category?: string;
  teacherId?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export class ClassService {
  /**
   * Fetches all classes with optional filtering, sorting, and pagination
   */
  static async getClasses(options: ClassFilterOptions = {}): Promise<Class[]> {
    let query = supabase.from('classes').select('*');

    // Apply filters if provided
    if (options.level) {
      query = query.eq('level_id', options.level);
    }
    if (options.category) {
      query = query.eq('category_id', options.category);
    }
    if (options.teacherId) {
      query = query.eq('teacherId', options.teacherId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply sorting if provided
    if (options.sortBy) {
      query = query.order(options.sortBy, { 
        ascending: options.sortDirection === 'asc' 
      });
    }

    // Apply pagination if provided
    if (options.page !== undefined && options.pageSize) {
      const start = options.page * options.pageSize;
      const end = start + options.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Fetches a class by ID
   */
  static async getClassById(id: string): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Fetches a class with detailed information including subjects and lessons
   */
  static async getClassWithDetails(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id, classname, description, level_id, category_id, teacherId, student_count, status, created_at, updated_at,
        classsubjects(
          subjects(
            id, subjectname,
            lessons(id, lessonname, videourl, duration)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Creates a new class
   */
  static async createClass(newClass: NewClass): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .insert(newClass)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Updates an existing class
   */
  static async updateClass(id: string, updates: Partial<Class>): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Deletes a class
   */
  static async deleteClass(id: string): Promise<{ success: boolean }> {
    const { data, error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /**
   * Enrolls a student in a class
   */
  static async enrollStudent(classId: string, studentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('classstudents')
      .insert({
        classid: classId,
        studentid: studentId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Gets all students enrolled in a class
   */
  static async getStudentsInClass(classId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('classstudents')
      .select('studentid, users(id, firstName, lastName)')
      .eq('classid', classId);

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Subscribes to real-time updates for a class
   * Returns a subscription that should be removed when no longer needed
   */
  static subscribeToClassUpdates(classId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`class-${classId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classes',
        filter: `id=eq.${classId}`
      }, callback)
      .subscribe();
  }

  /**
   * Subscribes to student enrollment changes for a class
   * Returns a subscription that should be removed when no longer needed
   */
  static subscribeToEnrollmentUpdates(classId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`enrollment-${classId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classstudents',
        filter: `classid=eq.${classId}`
      }, callback)
      .subscribe();
  }

  /**
   * Remove a subscription when no longer needed
   */
  static removeSubscription(subscription: any) {
    supabase.removeChannel(subscription);
  }
} 