export interface Student {
	id: string
	name: string
	email: string
	phone: string
	grade: string
	section: string
	performance: number
	subjects: string[]
	status: string
	guardian?: string
	course?: string
	role?: string
	attendance?: number
}

export interface Section {
	id: string
	name: string
	room: string
	students: number
	teacher: string
	performance: number
	grade: string
}

export interface Class {
	id: string
	classname: string
	teacherName: string
	attendanceDays: string[] | null
	attendanceTimes: string[] | null
	formattedDays: string
	formattedTimes: string
	students: number
	status: string
	color: string
	sectionCount: number
}

export interface ClassType {
	id: string
	name: string
	created_at: string
}

export interface SubjectTeacherAssignment {
	subjectId: string
	subjectName: string
	teacherId: string | null
}

export interface AddStudentModalProps {
	isOpen: boolean
	onClose: () => void
	onAddStudents: (studentIds: string[]) => void
	classId: string
	excludedStudentIds: string[]
}

export interface AvailableStudent {
	id: string
	name: string
	email: string
	role?: string
	selected: boolean
}

export interface AddSectionModalProps {
	isOpen: boolean
	onClose: () => void
	onAddSection: (sectionName: string, room: string) => void
	grade: string
	suggestedName: string
	suggestedRoom: string
}

export interface EditSectionModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (sectionId: string, sectionName: string, room: string) => void
	section: Section
}

export interface AssignTeacherModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (sectionId: string, teacherName: string, teacherId?: string) => void
	section: Section
}

export interface DeleteConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	itemName: string
	message?: string
	title?: string
}

export interface EditClassModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (
		classId: string,
		className: string,
		attendanceDays: string[],
		attendanceTimes: string[],
		status: string
	) => void
	classData: Class
}

export interface CreateClassModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (className: string, status: string) => void
}

export interface ManageClassSubjectTeachersModalProps {
	isOpen: boolean
	onClose: () => void
	section: Section | null
}

export interface EditStudentClassModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (studentId: string, newClassId: string) => void
	student: Student
	currentClassId: string
}
