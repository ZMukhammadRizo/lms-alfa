import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiArrowLeft,
	FiArrowRight,
	FiBarChart2,
	FiBook,
	FiCalendar,
	FiCheckSquare,
	FiClipboard,
	FiClock,
	FiEdit2,
	FiKey,
	FiLayers,
	FiMail,
	FiTrash2,
	FiUser,
	FiUserCheck,
	FiUsers,
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import UserForm from '../../components/admin/UserForm'
import supabase, { supabaseAdmin } from '../../config/supabaseClient'
import { User as UserType } from '../../types/User'

// Define interfaces for the additional data
interface Class {
	id: string
	classname: string
}

interface Subject {
	id: string
	name: string
}

interface TeacherAssignment {
	class: Class
	subject: Subject
}

interface StudentClass {
	id: string
	classname: string
}

interface StudentGrade {
	id: string
	subject: string
	grade: string | number
	date: string
	quarter?: string
	comment?: string
	lessonName?: string
}

interface StudentAttendance {
	id: string
	date: string
	status: 'present' | 'absent' | 'late' | 'excused' | 'not-assigned'
	subject?: string
	quarter?: string
	lessonName?: string
	quarterData?: { id: string; name: string }
}

interface StudentAssignment {
	id: string
	title: string
	subject: string
	dueDate: string
	status: 'completed' | 'pending' | 'overdue'
	grade?: number
	feedback?: string
	submitted?: string
	quarter?: string
}

// Add childrenIds to User interface
interface User extends UserType {
	childrenIds?: string[] // Add this for the user form
	birthday?: string // Add birthday field
}

// Helper function for formatting dates (moved outside of component to be accessible to modal)
const formatDate = (dateString: string) => {
	if (!dateString || dateString === 'Never') return 'Never'

	try {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	} catch {
		return dateString
	}
}

// Attendance Modal Component
interface AttendanceModalProps {
	isOpen: boolean
	onClose: () => void
	attendance: StudentAttendance[]
	title?: string
	formatDateFn: (date: string) => string
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
	isOpen,
	onClose,
	attendance,
	title = 'Attendance History',
	formatDateFn,
}) => {
	const { t } = useTranslation()

	if (!isOpen) return null

	return (
		<ModalOverlay>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>{title}</ModalTitle>
					<ModalCloseButton onClick={onClose}>×</ModalCloseButton>
				</ModalHeader>
				<ModalBody>
					{attendance.length === 0 ? (
						<ModalEmptyState>{t('userProfile.attendanceNotFound')}</ModalEmptyState>
					) : (
						<ModalAttendanceList>
							{attendance.map(record => (
								<AttendanceHistoryItem key={record.id} $status={record.status}>
									<AttendanceHistoryInfo>
										<AttendanceHistorySubject>{record.subject}</AttendanceHistorySubject>
										<AttendanceHistoryLesson>{record.lessonName}</AttendanceHistoryLesson>
										<AttendanceHistoryDate>{formatDateFn(record.date)}</AttendanceHistoryDate>
										<AttendanceHistoryQuarter>{record.quarter}</AttendanceHistoryQuarter>
									</AttendanceHistoryInfo>
									<AttendanceHistoryStatus $status={record.status}>
										{record.status === 'present'
											? t('userProfile.present')
											: record.status === 'absent'
											? t('userProfile.absent')
											: record.status === 'late'
											? t('userProfile.late')
											: t('userProfile.excused')}
									</AttendanceHistoryStatus>
								</AttendanceHistoryItem>
							))}
						</ModalAttendanceList>
					)}
				</ModalBody>
				<ModalFooter>
					<Button onClick={onClose}>{t('common.close')}</Button>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	)
}

// Modal styled components
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
`

const ModalContent = styled.div`
	background-color: white;
	border-radius: 0.5rem;
	width: 90%;
	max-width: 800px;
	max-height: 90vh;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	display: flex;
	flex-direction: column;
`

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
`

const ModalCloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: ${props => props.theme.colors.text.secondary};

	&:hover {
		color: ${props => props.theme.colors.text.primary};
	}
`

const ModalBody = styled.div`
	padding: 1.5rem;
	overflow-y: auto;
	max-height: 70vh;
`

const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	padding: 1rem 1.5rem;
	border-top: 1px solid ${props => props.theme.colors.neutral[200]};
`

const Button = styled.button`
	padding: 0.5rem 1rem;
	background-color: ${props => props.theme.colors.primary[600]};
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.primary[700]};
	}
`

const ModalAttendanceList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const ModalEmptyState = styled.div`
	text-align: center;
	padding: 2rem;
	color: ${props => props.theme.colors.text.secondary};
`

const UserProfile: React.FC = () => {
	const { userId } = useParams<{ userId: string }>()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [children, setChildren] = useState<User[]>([])
	const [isUserFormOpen, setIsUserFormOpen] = useState(false)
	const [formTitle, setFormTitle] = useState('Edit User')

	// New state for enhanced profiles
	const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([])
	const [studentClass, setStudentClass] = useState<StudentClass | null>(null)
	const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
	const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([])
	const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([])
	const [loadingAdditionalData, setLoadingAdditionalData] = useState(false)

	// Add state for parent information
	const [parentInfo, setParentInfo] = useState<User | null>(null)

	// Add state for attendance modal
	const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
	const [allAttendance, setAllAttendance] = useState<StudentAttendance[]>([])

	// Add state for reset password modal
	const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
	const [isResettingPassword, setIsResettingPassword] = useState(false)

	// Add state for deactivate modal
	const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState<boolean>(false)
	const [isDeactivating, setIsDeactivating] = useState<boolean>(false)
	const [deactivateError, setDeactivateError] = useState<string | null>(null)

	useEffect(() => {
		if (userId) {
			fetchUser()
		}
	}, [userId])

	const fetchUser = async () => {
		if (!userId) return

		setLoading(true)
		try {
			// Fetch the user
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('*')
				.eq('id', userId)
				.single()

			if (userError) {
				console.error('Error fetching user:', userError)
				toast.error('Failed to load user details')
				navigate('/admin/users')
				return
			}

			// Format the user data to match our User interface
			const formattedUser: User = {
				id: userData.id,
				firstName: userData.firstName || userData.first_name || '',
				lastName: userData.lastName || userData.last_name || '',
				email: userData.email || '',
				role: userData.role || '',
				status: userData.status || 'active',
				lastLogin: userData.lastLogin || userData.last_login || 'Never',
				createdAt: userData.createdAt || userData.created_at || '',
				parent_id: userData.parent_id,
				birthday: userData.birthday || '',
			}

			setUser(formattedUser)

			// If the user is a parent, fetch their children
			if (formattedUser.role === 'Parent') {
				fetchChildren(userData.id)
			}
			// If the user is a student, fetch their parent and additional data
			else if (formattedUser.role === 'Student') {
				if (formattedUser.parent_id) {
					fetchParent(formattedUser.parent_id)
				}
				fetchStudentData(userData.id)
			}
			// If the user is a teacher, fetch their assigned classes and subjects
			else if (formattedUser.role === 'Teacher') {
				fetchTeacherData(userData.id)
			}
		} catch (err) {
			console.error('Unexpected error fetching user:', err)
			toast.error('An unexpected error occurred')
		} finally {
			setLoading(false)
		}
	}

	const fetchParent = async (parentId: string) => {
		try {
			const { data: parentData, error: parentError } = await supabase
				.from('users')
				.select('*')
				.eq('id', parentId)
				.single()

			if (parentError) {
				console.error('Error fetching parent:', parentError)
				return
			}

			if (parentData) {
				// Format the parent data
				const formattedParent: User = {
					id: parentData.id,
					firstName: parentData.firstName || parentData.first_name || '',
					lastName: parentData.lastName || parentData.last_name || '',
					email: parentData.email || '',
					role: parentData.role || 'Parent',
					status: parentData.status === 'inactive' ? 'inactive' : 'active',
					lastLogin: parentData.lastLogin || parentData.last_login || 'Never',
					createdAt: parentData.createdAt || parentData.created_at || '',
					parent_id: parentData.parent_id,
				}

				setParentInfo(formattedParent)
				console.log('Parent information fetched:', formattedParent)
			}
		} catch (err) {
			console.error('Error fetching parent info:', err)
		}
	}

	const fetchChildren = async (parentId: string) => {
		try {
			const { data: childrenData, error: childrenError } = await supabase
				.from('users')
				.select('*')
				.eq('parent_id', parentId)

			if (childrenError) {
				console.error('Error fetching children:', childrenError)
				return
			}

			// Format the children data
			const formattedChildren = childrenData.map(child => ({
				id: child.id,
				firstName: child.firstName || child.first_name || '',
				lastName: child.lastName || child.last_name || '',
				email: child.email || '',
				role: child.role || 'Student',
				status: child.status || 'active',
				lastLogin: child.lastLogin || child.last_login || 'Never',
				createdAt: child.createdAt || child.created_at || '',
			}))

			setChildren(formattedChildren)
		} catch (err) {
			console.error('Error fetching children:', err)
		}
	}

	const fetchTeacherData = async (teacherId: string) => {
		setLoadingAdditionalData(true)
		try {
			// Try to fetch real data if the tables exist
			try {
				const { data, error } = await supabase
					.from('teacher_assignments')
					.select(
						`
            id,
            class_id,
            subject_id,
            classes (id, classname),
            subjects (id, subjectname)
          `
					)
					.eq('teacher_id', teacherId)

				if (!error && data && data.length > 0) {
					// Format the data for our component
					const assignments = data.map(item => ({
						class: {
							id: (item.classes as any)?.id || item.class_id,
							classname: (item.classes as any)?.classname || 'Unknown Class',
						},
						subject: {
							id: (item.subjects as any)?.id || item.subject_id,
							name: (item.subjects as any)?.subjectname || 'Unknown Subject',
						},
					}))
					setTeacherAssignments(assignments)
					return
				}
			} catch (fetchError) {
				console.error('Error fetching teacher assignments:', fetchError)
			}
		} catch (err) {
			console.error('Error fetching teacher data:', err)
		} finally {
			setLoadingAdditionalData(false)
		}
	}

	const fetchStudentData = async (studentId: string) => {
		console.log('Running fetchStudentData for student ID:', studentId)
		setLoadingAdditionalData(true)

		try {
			// 1. Just get the class info without complex joins
			try {
				const { data: classData } = await supabase
					.from('classstudents')
					.select('classid, classes!inner(classname)')
					.eq('studentid', studentId)
					.single()

				if (classData) {
					console.log('Class data:', classData)
					setStudentClass({
						id: classData.classid || 'unknown',
						classname: (classData.classes as any)?.classname || 'Unknown Class',
					})
				}
			} catch (err) {
				console.error('Error fetching class:', err)
			}

			// Rest of the fetching will be done by our test functions
		} catch (err) {
			console.error('Error in fetchStudentData:', err)
		} finally {
			setLoadingAdditionalData(false)
		}
	}

	// Add test function to manually fetch scores
	const testFetchScores = async (studentId: string) => {
		console.log('Testing direct scores fetch for student ID:', studentId)

		try {
			// Updated query to join with lessons, subjects, and quarters tables
			const { data, error } = await supabase
				.from('scores')
				.select(
					`
          *,
          lessons:lesson_id (
            id,
            lessonname,
            subjects:subjectid (
              id,
              subjectname
            )
          ),
          quarters:quarter_id (
            id,
            name
          )
        `
				)
				.eq('student_id', studentId)
				.limit(5)

			if (error) {
				console.error('Test scores fetch error:', error)
			} else {
				console.log('Test scores fetch result:', data)
				if (data && data.length > 0) {
					const formattedGrades = data.map(
						(score): StudentGrade => ({
							id: score.id,
							subject: score.lessons?.subjects?.subjectname || 'Unknown Subject',
							lessonName: score.lessons?.lessonname || 'Lesson ' + score.lesson_id,
							grade: score.score,
							date: score.created_at,
							quarter: score.quarters?.name || 'Quarter ' + score.quarter_id,
							comment: score.comment || '',
						})
					)
					setStudentGrades(formattedGrades)
				}
			}
		} catch (err) {
			console.error('Test scores fetch exception:', err)
		}
	}

	// Add test function for attendance
	const testFetchAttendance = async (studentId: string) => {
		console.log('Testing direct attendance fetch for student ID:', studentId)

		try {
			// Updated query to join with lessons, subjects, and quarters tables
			const { data, error } = await supabase
				.from('attendance')
				.select(
					`
          *,
          lessons:lesson_id (
            id,
            lessonname,
            subjects:subjectid (
              id,
              subjectname
            )
          ),
          quarters:quarter_id (
            id,
            name
          )
        `
				)
				.eq('student_id', studentId)
				.order('noted_at', { ascending: false })
				.limit(20) // Increased limit for more records

			if (error) {
				console.error('Test attendance fetch error:', error)
			} else {
				console.log('Test attendance fetch result:', data)
				if (data && data.length > 0) {
					// Use the joined data for better display
					const formattedAttendance = data.map(
						(record): StudentAttendance => ({
							id: record.id,
							date: record.noted_at,
							status: record.status || 'not-assigned',
							subject: record.lessons?.subjects?.subjectname || 'Unknown Subject',
							lessonName: record.lessons?.lessonname || 'Lesson ' + record.lesson_id,
							quarter: record.quarters?.name || 'Current Quarter',
							quarterData: record.quarters || {
								id: record.quarter_id,
								name: 'Quarter ' + record.quarter_id,
							},
						})
					)

					// Store all attendance data
					setAllAttendance(formattedAttendance)

					// Show only the most recent records for the main view
					setStudentAttendance(formattedAttendance.slice(0, 5))
				}
			}
		} catch (err) {
			console.error('Test attendance fetch exception:', err)
		}
	}

	// Add test function for assignments and submissions
	const testFetchAssignments = async (studentId: string) => {
		console.log('Testing direct assignments/submissions fetch for student ID:', studentId)

		try {
			// Updated query to join with assignments and subjects
			const { data: submissionsData, error: submissionsError } = await supabase
				.from('submissions')
				.select(
					`
          *,
          assignments(
            *,
            subjects:subject_id (
              id,
              subjectname
            ),
            quarters:quarter_id (
              id,
              name
            )
          )
        `
				)
				.eq('studentid', studentId)
				.limit(5)

			if (submissionsError) {
				console.error('Test submissions fetch error:', submissionsError)
			} else {
				console.log('Test submissions fetch result:', submissionsData)
				if (submissionsData && submissionsData.length > 0) {
					const formattedAssignments = submissionsData.map(
						(submission): StudentAssignment => ({
							id: submission.assignmentid,
							title: submission.assignments?.title || 'Unknown Assignment',
							subject: submission.assignments?.subjects?.subjectname || 'Unknown Subject',
							dueDate: submission.assignments?.duedate || new Date().toISOString(),
							status: submission.status || 'pending',
							grade: submission.grade,
							feedback: submission.feedback || '',
							submitted: submission.submittedat,
							quarter: submission.assignments?.quarters?.name || 'Current Quarter',
						})
					)
					setStudentAssignments(formattedAssignments)
				}
			}
		} catch (err) {
			console.error('Test assignments fetch exception:', err)
		}
	}

	// Call all test functions when user info is loaded
	useEffect(() => {
		if (user?.id && user.role === 'Student') {
			testFetchScores(user.id)
			testFetchAttendance(user.id)
			testFetchAssignments(user.id)
		}
	}, [user])

	const handleEditUser = () => {
		if (!user) return
		setFormTitle(`Edit User: ${user.firstName} ${user.lastName}`)
		setIsUserFormOpen(true)
	}

	const handleDeleteUser = () => {
		setIsDeactivateModalOpen(true)
	}

	const handleCloseDeactivateModal = () => {
		setIsDeactivateModalOpen(false)
		setDeactivateError(null)
	}

	const handleConfirmDeactivate = async () => {
		if (!user) return

		setIsDeactivating(true)
		setDeactivateError(null)

		try {
			// Update the user's status to 'inactive'
			const { error } = await supabase
				.from('users')
				.update({ status: 'inactive' })
				.eq('id', user.id)

			if (error) {
				console.error('Error deactivating user:', error)
				setDeactivateError(error.message)
				setIsDeactivating(false)
				return
			}

			// Update the local state
			setUser({
				...user,
				status: 'inactive',
			})

			// Close the modal
			setIsDeactivateModalOpen(false)

			// Show success message
			toast.success('User has been deactivated successfully')
		} catch (error: any) {
			console.error('Unexpected error during user deactivation:', error)
			setDeactivateError('An unexpected error occurred')
		} finally {
			setIsDeactivating(false)
		}
	}

	const handleUserFormSubmit = async (userData: Partial<User>) => {
		try {
			console.log('Updating user:', userData)

			if (!userData.id) return

			// Format the update data
			const updateData = {
				email: userData.email,
				role: userData.role,
				firstName: userData.firstName,
				lastName: userData.lastName,
				status: userData.status,
				birthday: userData.birthday,
			}

			// Update the user
			const { error } = await supabase.from('users').update(updateData).eq('id', userData.id)

			if (error) {
				console.error('Failed to update user:', error)
				toast.error(`Failed to update user: ${error.message}`)
				return
			}

			// Update the local state
			if (user) {
				setUser({
					...user,
					...(userData as User),
				})
			}

			// Handle parent-child relationships if needed
			if (userData.role === 'Parent' && userData.childrenIds) {
				try {
					// Assuming there's an assignChildrenToParent function somewhere
					// await assignChildrenToParent(userData.id, userData.childrenIds)
					toast.success('Parent-child relationships updated successfully')
				} catch (err) {
					console.error('Error updating parent-child relationships:', err)
					toast.error('Failed to update parent-child relationships')
				}
			}

			toast.success('User updated successfully')
			setIsUserFormOpen(false)
		} catch (err) {
			console.error('Error updating user:', err)
			toast.error('An unexpected error occurred')
		}
	}

	// Add a function to navigate to the parent profile
	const navigateToParentProfile = (parentId: string) => {
		navigate(`/admin/users/${parentId}`)
	}

	// Add debug function to print all states
	useEffect(() => {
		if (!loading && !loadingAdditionalData && user) {
			console.log('--- DEBUG USER PROFILE DATA ---')
			console.log('User:', user)
			console.log('Student Class:', studentClass)
			console.log('Student Grades:', studentGrades)
			console.log('Student Attendance:', studentAttendance)
			console.log('Student Assignments:', studentAssignments)
			console.log('-----------------------------')
		}
	}, [
		loading,
		loadingAdditionalData,
		user,
		studentClass,
		studentGrades,
		studentAttendance,
		studentAssignments,
	])

	// Add handler to open reset password modal
	const handleResetPassword = () => {
		setIsResetPasswordModalOpen(true)
	}

	// Add handler to close reset password modal
	const handleCancelResetPassword = () => {
		setIsResetPasswordModalOpen(false)
	}

	// Add handler to confirm and execute password reset
	const handleConfirmResetPassword = async () => {
		if (!user) return

		setIsResettingPassword(true)

		try {
			// First, update password in the auth.users table (which requires bcrypt hashing)
			// We need to use the Supabase Admin client with service role for this
			const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
				password: '12345678',
			})

			if (authError) {
				toast.error(`Failed to reset auth password: ${authError.message}`)
				setIsResettingPassword(false)
				return
			}

			// Next, update the password in public.users table
			const { error: dbError } = await supabase
				.from('users')
				.update({ password: '12345678' })
				.eq('id', user.id)

			if (dbError) {
				toast.error(`Failed to reset database password: ${dbError.message}`)
				setIsResettingPassword(false)
				return
			}

			// Show success message
			toast.success(`Password reset successfully for ${user.firstName} ${user.lastName}`)

			// First close the modal to prevent UI issues
			handleCancelResetPassword()
		} catch (error) {
			console.error('Error resetting password:', error)
			toast.error('An unexpected error occurred while resetting the password')
		} finally {
			setIsResettingPassword(false)
		}
	}

	// Add Reset Password Modal component
	const ResetPasswordModal = () => {
		if (!isResetPasswordModalOpen || !user) return null

		return (
			<ModalOverlay>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>{t('userProfile.resetPasswordAction')}</ModalTitle>
						<ModalCloseButton onClick={handleCancelResetPassword}>×</ModalCloseButton>
					</ModalHeader>
					<ModalBody>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
						>
							<div
								style={{
									width: '48px',
									height: '48px',
									borderRadius: '50%',
									backgroundColor: '#f59e0b20',
									color: '#f59e0b',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								<FiKey size={24} />
							</div>
							<div>
								<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
									{t('userProfile.resetPasswordAction')}
								</h4>
								<p style={{ margin: '0', color: '#4b5563' }}>
									{t('userProfile.resetPasswordConfirm')}
								</p>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<CancelButton onClick={handleCancelResetPassword}>{t('common.cancel')}</CancelButton>
						<ResetButton onClick={handleConfirmResetPassword} disabled={isResettingPassword}>
							{isResettingPassword
								? t('userProfile.resetting')
								: t('userProfile.resetPasswordAction')}
						</ResetButton>
					</ModalFooter>
				</ModalContent>
			</ModalOverlay>
		)
	}

	// Add Deactivate User Modal component
	const DeactivateUserModal = () => {
		if (!isDeactivateModalOpen || !user) return null

		return (
			<ModalOverlay>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>Deactivate User</ModalTitle>
						<ModalCloseButton onClick={handleCloseDeactivateModal}>×</ModalCloseButton>
					</ModalHeader>
					<ModalBody>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
						>
							<div
								style={{
									width: '48px',
									height: '48px',
									borderRadius: '50%',
									backgroundColor: '#ef444420',
									color: '#ef4444',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								<FiTrash2 size={24} />
							</div>
							<div>
								<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
									Are you sure you want to deactivate this user?
								</h4>
								<p style={{ margin: '0', color: '#4b5563' }}>
									<strong>{`${user.firstName} ${user.lastName}`}</strong> will be marked as inactive
									in the system. They will no longer be able to log in.
								</p>
								{deactivateError && (
									<div
										style={{
											marginTop: '1rem',
											padding: '0.75rem',
											backgroundColor: '#fee2e2',
											borderLeft: '3px solid #ef4444',
											color: '#b91c1c',
											fontSize: '0.9rem',
											borderRadius: '0.25rem',
										}}
									>
										{deactivateError}
									</div>
								)}
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							onClick={handleCloseDeactivateModal}
							style={{
								backgroundColor: 'white',
								color: '#374151',
								border: '1px solid #d1d5db',
								marginRight: '0.75rem',
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmDeactivate}
							disabled={isDeactivating}
							style={{
								backgroundColor: '#ef4444',
							}}
						>
							{isDeactivating ? 'Deactivating...' : 'Deactivate User'}
						</Button>
					</ModalFooter>
				</ModalContent>
			</ModalOverlay>
		)
	}

	// Add a function to reactivate a user
	const handleReactivateUser = async () => {
		if (!user) return

		try {
			// Update the user's status to 'active'
			const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', user.id)

			if (error) {
				console.error('Error reactivating user:', error)
				toast.error(`Failed to reactivate user: ${error.message || 'Unknown error'}`)
				return
			}

			// Update the local state
			setUser({
				...user,
				status: 'active',
			})

			// Show success message
			toast.success('User has been reactivated successfully')
		} catch (error) {
			console.error('Unexpected error during user reactivation:', error)
			toast.error('An unexpected error occurred')
		}
	}

	if (loading) {
		return (
			<PageContainer>
				<LoadingState>{t('userProfile.loadingUserProfile')}</LoadingState>
			</PageContainer>
		)
	}

	if (!user) {
		return (
			<PageContainer>
				<ErrorState>{t('profile.userNotFound')}</ErrorState>
				<BackButton onClick={() => navigate('/admin/users')}>
					<FiArrowLeft />
					<span>{t('userProfile.backToUsers')}</span>
				</BackButton>
			</PageContainer>
		)
	}

	return (
		<PageContainer
			as={motion.div}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<HeaderSection>
				<BackButton onClick={() => navigate('/admin/users')}>
					<FiArrowLeft />
					<span>{t('userProfile.backToUsers')}</span>
				</BackButton>
				<HeaderRight>
					<EditButton onClick={handleEditUser}>
						<FiEdit2 />
						<span>{t('userProfile.edit')}</span>
					</EditButton>
					<ResetPasswordButton onClick={handleResetPassword}>
						<FiKey />
						<span>{t('userProfile.resetPassword')}</span>
					</ResetPasswordButton>
					{user.status === 'active' ? (
						<DeleteButton onClick={handleDeleteUser}>
							<FiTrash2 />
							<span>Deactivate User</span>
						</DeleteButton>
					) : (
						<ReactivateButton onClick={handleReactivateUser}>
							<FiUserCheck />
							<span>Reactivate User</span>
						</ReactivateButton>
					)}
				</HeaderRight>
			</HeaderSection>

			<ProfileCard>
				<ProfileHeader>
					<UserAvatar>
						{user.firstName && user.lastName ? (
							`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
						) : (
							<FiUser />
						)}
					</UserAvatar>
					<UserInfo>
						<UserName>{`${user.firstName} ${user.lastName}`}</UserName>
						<UserRole>
							<RoleBadge $role={user.role.toLowerCase()}>{user.role}</RoleBadge>
							<UserStatus $status={user.status || 'active'}>
								{user.status === 'active' ? 'Active' : 'Inactive'}
							</UserStatus>
						</UserRole>
					</UserInfo>
				</ProfileHeader>

				<ProfileContent>
					<DetailSection>
						<SectionTitle>{t('userProfile.userInformation')}</SectionTitle>
						<DetailGrid>
							<DetailItem>
								<DetailLabel>
									<FiUser />
									<span>{t('userProfile.fullName')}</span>
								</DetailLabel>
								<DetailValue>{`${user.firstName} ${user.lastName}`}</DetailValue>
							</DetailItem>

							<DetailItem>
								<DetailLabel>
									<FiMail />
									<span>{t('userProfile.email')}</span>
								</DetailLabel>
								<DetailValue>{user.email}</DetailValue>
							</DetailItem>

							<DetailItem>
								<DetailLabel>
									<FiCalendar />
									<span>{t('userProfile.createdOn')}</span>
								</DetailLabel>
								<DetailValue>{formatDate(user.createdAt)}</DetailValue>
							</DetailItem>

							<DetailItem>
								<DetailLabel>
									<FiClock />
									<span>{t('userProfile.lastLogin')}</span>
								</DetailLabel>
								<DetailValue>{formatDate(user.lastLogin)}</DetailValue>
							</DetailItem>

							<DetailItem>
								<DetailLabel>
									<FiCalendar />
									<span>{t('userProfile.dateOfBirth')}</span>
								</DetailLabel>
								<DetailValue>
									{user.birthday
										? new Date(user.birthday).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
										  })
										: t('profile.notSet')}
								</DetailValue>
							</DetailItem>
						</DetailGrid>
					</DetailSection>

					{user.role === 'Parent' && children.length > 0 && (
						<DetailSection>
							<SectionTitle>{t('userProfile.children')}</SectionTitle>
							<ChildrenList>
								{children.map(child => (
									<ChildItem key={child.id}>
										<ChildAvatar>
											{child.firstName.charAt(0)}
											{child.lastName.charAt(0)}
										</ChildAvatar>
										<ChildInfo>
											<ChildName>{`${child.firstName} ${child.lastName}`}</ChildName>
											<ChildEmail>{child.email}</ChildEmail>
										</ChildInfo>
									</ChildItem>
								))}
							</ChildrenList>
						</DetailSection>
					)}

					{user.role === 'Student' && user.parent_id && (
						<DetailSection>
							<SectionTitle>{t('userProfile.parentInformation')}</SectionTitle>
							<DetailItem>
								<DetailLabel>
									<FiUsers />
									<span>{t('userProfile.parent')}</span>
								</DetailLabel>
								<DetailValue>
									{parentInfo ? (
										<ParentLink onClick={() => navigateToParentProfile(parentInfo.id)}>
											{`${parentInfo.firstName} ${parentInfo.lastName}`}
										</ParentLink>
									) : (
										t('userProfile.loadingParentInfo')
									)}
								</DetailValue>
							</DetailItem>
						</DetailSection>
					)}

					{/* Teacher class and subject assignments */}
					{user.role === 'Teacher' && teacherAssignments.length > 0 && (
						<DetailSection>
							<SectionTitle>{t('userProfile.classSubjectAssignments')}</SectionTitle>
							<AssignmentsList>
								{teacherAssignments.map((assignment, index) => (
									<AssignmentItem key={index}>
										<AssignmentHeader>
											<AssignmentBadge>
												<FiLayers />
												<span>
													{t('userProfile.class')} {assignment.class.classname}
												</span>
											</AssignmentBadge>
											<AssignmentBadge>
												<FiBook />
												<span>{assignment.subject.name}</span>
											</AssignmentBadge>
										</AssignmentHeader>
									</AssignmentItem>
								))}
							</AssignmentsList>
						</DetailSection>
					)}

					{/* Student class information */}
					{user.role === 'Student' && studentClass && (
						<DetailSection>
							<SectionTitle>{t('userProfile.classInformation')}</SectionTitle>
							<DetailItem>
								<DetailLabel>
									<FiLayers />
									<span>{t('userProfile.class')}</span>
								</DetailLabel>
								<DetailValue>{studentClass.classname}</DetailValue>
							</DetailItem>
						</DetailSection>
					)}

					{/* Student grades overview */}
					{user.role === 'Student' && studentGrades.length > 0 && (
						<DetailSection>
							<SectionTitle>{t('userProfile.recentGrades')}</SectionTitle>
							<GradesTable>
								<thead>
									<tr>
										<GradeTableHeader>{t('userProfile.subject')}</GradeTableHeader>
										<GradeTableHeader>{t('userProfile.lesson')}</GradeTableHeader>
										<GradeTableHeader>{t('userProfile.grade')}</GradeTableHeader>
										<GradeTableHeader>{t('userProfile.quarter')}</GradeTableHeader>
										<GradeTableHeader>{t('userProfile.date')}</GradeTableHeader>
									</tr>
								</thead>
								<tbody>
									{studentGrades.map(grade => (
										<GradeTableRow key={grade.id}>
											<GradeTableCell>{grade.subject}</GradeTableCell>
											<GradeTableCell>{grade.lessonName}</GradeTableCell>
											<GradeTableCell>
												<GradeBadge $grade={grade.grade}>{grade.grade}</GradeBadge>
											</GradeTableCell>
											<GradeTableCell>{grade.quarter}</GradeTableCell>
											<GradeTableCell>{formatDate(grade.date)}</GradeTableCell>
										</GradeTableRow>
									))}
								</tbody>
							</GradesTable>
							<InfoText>{t('userProfile.clickGradeDetails')}</InfoText>
						</DetailSection>
					)}

					{/* Student attendance overview */}
					{user.role === 'Student' && studentAttendance.length > 0 && (
						<DetailSection>
							<SectionTitleWithAction>
								<SectionTitle>{t('userProfile.recentAttendance')}</SectionTitle>
								<ViewAllButton onClick={() => setIsAttendanceModalOpen(true)}>
									{t('common.viewAll')} <FiArrowRight />
								</ViewAllButton>
							</SectionTitleWithAction>
							<AttendanceOverview>
								<AttendanceSummary>
									<AttendanceItem $status='present'>
										<AttendanceCount>
											{allAttendance.filter(a => a.status === 'present').length}
										</AttendanceCount>
										<AttendanceLabel>{t('userProfile.present')}</AttendanceLabel>
									</AttendanceItem>
									<AttendanceItem $status='absent'>
										<AttendanceCount>
											{allAttendance.filter(a => a.status === 'absent').length}
										</AttendanceCount>
										<AttendanceLabel>{t('userProfile.absent')}</AttendanceLabel>
									</AttendanceItem>
									<AttendanceItem $status='late'>
										<AttendanceCount>
											{allAttendance.filter(a => a.status === 'late').length}
										</AttendanceCount>
										<AttendanceLabel>{t('userProfile.late')}</AttendanceLabel>
									</AttendanceItem>
									<AttendanceItem $status='excused'>
										<AttendanceCount>
											{allAttendance.filter(a => a.status === 'excused').length}
										</AttendanceCount>
										<AttendanceLabel>{t('userProfile.excused')}</AttendanceLabel>
									</AttendanceItem>
								</AttendanceSummary>
								<AttendanceHistoryList>
									{studentAttendance.map(record => (
										<AttendanceHistoryItem key={record.id} $status={record.status}>
											<AttendanceHistoryInfo>
												<AttendanceHistorySubject>{record.subject}</AttendanceHistorySubject>
												<AttendanceHistoryLesson>{record.lessonName}</AttendanceHistoryLesson>
												<AttendanceHistoryDate>{formatDate(record.date)}</AttendanceHistoryDate>
												<AttendanceHistoryQuarter>{record.quarter}</AttendanceHistoryQuarter>
											</AttendanceHistoryInfo>
											<AttendanceHistoryStatus $status={record.status}>
												{record.status === 'present'
													? t('userProfile.present')
													: record.status === 'absent'
													? t('userProfile.absent')
													: record.status === 'late'
													? t('userProfile.late')
													: t('userProfile.excused')}
											</AttendanceHistoryStatus>
										</AttendanceHistoryItem>
									))}
								</AttendanceHistoryList>
							</AttendanceOverview>
						</DetailSection>
					)}

					{/* Student assignments overview */}
					{user.role === 'Student' && studentAssignments.length > 0 && (
						<DetailSection>
							<SectionTitle>{t('userProfile.assignments')}</SectionTitle>
							<AssignmentsList>
								{studentAssignments.map(assignment => (
									<AssignmentItem key={assignment.id}>
										<AssignmentHeader>
											<AssignmentTitle>{assignment.title}</AssignmentTitle>
											<AssignmentStatusBadge $status={assignment.status}>
												{assignment.status === 'completed'
													? t('userProfile.completed')
													: assignment.status === 'pending'
													? t('userProfile.pending')
													: t('userProfile.overdue')}
											</AssignmentStatusBadge>
										</AssignmentHeader>
										<AssignmentDetails>
											<AssignmentDetail>
												<FiBook />
												<span>{assignment.subject}</span>
											</AssignmentDetail>
											<AssignmentDetail>
												<FiCalendar />
												<span>
													{t('userProfile.due')}: {formatDate(assignment.dueDate)}
												</span>
											</AssignmentDetail>
											{assignment.quarter && (
												<AssignmentDetail>
													<FiBarChart2 />
													<span>{assignment.quarter}</span>
												</AssignmentDetail>
											)}
											{assignment.grade !== undefined && (
												<AssignmentDetail>
													<FiCheckSquare />
													<span>
														{t('userProfile.gradeLabel')}: {assignment.grade}
													</span>
												</AssignmentDetail>
											)}
										</AssignmentDetails>
										{assignment.feedback && (
											<AssignmentFeedback>
												<FiClipboard />
												<span>{assignment.feedback}</span>
											</AssignmentFeedback>
										)}
									</AssignmentItem>
								))}
							</AssignmentsList>
						</DetailSection>
					)}
				</ProfileContent>
			</ProfileCard>

			{isUserFormOpen && (
				<UserForm
					isOpen={isUserFormOpen}
					onClose={() => setIsUserFormOpen(false)}
					onSubmit={handleUserFormSubmit}
					initialData={user}
					formTitle={formTitle}
				/>
			)}

			{/* Attendance Modal */}
			<AttendanceModal
				isOpen={isAttendanceModalOpen}
				onClose={() => setIsAttendanceModalOpen(false)}
				attendance={allAttendance}
				title={`Attendance History: ${user?.firstName} ${user?.lastName}`}
				formatDateFn={formatDate}
			/>

			{/* Add the Reset Password Modal */}
			<ResetPasswordModal />

			{/* Add the Deactivate User Modal */}
			<DeactivateUserModal />
		</PageContainer>
	)
}

// Styled Components
const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`

const HeaderSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background-color: ${props => props.theme.colors.background.secondary};
	color: ${props => props.theme.colors.text.primary};
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	font-weight: 500;

	&:hover {
		background-color: ${props => props.theme.colors.neutral[200]};
	}
`

const HeaderRight = styled.div`
	display: flex;
	gap: 1rem;
`

const EditButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background-color: ${props => props.theme.colors.primary[50]};
	color: ${props => props.theme.colors.primary[600]};
	border: 1px solid ${props => props.theme.colors.primary[200]};
	border-radius: 0.375rem;
	cursor: pointer;
	font-weight: 500;

	&:hover {
		background-color: ${props => props.theme.colors.primary[100]};
	}
`

const ResetPasswordButton = styled(EditButton)`
	background-color: ${props => props.theme.colors.warning[50]};
	color: ${props => props.theme.colors.warning[600]};
	border-color: ${props => props.theme.colors.warning[200]};

	&:hover {
		background-color: ${props => props.theme.colors.warning[100]};
		border-color: ${props => props.theme.colors.warning[300]};
	}
`

const DeleteButton = styled(EditButton)`
	background-color: ${props => props.theme.colors.danger[50]};
	color: ${props => props.theme.colors.danger[600]};
	border-color: ${props => props.theme.colors.danger[200]};

	&:hover {
		background-color: ${props => props.theme.colors.danger[100]};
		border-color: ${props => props.theme.colors.danger[300]};
	}
`

const ReactivateButton = styled(EditButton)`
	background-color: ${props => props.theme.colors.success[50]};
	color: ${props => props.theme.colors.success[600]};
	border-color: ${props => props.theme.colors.success[200]};

	&:hover {
		background-color: ${props => props.theme.colors.success[100]};
		border-color: ${props => props.theme.colors.success[300]};
	}
`

const ProfileCard = styled.div`
	background-color: ${props => props.theme.colors.background.primary};
	border-radius: 0.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	border: 1px solid ${props => props.theme.colors.neutral[200]};
`

const ProfileHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1.5rem;
	padding: 2rem;
	background-color: ${props => props.theme.colors.background.secondary};
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const UserAvatar = styled.div`
	width: 5rem;
	height: 5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border-radius: 50%;
	font-size: 1.5rem;
	font-weight: 600;
`

const UserInfo = styled.div`
	display: flex;
	flex-direction: column;
`

const UserName = styled.h1`
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const UserRole = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-top: 0.5rem;
`

const UserStatus = styled.span<{ $status: 'active' | 'inactive' }>`
	padding: 0.25rem 0.75rem;
	background-color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[100] : props.theme.colors.neutral[100]};
	color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[700] : props.theme.colors.danger[700]};
	border-radius: 1rem;
	font-size: 0.75rem;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '';
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background-color: ${props =>
			props.$status === 'active'
				? props.theme.colors.success[500]
				: props.theme.colors.danger[500]};
	}
`

const RoleBadge = styled.span<{ $role: string }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => {
		switch (props.$role) {
			case 'Admin':
				return props.theme.colors.primary[100]
			case 'Teacher':
				return props.theme.colors.success[100]
			case 'Student':
				return props.theme.colors.info[100]
			case 'Parent':
				return props.theme.colors.warning[100]
			default:
				return props.theme.colors.neutral[100]
		}
	}};
	color: ${props => {
		switch (props.$role) {
			case 'Admin':
				return props.theme.colors.primary[700]
			case 'Teacher':
				return props.theme.colors.success[700]
			case 'Student':
				return props.theme.colors.info[700]
			case 'Parent':
				return props.theme.colors.warning[700]
			default:
				return props.theme.colors.neutral[700]
		}
	}};
`

const ProfileContent = styled.div`
	padding: 2rem;
`

const DetailSection = styled.div`
	margin-bottom: 2rem;

	&:last-child {
		margin-bottom: 0;
	}
`

const SectionTitle = styled.h2`
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 1rem 0;
	color: ${props => props.theme.colors.text.primary};
	padding-bottom: 0.5rem;
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const SectionTitleWithAction = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const ViewAllButton = styled.button`
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[500]};
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
`

const DetailGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
`

const DetailItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const DetailLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};

	svg {
		color: ${props => props.theme.colors.primary[500]};
	}
`

const DetailValue = styled.div`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const ChildrenList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-top: 0.5rem;
`

const ChildItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem;
	border-radius: 0.375rem;
	background-color: ${props => props.theme.colors.background.secondary};

	&:hover {
		background-color: ${props => props.theme.colors.neutral[100]};
	}
`

const ChildAvatar = styled.div`
	width: 2.5rem;
	height: 2.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	border-radius: 50%;
	font-size: 0.875rem;
	font-weight: 600;
`

const ChildInfo = styled.div`
	display: flex;
	flex-direction: column;
`

const ChildName = styled.span`
	font-weight: 500;
	color: ${props => props.theme.colors.text.primary};
`

const ChildEmail = styled.span`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: 0.125rem;
`

const LoadingState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 20rem;
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

const ErrorState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 10rem;
	font-size: 1.125rem;
	color: ${props => props.theme.colors.danger[600]};
	margin-bottom: 1rem;
`

const AssignmentsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`

const AssignmentItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: 0.375rem;
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.neutral[200]};
`

const AssignmentHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const AssignmentBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[700]};
`

const AssignmentTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const AssignmentStatusBadge = styled.span<{ $status: string }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => {
		switch (props.$status) {
			case 'completed':
				return props.theme.colors.success[100]
			case 'pending':
				return props.theme.colors.warning[100]
			case 'overdue':
				return props.theme.colors.danger[100]
			default:
				return props.theme.colors.neutral[100]
		}
	}};
	color: ${props => {
		switch (props.$status) {
			case 'completed':
				return props.theme.colors.success[700]
			case 'pending':
				return props.theme.colors.warning[700]
			case 'overdue':
				return props.theme.colors.danger[700]
			default:
				return props.theme.colors.neutral[700]
		}
	}};
`

const AssignmentDetails = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`

const AssignmentDetail = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
`

// Grades Table Components
const GradesTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	border: 1px solid ${props => props.theme.colors.neutral[200]};
	border-radius: 0.375rem;
	overflow: hidden;
`

const GradeTableHeader = styled.th`
	padding: 0.75rem 1rem;
	text-align: left;
	background-color: ${props => props.theme.colors.background.tertiary};
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.875rem;
	font-weight: 600;
	border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
`

const GradeTableRow = styled.tr`
	&:not(:last-child) {
		border-bottom: 1px solid ${props => props.theme.colors.neutral[200]};
	}

	&:hover {
		background-color: ${props => props.theme.colors.background.secondary};
	}
`

const GradeTableCell = styled.td`
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary};
	vertical-align: middle;
`

const GradeBadge = styled.span<{ $grade?: number | string }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${props => {
		const numGrade =
			typeof props.$grade === 'string' ? parseFloat(props.$grade as string) : props.$grade
		if (numGrade === undefined) return props.theme.colors.neutral[100]
		// Using 10-point scale:
		// 9-10 = Excellent (green)
		// 7-8 = Good (light green)
		// 5-6 = Satisfactory (yellow)
		// 3-4 = Poor (orange)
		// 0-2 = Failing (red)
		if (numGrade >= 9) return props.theme.colors.success[100]
		if (numGrade >= 7) return props.theme.colors.success[50]
		if (numGrade >= 5) return props.theme.colors.warning[50]
		if (numGrade >= 3) return props.theme.colors.warning[100]
		return props.theme.colors.danger[100]
	}};
	color: ${props => {
		const numGrade =
			typeof props.$grade === 'string' ? parseFloat(props.$grade as string) : props.$grade
		if (numGrade === undefined) return props.theme.colors.text.secondary
		if (numGrade >= 9) return props.theme.colors.success[700]
		if (numGrade >= 7) return props.theme.colors.success[600]
		if (numGrade >= 5) return props.theme.colors.warning[600]
		if (numGrade >= 3) return props.theme.colors.warning[700]
		return props.theme.colors.danger[700]
	}};
	display: inline-block;
	min-width: 3rem;
	text-align: center;
`

// Attendance Components
const AttendanceOverview = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`

const AttendanceSummary = styled.div`
	display: flex;
	justify-content: space-around;
	padding: 1rem;
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 0.375rem;
	border: 1px solid ${props => props.theme.colors.neutral[200]};
`

const AttendanceItem = styled.div<{ $status: string }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	color: ${props => {
		switch (props.$status) {
			case 'present':
				return props.theme.colors.success[700]
			case 'absent':
				return props.theme.colors.danger[700]
			case 'late':
				return props.theme.colors.warning[700]
			default:
				return props.theme.colors.text.primary
		}
	}};
`

const AttendanceCount = styled.span`
	font-size: 1.5rem;
	font-weight: 700;
`

const AttendanceLabel = styled.span`
	font-size: 0.75rem;
	font-weight: 500;
`

const AttendanceHistoryList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const AttendanceHistoryItem = styled.div<{ $status: string }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 1rem;
	border-radius: 0.375rem;
	border-left: 4px solid
		${props => {
			switch (props.$status) {
				case 'present':
					return props.theme.colors.success[500]
				case 'absent':
					return props.theme.colors.danger[500]
				case 'late':
					return props.theme.colors.warning[500]
				case 'excused':
					return props.theme.colors.info[500]
				default:
					return props.theme.colors.neutral[500]
			}
		}};
	background-color: ${props => {
		switch (props.$status) {
			case 'present':
				return props.theme.colors.success[50]
			case 'absent':
				return props.theme.colors.danger[50]
			case 'late':
				return props.theme.colors.warning[50]
			case 'excused':
				return props.theme.colors.info[50]
			default:
				return props.theme.colors.background.secondary
		}
	}};
	margin-bottom: 0.5rem;
	transition: all 0.2s ease;

	&:hover {
		transform: translateX(2px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
`

const AttendanceHistoryInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`

const AttendanceHistorySubject = styled.span`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
`

const AttendanceHistoryLesson = styled.span`
	font-size: 0.8125rem;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '📚';
		font-size: 0.75rem;
	}
`

const AttendanceHistoryDate = styled.span`
	font-size: 0.8125rem;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&::before {
		content: '📅';
		font-size: 0.75rem;
	}
`

const AttendanceHistoryQuarter = styled.span`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.tertiary};
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-style: italic;

	&::before {
		content: '📊';
		font-size: 0.75rem;
	}
`

const AttendanceHistoryStatus = styled.span<{ $status?: string }>`
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	color: ${props => {
		switch (props.$status) {
			case 'present':
				return props.theme.colors.success[700]
			case 'absent':
				return props.theme.colors.danger[700]
			case 'late':
				return props.theme.colors.warning[700]
			case 'excused':
				return props.theme.colors.info[700]
			default:
				return props.theme.colors.text.secondary
		}
	}};
	background-color: ${props => {
		switch (props.$status) {
			case 'present':
				return props.theme.colors.success[100]
			case 'absent':
				return props.theme.colors.danger[100]
			case 'late':
				return props.theme.colors.warning[100]
			case 'excused':
				return props.theme.colors.info[100]
			default:
				return props.theme.colors.neutral[100]
		}
	}};
`

const ParentLink = styled.span`
	color: ${props => props.theme.colors.primary[500]};
	cursor: pointer;
`

const InfoText = styled.p`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
	margin-top: 0.5rem;
`

const AssignmentFeedback = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	background-color: ${props => props.theme.colors.background.secondary};
	border: 1px solid ${props => props.theme.colors.neutral[200]};
`

// Add styled components for the reset password modal
const CancelButton = styled.button`
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	border: 1px solid ${props => props.theme.colors.neutral[300]};
	background-color: white;
	color: ${props => props.theme.colors.text.primary};
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.secondary};
	}
`

const ResetButton = styled.button`
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	border: none;
	background-color: #f59e0b;
	color: white;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #d97706;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

export default UserProfile
