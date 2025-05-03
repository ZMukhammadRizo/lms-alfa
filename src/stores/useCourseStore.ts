import create from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, courses as mockCourses } from '../data/coursesData';

// Function to simulate API calls with delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock function to create a course
export const mockCreateCourse = async (course: Omit<Course, 'id'>): Promise<Course> => {
  await delay(800);
  const newCourse: Course = {
    ...course,
    id: Math.random().toString(36).substr(2, 9),
    materials: course.materials || [],
    lessons: course.lessons || []
  };
  return newCourse;
};

// Mock function to fetch courses from API
export const mockFetchCourses = async (): Promise<Course[]> => {
  await delay(1000);
  return [...mockCourses];
};

// Mock function to delete a course
export const mockDeleteCourse = async (id: string): Promise<void> => {
  await delay(500);
  // In a real application, this would call an API endpoint
};

// Store state interface
interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: () => Promise<void>;
  createCourse: (course: Omit<Course, 'id'>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  getCourseById: (id: string) => Course | undefined;
  updateCourse: (id: string, courseData: Partial<Course>) => Promise<Course>;
  
  // Realtime functionality
  subscribeToCoursesUpdates: () => void;
  unsubscribeFromCoursesUpdates: () => void;
}

// Create the store with persistence
const useCourseStore = create<CourseState>(
  persist(
    (set, get) => ({
      courses: [],
      isLoading: false,
      error: null,

      // Fetch courses from API
      fetchCourses: async () => {
        set({ isLoading: true, error: null });
        try {
          const courses = await mockFetchCourses();
          set({ courses, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch courses', 
            isLoading: false 
          });
        }
      },

      // Create a new course
      createCourse: async (courseData) => {
        set({ isLoading: true, error: null });
        try {
          const newCourse = await mockCreateCourse(courseData);
          set(state => ({ 
            courses: [...state.courses, newCourse],
            isLoading: false 
          }));
          return newCourse;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create course', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Delete a course
      deleteCourse: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await mockDeleteCourse(id);
          set(state => ({ 
            courses: state.courses.filter(course => course.id !== id),
            isLoading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete course', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Get a course by ID
      getCourseById: (id) => {
        return get().courses.find(course => course.id === id);
      },

      // Update a course
      updateCourse: async (id, courseData) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would call an API endpoint
          await delay(800);
          
          const updatedCourse = {
            ...get().getCourseById(id),
            ...courseData
          } as Course;
          
          set(state => ({
            courses: state.courses.map(course => 
              course.id === id ? updatedCourse : course
            ),
            isLoading: false
          }));
          
          return updatedCourse;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update course', 
            isLoading: false 
          });
          throw error;
        }
      },

      // Subscribe to real-time updates
      subscribeToCoursesUpdates: () => {
        // In a real application, this would setup a WebSocket connection
        console.log('Subscribed to courses updates');
      },

      // Unsubscribe from real-time updates
      unsubscribeFromCoursesUpdates: () => {
        // In a real application, this would close a WebSocket connection
        console.log('Unsubscribed from courses updates');
      }
    }),
    {
      name: 'course-storage', // local storage key
      getStorage: () => localStorage
    }
  )
);

export default useCourseStore; 