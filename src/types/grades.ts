export interface Student {
	id: string
	firstName: string
	lastName: string
	fullName: string
	avatarUrl?: string
}

export interface Class {
	id: string
	name: string
	grade_level: number
	section: string
	academic_year: string
}

export interface TeacherClass {
	id: string
	teacher_id: string
	class_id: string
	classes: Class
}

export interface Subject {
	id: string
	name: string
	code: string
	icon?: string
	color?: string
}

export interface GradeEntry {
	id?: string
	studentId: string
	lessonId: string
	score: number | null
}

export type Quarter = 'quarter1' | 'quarter2' | 'quarter3' | 'quarter4' | 'final'

export interface GradePeriod {
	id: string
	name: string
	value: Quarter
}

export interface ClassGroup {
	gradeLevel: number
	gradeName: string
	classes: TeacherClass[]
}

export interface CardProps {
	$isHovered?: boolean
	$color?: string
}

export interface TableRowProps {
	$highlighted?: boolean
}

export interface StyledCellProps {
	$align?: 'left' | 'center' | 'right'
}

export interface GradeBadgeProps {
	$color: 'success' | 'primary' | 'warning' | 'danger' | 'neutral'
}

export interface EditButtonProps {
	$type: 'save' | 'cancel'
}

export interface QuarterButtonProps {
	$active: boolean
}

export interface AvatarProps {
	$imageUrl?: string
}

export interface SkeletonRowProps {
	$delay: number
}

// 1. Grades Dashboard Card (per-level)
export interface GradeLevelOverview {
	levelId: string // UUID → levels.id
	levelName: string // e.g. "10"
	classCount: number
	studentCount: number
	subjectCount: number
}

// 2. Level Detail Card (per-class)
export interface LevelCategoryOverview {
	levelId: string // levels.id
	classId: string // classes.id
	classname: string // e.g. "10B"
	studentCount: number
	subjectCount?: number // Make this optional since it might not be available in all contexts
}

// 3. Class Subjects List Item
export interface ClassSubjectOverview {
	classId: string // classes.id
	subjectId: string // subjects.id
	subjectName: string
	lessonCount: number
}

// 4. Journal Data
export interface LessonInfo {
	id: string
	lessonName: string
	date: string
}

export interface StudentInfo {
	id: string // users.id
	fullName: string
}

export interface ScoreRecord {
	studentId: string // users.id
	lessonId: string // lessons.id
	score: number | null
}

export interface JournalTable {
	students: Student[]
	lessons: LessonInfo[]
	scores: ScoreRecord[]
}

export interface QuarterInfo {
	id: string
	name: string
	start_date: string
	end_date: string
}
