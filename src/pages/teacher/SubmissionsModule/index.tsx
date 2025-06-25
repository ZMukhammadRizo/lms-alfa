import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiBookOpen, FiClipboard, FiLayers, FiUsers } from 'react-icons/fi'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { getClassInfo } from '../../../services/submissionsService'
import useSubmissionsStore from '../../../store/submissionsStore'
import ClassSelect from './ClassSelect'
import ClassesList from './ClassesList'
import LevelSelect from './LevelSelect'
import StudentSelect from './StudentSelect'
import StudentSubmissions from './StudentSubmissions'

interface Breadcrumb {
	name: string
	path: string
	icon: React.ReactNode
}

interface BreadcrumbItemProps {
	$isCurrent: boolean
}

const SubmissionsModule: React.FC = () => {
	const { t } = useTranslation()
	const location = useLocation()
	const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
	const submissionsStore = useSubmissionsStore()

	// Define breadcrumb structure based on route
	useEffect(() => {
		async function getBreadcrumbs() {
			const path = location.pathname
			const parts = path.split('/').filter(part => part)

			const newBreadcrumbs: Breadcrumb[] = [
				{ name: t('submissions.title'), path: '/teacher/submissions', icon: <FiClipboard /> },
			]

			// Check if we're in levels-based navigation
			if (parts.includes('levels')) {
				const levelIndex = parts.indexOf('levels')
				const levelId = parts[levelIndex + 1]

				if (levelId) {
					// Add level breadcrumb
					const levelName = getLevelName(levelId)
					if (levelName) {
						newBreadcrumbs.push({
							name: levelName,
							path: `/teacher/submissions/levels/${levelId}/classes`,
							icon: <FiLayers />,
						})
					}

					// Check if we're viewing classes under a level
					if (parts.includes('classes')) {
						const classIndex = parts.indexOf('classes')
						const classId = parts[classIndex + 1]

						if (classId) {
							// Add class breadcrumb
							const className =
								(await getClassName(classId)) || `${t('submissions.class')} ${classId}`
							newBreadcrumbs.push({
								name: className,
								path: `/teacher/submissions/levels/${levelId}/classes/${classId}/students`,
								icon: <FiUsers />,
							})

							// Check if we're viewing a specific student
							if (parts.includes('students')) {
								const studentIndex = parts.indexOf('students')
								const studentId = parts[studentIndex + 1]

								if (studentId) {
									const studentName = getStudentName(studentId)
									newBreadcrumbs.push({
										name: studentName,
										path: `/teacher/submissions/levels/${levelId}/classes/${classId}/students/${studentId}`,
										icon: <FiBookOpen />,
									})
								}
							}
						}
					}
				}
			}
			// Check if we're in direct classes navigation
			else if (parts.includes('classes')) {
				const classIndex = parts.indexOf('classes')
				const classId = parts[classIndex + 1]

				if (classId) {
					// Add class breadcrumb for direct class route
					const className = (await getClassName(classId)) || `${t('submissions.class')} ${classId}`
					newBreadcrumbs.push({
						name: className,
						path: `/teacher/submissions/classes/${classId}/students`,
						icon: <FiUsers />,
					})

					// Check if we're viewing a specific student in direct class route
					if (parts.includes('students')) {
						const studentIndex = parts.indexOf('students')
						const studentId = parts[studentIndex + 1]

						if (studentId) {
							const studentName = getStudentName(studentId)
							newBreadcrumbs.push({
								name: studentName,
								path: `/teacher/submissions/classes/${classId}/students/${studentId}`,
								icon: <FiBookOpen />,
							})
						}
					}
				}
			}

			setBreadcrumbs(newBreadcrumbs)
		}

		getBreadcrumbs()
	}, [location, submissionsStore.levels, submissionsStore.classes, submissionsStore.students, t])

	// Load necessary data when the component mounts or path changes
	useEffect(() => {
		const loadData = async () => {
			try {
				const path = location.pathname
				const parts = path.split('/').filter(part => part)

				// Always fetch levels first to ensure breadcrumb data is available
				await submissionsStore.fetchTeacherLevels()

				// Parse the path to determine what additional data to load
				if (parts.includes('levels')) {
					const levelIndex = parts.indexOf('levels')
					const levelId = parts[levelIndex + 1]

					if (levelId) {
						// If we're viewing classes under a specific level
						if (parts.includes('classes')) {
							await submissionsStore.fetchTeacherLevelClasses(levelId)

							// If we're viewing students in a specific class
							const classIndex = parts.indexOf('classes')
							const classId = parts[classIndex + 1]
							if (classId) {
								await submissionsStore.fetchClassStudents(classId)
							}
						}
					}
				} else if (parts.includes('classes') && !parts.includes('levels')) {
					// Direct classes route - fetch all teacher classes
					await submissionsStore.fetchTeacherClasses()

					// If viewing students in a specific class
					const classIndex = parts.indexOf('classes')
					const classId = parts[classIndex + 1]
					if (classId) {
						await submissionsStore.fetchClassStudents(classId)
					}
				}
			} catch (error) {
				console.error('Error loading SubmissionsModule data:', error)
			}
		}

		loadData()
	}, [location.pathname])

	// Helper functions
	const getLevelName = (levelId: string): string => {
		if (!levelId) return ''

		// Find level name from store
		const level = submissionsStore.levels.find(level => level.levelId === levelId)
		if (level?.levelName) {
			return level.levelName
		}

		// Fallback to a readable format
		return `${t('submissions.grade')} ${levelId}`
	}

	const getClassName = async (classId: string): Promise<string> => {
		if (!classId) return ''

		// Find class name from store
		const classItem = submissionsStore.classes.find(c => c.classId === classId)

		if (classItem?.classname) {
			return classItem.classname
		}

		// If class not found in store, try to fetch it directly
		try {
			const classInfo = await getClassInfo(classId)
			return classInfo?.name || `${t('submissions.class')} ${classId}`
		} catch (error) {
			console.error('Error fetching class info:', error)
			return `${t('submissions.class')} ${classId}`
		}
	}

	const getStudentName = (studentId: string): string => {
		if (!studentId) return ''

		// Use the store to get student information
		const student = submissionsStore.students.find(s => s.studentId === studentId)
		return student?.fullName || `${t('submissions.student')} ${studentId}`
	}

	return (
		<ModuleContainer>
			<NavigationBreadcrumbs>
				<AnimatePresence mode='wait'>
					<BreadcrumbsContainer
						key={location.pathname}
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={{ duration: 0.3 }}
					>
						{breadcrumbs.map((crumb, index) => (
							<React.Fragment key={crumb.path}>
								{index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
								<BreadcrumbItem to={crumb.path} $isCurrent={index === breadcrumbs.length - 1}>
									<BreadcrumbIcon>{crumb.icon}</BreadcrumbIcon>
									<span>{crumb.name}</span>
								</BreadcrumbItem>
							</React.Fragment>
						))}
					</BreadcrumbsContainer>
				</AnimatePresence>
			</NavigationBreadcrumbs>

			<ModuleContent>
				<Routes>
					{/* Default route redirects to the levels list */}
					<Route path='/' element={<Navigate to='levels' replace />} />

					{/* Level-based navigation (grouped by grade levels) */}
					<Route path='levels' element={<LevelSelect />} />
					<Route path='levels/:levelId/classes' element={<ClassSelect />} />
					<Route path='levels/:levelId/classes/:classId/students' element={<StudentSelect />} />
					<Route
						path='levels/:levelId/classes/:classId/students/:studentId'
						element={<StudentSubmissions />}
					/>

					{/* Direct class navigation (teacher's assigned classes without level grouping) */}
					<Route path='classes' element={<ClassesList />} />
					<Route path='classes/:classId/students' element={<StudentSelect />} />
					<Route path='classes/:classId/students/:studentId' element={<StudentSubmissions />} />
				</Routes>
			</ModuleContent>
		</ModuleContainer>
	)
}

// Styled Components
const ModuleContainer = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100%;
	width: 100%;
	background-color: ${props => props.theme.colors.background.lighter};
`

const NavigationBreadcrumbs = styled.div`
	background: ${props => props.theme.colors.background.secondary};
	padding: 16px 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	position: sticky;
	top: 0;
	z-index: ${props => props.theme.zIndices.docked};
`

const BreadcrumbsContainer = styled(motion.div)`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
`

const BreadcrumbItem = styled(Link)<BreadcrumbItemProps>`
	display: inline-flex;
	align-items: center;
	font-size: 0.95rem;
	color: ${props =>
		props.$isCurrent ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
	text-decoration: none;
	font-weight: ${props => (props.$isCurrent ? '600' : '400')};
	padding: 4px 8px;
	border-radius: 6px;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
		color: ${props => props.theme.colors.primary[600]};
	}
`

const BreadcrumbIcon = styled.span`
	display: inline-flex;
	align-items: center;
	margin-right: 6px;
	font-size: 1rem;
`

const BreadcrumbSeparator = styled.span`
	color: ${props => props.theme.colors.text.tertiary};
	font-size: 0.8rem;
	margin: 0 2px;
`

const ModuleContent = styled.div`
	flex: 1;
	padding: 16px 0;
`

export default SubmissionsModule
