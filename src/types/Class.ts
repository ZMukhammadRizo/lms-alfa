export interface Class {
	id: string
	classname: string
	description: string
	level_id: string
	category_id: string
	teacherId: string
	student_count: number
	status: 'active' | 'inactive' | 'upcoming' | 'completed'
	created_at: string
	updated_at: string
}

export interface ClassWithRelations extends Class {
	teacher?: {
		firstName: string
		lastName: string
	} | null
	level?: {
		name: string
	} | null
	category?: {
		name: string
	} | null
	subjects?: {
		id: string
		subjectname: string
	}[]
}

export interface NewClass {
	classname: string
	description: string
	level_id: string
	category_id: string
	teacherId: string
	status?: 'active' | 'inactive' | 'upcoming'
}

export interface ClassDetails extends Class {
	classsubjects: ClassSubject[]
}

export interface ClassSubject {
	id: string
	class_id: string
	subject_id: string
	subjects: Subject
}

export interface Subject {
	id: string
	subjectname: string
	lessons: Lesson[]
}

export interface Lesson {
	id: string
	lessonname: string
	videourl: string
	duration: number
	subject_id: string
}

export interface ClassStudent {
	id: string
	classid: string
	studentid: string
	status: 'active' | 'inactive' | 'completed'
	joined_at: string
}

export interface ClassStudentWithDetails extends ClassStudent {
	users: {
		id: string
		firstName: string
		lastName: string
	}
}
