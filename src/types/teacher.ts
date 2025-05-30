export interface Class {
	id: string
	classname: string
	subjectId: string
	teacherId: string
	createdBy: string
	createdAt: string
	videos?: Video[]
	students?: User[]
	subjects?: Subject
	studentCount?: number
	subjectCount?: number
	level_id?: string
	level_type_id?: number
  [key: string]: any
}

export interface Video {
	id: string
	videourl: string
	classId: string
	title?: string
}

export interface User {
	id: string
	role: 'Student' | 'Teacher'
	name: string
	email: string
}

export interface Subject {
	id: string
	name: string
}

export interface ClassStudent {
	id: string
	classId: string
	studentId: string
	created_at: string
	user?: User
}

export interface ClassType {
	id: number
	name: string
	created_at: string
}
