// Types for the parent dashboard and related features

export interface ParentStudentRelation {
	id: string
	parentId: string
	studentId: string
	relationshipType: string
	isVerified: boolean
	status: 'active' | 'pending' | 'inactive'
	createdAt: string
	updatedAt: string
}

export interface StudentSummary {
	id: string
	name: string
	grade?: string
	className?: string
	avatar?: string
	overallGrade: string
	attendance: number
	pendingAssignments: number
	unreadMessages: number
}

export interface Assignment {
	id: string
	title: string
	subject: string
	dueDate: string
	description?: string
	status: 'Completed' | 'In Progress' | 'Not Started' | 'Pending'
	grade?: string
}

export interface Grade {
	id: string
	subject: string
	title: string
	grade: string
	score: string
	date: string
	comment?: string
	type: 'Exam' | 'Quiz' | 'Assignment' | 'Project' | 'Other'
}

export interface AttendanceRecord {
	id: string
	date: string
	status: 'Present' | 'Absent' | 'Late' | 'Excused'
	notes?: string
	subject?: string
	period?: string
}

export interface ParentNotification {
	id: string
	title: string
	message: string
	studentId: string
	createdAt: string
	isRead: boolean
	type: 'Assignment' | 'Grade' | 'Attendance' | 'Message' | 'System'
	link?: string
}

// Response types from database
export interface ScoreResponse {
	id: string
	student_id: string
	lesson_id: string
	quarter_id: string
	teacher_id?: string
	score: number
	created_at: string
	lessons: {
		lessonname: string
		subjectid: string
		subjects: {
			subjectname: string
		}
	}
	quarters: {
		name: string
	}
}

export interface AttendanceResponse {
	id: string
	student_id: string
	lesson_id: string
	status: string
	noted_at: string
	lessons: {
		lessonname: string
		subjectid: string
		subjects: {
			subjectname: string
		}
	}
}
