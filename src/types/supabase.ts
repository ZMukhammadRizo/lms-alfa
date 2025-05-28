export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
	public: {
		Tables: {
			classes: {
				Row: {
					id: string
					classname: string
					description: string | null
					level_id: string | null
					category_id: string | null
					teacherId: string | null
					createdby: string | null
					attendanceDays: string[] | null
					attendanceTimes: string[] | null
					student_count: number
					status: string
					created_at: string
					updated_at: string | null
				}
				Insert: {
					id?: string
					classname: string
					description?: string | null
					level_id?: string | null
					category_id?: string | null
					teacherId?: string | null
					createdby?: string | null
					attendanceDays?: string[] | null
					attendanceTimes?: string[] | null
					student_count?: number
					status?: string
					created_at?: string
					updated_at?: string | null
				}
				Update: {
					id?: string
					classname?: string
					description?: string | null
					level_id?: string | null
					category_id?: string | null
					teacherId?: string | null
					createdby?: string | null
					attendanceDays?: string[] | null
					attendanceTimes?: string[] | null
					student_count?: number
					status?: string
					created_at?: string
					updated_at?: string | null
				}
			}
			levels: {
				Row: {
					id: string
					name: string
					class_count: number
				}
				Insert: {
					id?: string
					name: string
					class_count?: number
				}
				Update: {
					id?: string
					name?: string
					class_count?: number
				}
			}
			categories: {
				Row: {
					id: string
					name: string
					class_count: number
				}
				Insert: {
					id?: string
					name: string
					class_count?: number
				}
				Update: {
					id?: string
					name?: string
					class_count?: number
				}
			}
			sections: {
				Row: {
					id: string
					grade: string
					letter: string
					room: string | null
					teacherId: string | null
					status: string
					created_at: string
					updated_at: string | null
				}
				Insert: {
					id?: string
					grade: string
					letter: string
					room?: string | null
					teacherId?: string | null
					status?: string
					created_at?: string
					updated_at?: string | null
				}
				Update: {
					id?: string
					grade?: string
					letter?: string
					room?: string | null
					teacherId?: string | null
					status?: string
					created_at?: string
					updated_at?: string | null
				}
			}
			students: {
				Row: {
					id: string
					user_id: string
					grade: string
					section: string
					sectionId: string | null
					status: string
					created_at: string
					updated_at: string | null
				}
				Insert: {
					id?: string
					user_id: string
					grade: string
					section: string
					sectionId?: string | null
					status?: string
					created_at?: string
					updated_at?: string | null
				}
				Update: {
					id?: string
					user_id?: string
					grade?: string
					section?: string
					sectionId?: string | null
					status?: string
					created_at?: string
					updated_at?: string | null
				}
			}
			student_subjects: {
				Row: {
					id: string
					studentId: string
					subject: string
					created_at: string
				}
				Insert: {
					id?: string
					studentId: string
					subject: string
					created_at?: string
				}
				Update: {
					id?: string
					studentId?: string
					subject?: string
					created_at?: string
				}
			}
			classstudents: {
				Row: {
					id: string
					classid: string
					studentid: string
					status: string
					created_at: string
				}
				Insert: {
					id?: string
					classid: string
					studentid: string
					status?: string
					created_at?: string
				}
				Update: {
					id?: string
					classid?: string
					studentid?: string
					status?: string
					created_at?: string
				}
			}
			subjects: {
				Row: {
					id: string
					subjectname: string
					code: string | null
					description: string | null
					status: string
					createdat: string
				}
				Insert: {
					id?: string
					subjectname: string
					code?: string | null
					description?: string | null
					status?: string
					createdat?: string
				}
				Update: {
					id?: string
					subjectname?: string
					code?: string | null
					description?: string | null
					status?: string
					createdat?: string
				}
			}
			classsubjects: {
				Row: {
					id: string
					classid: string
					subjectid: string
				}
				Insert: {
					id?: string
					classid: string
					subjectid: string
				}
				Update: {
					id?: string
					classid?: string
					subjectid?: string
				}
			}
			lessons: {
				Row: {
					id: string
					lessonname: string
					videourl: string
					description: string | null
					uploadedat: string
					subjectid: string | null
					teacherid: string | null
					duration: string | null
					fileurls: string[] | null
				}
				Insert: {
					id?: string
					lessonname: string
					videourl: string
					description?: string | null
					uploadedat?: string
					subjectid?: string | null
					teacherid?: string | null
					duration?: string | null
					fileurls?: string[] | null
				}
				Update: {
					id?: string
					lessonname?: string
					videourl?: string
					description?: string | null
					uploadedat?: string
					subjectid?: string | null
					teacherid?: string | null
					duration?: string | null
					fileurls?: string[] | null
				}
			}
			assignments: {
				Row: {
					id: string
					classid: string | null
					title: string
					instructions: string | null
					duedate: string | null
					quarter_id: string | null
					createdby: string | null
					createdat: string
				}
				Insert: {
					id?: string
					classid?: string | null
					title: string
					instructions?: string | null
					duedate?: string | null
					quarter_id?: string | null
					createdby?: string | null
					createdat?: string
				}
				Update: {
					id?: string
					classid?: string | null
					title?: string
					instructions?: string | null
					duedate?: string | null
					quarter_id?: string | null
					createdby?: string | null
					createdat?: string
				}
			}
			quarters: {
				Row: {
					id: string
					name: string
					start_date: string
					end_date: string
				}
				Insert: {
					id?: string
					name: string
					start_date: string
					end_date: string
				}
				Update: {
					id?: string
					name?: string
					start_date?: string
					end_date?: string
				}
			}
			scores: {
				Row: {
					id: string
					student_id: string
					lesson_id: string
					quarter_id: string
					teacher_id: string | null
					score: number
					created_at: string
					updated_at: string
				}
				Insert: {
					id?: string
					student_id: string
					lesson_id: string
					quarter_id: string
					teacher_id?: string | null
					score: number
					created_at?: string
					updated_at?: string
				}
				Update: {
					id?: string
					student_id?: string
					lesson_id?: string
					quarter_id?: string
					teacher_id?: string | null
					score?: number
					created_at?: string
					updated_at?: string
				}
			}
			users: {
				Row: {
					id: string
					firstName: string
					lastName: string
					email: string
					password: string
					role: string
					role_id: string | null
					status: string
					createdAt: string
					lastLogin: string | null
				}
				Insert: {
					id: string
					firstName: string
					lastName: string
					email: string
					password: string
					role: string
					role_id?: string | null
					status?: string
					createdAt?: string
					lastLogin?: string | null
				}
				Update: {
					id?: string
					firstName?: string
					lastName?: string
					email?: string
					password?: string
					role?: string
					role_id?: string | null
					status?: string
					createdAt?: string
					lastLogin?: string | null
				}
			}
		}
		Views: {
			class_overview: {
				Row: {
					id: string
					classname: string
					description: string | null
					student_count: number
					level: string | null
					category: string | null
					subjects: string[]
					lessons: string[]
					quarters: string[]
				}
			}
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row']
export type Inserting<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert']
export type Updating<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> =
	Database['public']['Views'][T]['Row']

// Convenience type definitions
export type Class = Tables<'classes'>
export type Section = Tables<'sections'>
export type Student = Tables<'students'>
export type ClassOverview = Views<'class_overview'>
export type Subject = Tables<'subjects'>
export type Lesson = Tables<'lessons'>
export type User = Tables<'users'>
export type ClassSubject = Tables<'classsubjects'>
export type StudentSubject = Tables<'student_subjects'>
export type Assignment = Tables<'assignments'>
export type Score = Tables<'scores'>
export type Quarter = Tables<'quarters'>
export type Level = Tables<'levels'>
export type Category = Tables<'categories'>
