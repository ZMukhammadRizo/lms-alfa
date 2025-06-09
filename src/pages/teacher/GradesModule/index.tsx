import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FiBookOpen, FiClipboard, FiLayers, FiUsers } from 'react-icons/fi'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import useGradesStore from '../../../store/gradesStore'
import ClassSelect from './ClassSelect'
import ClassesList from './ClassesList' // New component for direct class list
import GradeLevelSelect from './GradeLevelSelect'
import GradesJournal from './GradesJournal'
import SubjectSelect from './SubjectSelect'
import { getClassInfo } from '../../../services/gradesService'

interface Breadcrumb {
	name: string
	path: string
	icon: React.ReactNode
}

const GradesModule: React.FC = () => {
	const { t } = useTranslation()
	const location = useLocation()
	const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
	const gradesStore = useGradesStore()

	// Define breadcrumb structure based on route
	useEffect(() => {
		async function getBreadcrumbs() {
			const path = location.pathname
			const parts = path.split('/').filter(part => part)

			const newBreadcrumbs: Breadcrumb[] = [
				{ name: t('navigation.grades'), path: '/teacher/grades', icon: <FiClipboard /> },
			]

			// Levels route
			if (parts.includes('levels') && parts.length > 3) {
				const gradeLevel = parts[parts.indexOf('levels') + 1]

				// Get the level name from store if available
				const levelName =
					getLevelName(gradeLevel) || `${gradeLevel}${getOrdinalSuffix(Number(gradeLevel))} ${t('teacherGrades.grade')}`

				newBreadcrumbs.push({
					name: levelName,
					path: `/teacher/grades/levels/${gradeLevel}/classes`,
					icon: <FiLayers />,
				})
			}

			// Direct class route
			if (parts.includes('classes') && !parts.includes('levels') && parts.length > 3) {
				const classId = parts[parts.indexOf('classes') + 1]

				// Get class name from store if available
				const className = (await getClassName(classId)) || `${t('teacherGrades.class')} ${classId.toUpperCase()}`

				newBreadcrumbs.push({
					name: className,
					path: `/teacher/grades/classes/${classId}`,
					icon: <FiUsers />,
				})
			}

			// Classes under levels route
			if (parts.includes('levels') && parts.includes('classes') && parts.length > 5) {
				const gradeLevel = parts[parts.indexOf('levels') + 1]
				const classId = parts[parts.indexOf('classes') + 1]

				// Get class name from store if available
				const className = (await getClassName(classId)) || `${t('teacherGrades.class')} ${classId.toUpperCase()}`

				newBreadcrumbs.push({
					name: className,
					path: `/teacher/grades/levels/${gradeLevel}/classes/${classId}/subjects`,
					icon: <FiUsers />,
				})
			}

			// Subjects route - for both approaches
			if (parts.includes('subjects') && parts.length > (parts.includes('levels') ? 7 : 5)) {
				const subjectId = parts[parts.indexOf('subjects') + 1]
				const subjectName = getSubjectName(subjectId)

				if (parts.includes('levels')) {
					const gradeLevel = parts[parts.indexOf('levels') + 1]
					const classId = parts[parts.indexOf('classes') + 1]
					newBreadcrumbs.push({
						name: subjectName,
						path: `/teacher/grades/levels/${gradeLevel}/classes/${classId}/subjects/${subjectId}`,
						icon: <FiBookOpen />,
					})
				} else {
					const classId = parts[parts.indexOf('classes') + 1]
					newBreadcrumbs.push({
						name: subjectName,
						path: `/teacher/grades/classes/${classId}/subjects/${subjectId}`,
						icon: <FiBookOpen />,
					})
				}
			}

			setBreadcrumbs(newBreadcrumbs)
		}

		getBreadcrumbs()
	}, [location, gradesStore.levels, gradesStore.classes, gradesStore.subjects])

	// Load necessary data when the component mounts
	useEffect(() => {
		const loadData = async () => {
			console.log('GradesModule: Loading initial data...')
			try {
				console.log('Fetching teacher levels...')
				await gradesStore.fetchTeacherLevels()
				console.log('Fetched levels:', gradesStore.levels)

				const path = location.pathname
				const parts = path.split('/').filter(part => part)

				// Only fetch all classes if we're on the main classes route and not on a level-specific route
				if (parts.includes('classes') && !parts.includes('levels')) {
					console.log('Fetching all teacher classes for main classes view...')
					await gradesStore.fetchTeacherClasses()
					console.log('Fetched classes:', gradesStore.classes)
				}

				// If we're looking at a specific class, load its subjects
				if (parts.includes('classes')) {
					const classIndex = parts.indexOf('classes')
					if (classIndex < parts.length - 1) {
						const classId = parts[classIndex + 1]
						console.log('Fetching subjects for class:', classId)
						await gradesStore.fetchClassSubjects(classId)
						console.log('Fetched subjects:', gradesStore.subjects)
					}
				}
			} catch (error) {
				console.error('Error loading GradesModule data:', error)
			}
		}

		loadData()
	}, [location.pathname])

	// Helper functions
	const getOrdinalSuffix = (n: number): string => {
		if (n > 3 && n < 21) return 'th'
		switch (n % 10) {
			case 1:
				return 'st'
			case 2:
				return 'nd'
			case 3:
				return 'rd'
			default:
				return 'th'
		}
	}

	const getLevelName = (levelId: string): string => {
		// Find level name from store
		const level = gradesStore.levels.find(level => level.levelId === levelId)
		return level ? level.levelName : ''
	}

	const getClassName = async (classId: string): Promise<string> => {
		// Find class name from store
		const classItem = gradesStore.classes.find(c => c.classId === classId)

		if (!classItem) {
			// If class not found in store, fetch it directly
			const classInfo = await getClassInfo(classId)
			return classInfo.name || ''
		}

		return classItem ? classItem.classname : ''
	}

	const getSubjectName = (subjectId: string): string => {
		// Use the store to get subject information
		const subject = gradesStore.subjects.find(s => s.subjectId === subjectId)
		return subject?.subjectName || `${t('teacherGrades.subject')} ${subjectId}`
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
					{/* Default route redirects to the classes list */}
					<Route path='/' element={<Navigate to='classes' replace />} />

					{/* Level-based navigation (grouped by grade levels) */}
					<Route path='levels' element={<GradeLevelSelect />} />
					<Route path='levels/:gradeLevel/classes' element={<ClassSelect />} />
					<Route path='levels/:gradeLevel/classes/:classId/subjects' element={<SubjectSelect />} />
					<Route
						path='levels/:gradeLevel/classes/:classId/subjects/:subjectId/journal'
						element={<GradesJournal />}
					/>

					{/* Direct class navigation (teacher's assigned classes without level grouping) */}
					<Route path='classes' element={<ClassesList />} />
					<Route path='classes/:classId/subjects' element={<SubjectSelect />} />
					<Route path='classes/:classId/subjects/:subjectId/journal' element={<GradesJournal />} />
				</Routes>
			</ModuleContent>
		</ModuleContainer>
	)
}

interface BreadcrumbItemProps {
	$isCurrent: boolean
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

export default GradesModule
