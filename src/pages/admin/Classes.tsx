import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
// Import permission components
import {
	FiArrowLeft,
	FiBook,
	FiBookOpen,
	FiChevronDown,
	FiChevronRight,
	FiDownload,
	FiEdit,
	FiFilter,
	FiGrid,
	FiLayers,
	FiList,
	FiMapPin,
	FiMoreHorizontal,
	FiPlus,
	FiSearch,
	FiTrash,
	FiTrash2,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
} from 'react-icons/fi'
import Modal from 'react-modal'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import supabase from '../../config/supabaseClient'

// Set the app element for accessibility reasons
Modal.setAppElement('#root')

// Placeholder for withPermissionCheck function
const withPermissionCheck = (
	permissionName: string,
	callbackIfPermitted: () => void,
	callbackIfNotPermitted?: () => void // Make the third argument optional
) => {
	console.warn(
		`withPermissionCheck: Permission check for '${permissionName}' is currently bypassed. Assuming permission is granted.`
	);
	callbackIfPermitted(); // Directly execute the permitted callback
	// Example of how you might handle the not permitted case in a real implementation:
	// if (!hasPermission(permissionName) && callbackIfNotPermitted) {
	//   callbackIfNotPermitted();
	// }
};

// Interfaces
interface Student {
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
	attendance?: number // Added attendance
}

interface Section {
	id: string
	name: string
	room: string
	students: number
	teacher: string
	performance: number
	grade: string
}

interface Class {
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
	sectionCount: number // Add this new property
}

// New Interface for ClassType
interface ClassType {
  id: string;
  name: string;
  created_at: string;
}

// Interface for subject teacher assignments - DEFINED HERE
interface SubjectTeacherAssignment {
	subjectId: string
	subjectName: string
	teacherId: string | null
}

// Helpers
const getPerformanceColor = (percentage: number) => {
	if (percentage >= 85) return '#10b981'
	if (percentage >= 70) return '#f59e0b'
	return '#ef4444'
}

// Helper functions
const formatAttendanceDays = (days: string[]): string => {
	if (!days || days.length === 0) return 'Not scheduled'

	// Create an abbreviation map
	const dayAbbreviations: { [key: string]: string } = {
		Monday: 'Mon',
		Tuesday: 'Tue',
		Wednesday: 'Wed',
		Thursday: 'Thu',
		Friday: 'Fri',
		Saturday: 'Sat',
		Sunday: 'Sun',
	}

	// Get day abbreviations
	const abbreviated = days.map(day => dayAbbreviations[day] || day)

	// Special case: if days are consecutive, use hyphen format
	if (days.length > 2) {
		const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
		const indices = days.map(day => dayOrder.indexOf(day)).sort((a, b) => a - b)

		// Check if indices are consecutive
		let isConsecutive = true
		for (let i = 1; i < indices.length; i++) {
			if (indices[i] !== indices[i - 1] + 1) {
				isConsecutive = false
				break
			}
		}

		if (isConsecutive) {
			return `${dayAbbreviations[dayOrder[indices[0]]]}-${
				dayAbbreviations[dayOrder[indices[indices.length - 1]]]
			}`
		}
	}

	// Default: comma-separated list
	return abbreviated.join(', ')
}

const formatAttendanceTimes = (times: string[]): string => {
	if (!times || times.length === 0) return 'Not scheduled'
	if (times.length === 2) return `${times[0]} - ${times[1]}`
	return times.join(', ')
}

// Styled Components and Interfaces
interface PerformanceBarProps {
	$percentage: number
	$color: string
}

interface SectionPerformanceBarProps {
	$percentage: number
	$color: string
}

interface StatusDotProps {
	$active: boolean
}

interface ClassCardProps {
	$color: string
}

interface ViewButtonProps {
	$isActive: boolean
}

interface StatusProps {
	$status: string
}

interface ActionButtonProps {
	$isPrimary: boolean
}

// Add new interfaces for the modal
interface AddStudentModalProps {
	isOpen: boolean
	onClose: () => void
	onAddStudents: (studentIds: string[]) => void
	classId: string
	excludedStudentIds: string[]
}

interface AvailableStudent {
	id: string
	name: string
	email: string
	role?: string
	selected: boolean
}

// Add new interface for the modal
interface AddSectionModalProps {
	isOpen: boolean
	onClose: () => void
	onAddSection: (sectionName: string, room: string) => void
	grade: string
	suggestedName: string
	suggestedRoom: string
}

// In the Classes component, add these new functions

// Add this after other interface definitions
interface EditSectionModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (sectionId: string, sectionName: string, room: string) => void
	section: Section
}

interface AssignTeacherModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (sectionId: string, teacherName: string, teacherId?: string) => void
	section: Section
}

// Student components
const StudentProfile = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`

const StudentDetails = styled.div`
	display: flex;
	flex-direction: column;
`

const StudentEmail = styled.span`
	color: #6b7280;
	font-size: 0.75rem;
	margin-top: 0.125rem;
`

const StudentName = styled.h3`
	margin: 0;
	color: #111827;
	font-size: 16px;
	font-weight: 600;
`

const StudentAvatar = styled.div`
	width: 40px;
	height: 40px;
	background-color: #7c3aed;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 14px;
`

// Course Tags
const CourseTags = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`

const CourseTag = styled.span`
	background-color: #eef2ff;
	color: #4f46e5;
	font-size: 12px;
	font-weight: 500;
	padding: 6px 12px;
	border-radius: 4px;
`

// Performance Elements
const PerformanceWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
	width: 100%;
`

const PercentageValue = styled.span`
	font-weight: 600;
	color: #111827;
`

const PerformanceBar = styled.div`
	width: 100%;
	height: 6px;
	background-color: #f3f4f6;
	border-radius: 9999px;
	overflow: hidden;
`

const PerformanceFill = styled.div<PerformanceBarProps>`
	width: ${props => `${props.$percentage}%`};
	height: 100%;
	background-color: ${props => props.$color};
	border-radius: 9999px;
`

// Status Indicator
const StatusIndicator = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`

const StatusDot = styled.span<StatusDotProps>`
	display: inline-block;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${props => (props.$active ? '#10b981' : '#ef4444')};
`

// Action Buttons
const StudentActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
`

const ActionIconButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	padding: 6px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #f3f4f6;
		color: #4f46e5;
	}

	svg {
		width: 18px;
		height: 18px;
	}
`

// Students view components
const StudentsView = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`

const StudentsControls = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 16px;
`

const StudentsFilterGroup = styled.div`
	display: flex;
	gap: 0.75rem;
`

const FilterButton = styled.button<{ $isActive?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background-color: ${props => (props.$isActive ? '#f3f4f6' : '#f9fafb')};
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	padding: 0.5rem 1rem;
	font-size: 0.875rem;
	color: ${props => (props.$isActive ? '#4338ca' : '#374151')};
	cursor: pointer;
	position: relative;

	&:hover {
		background-color: #f3f4f6;
	}

	svg {
		width: 1rem;
		height: 1rem;
	}
`

const CourseFilterButton = styled(FilterButton)``

const FilterDropdownMenu = styled.div<{ $isCourse?: boolean }>`
	position: absolute;
	top: 100%;
	right: ${props => (props.$isCourse ? '0' : 'auto')};
	left: ${props => (props.$isCourse ? 'auto' : '0')};
	margin-top: 4px;
	background-color: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	z-index: 50;
	width: ${props => (props.$isCourse ? '180px' : '150px')};
	max-height: 250px;
	overflow-y: auto;
`

const FilterOption = styled.div<{ $isActive: boolean }>`
	padding: 8px 16px;
	font-size: 14px;
	color: ${props => (props.$isActive ? '#4338ca' : '#374151')};
	background-color: ${props => (props.$isActive ? '#eef2ff' : 'white')};
	cursor: pointer;

	&:hover {
		background-color: ${props => (props.$isActive ? '#eef2ff' : '#f9fafb')};
	}

	&:first-child {
		border-top-left-radius: 8px;
		border-top-right-radius: 8px;
	}

	&:last-child {
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
	}
`

const StudentsTable = styled.div`
	width: 100%;
	background-color: white;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

const StudentsTableHeader = styled.div`
	display: flex;
	background-color: white;
	border-bottom: 1px solid #e5e7eb;
	padding: 20px 16px;
`

const StudentsTableHeaderCell = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-weight: 600;
	font-size: 14px;
	color: #6b7280;
	padding: 0 8px;

	svg {
		width: 16px;
		height: 16px;
		color: #9ca3af;
	}
`

const StudentsTableBody = styled.div`
	max-height: 600px;
	overflow-y: auto;
`

const StudentsTableRow = styled.div`
	display: flex;
	padding: 18px 16px;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: #f9fafb;
	}
`

const StudentsTableCell = styled.div`
	display: flex;
	align-items: center;
	font-size: 14px;
	color: #374151;
	padding: 0 8px;
`

// Main container and headers
const ClassesContainer = styled.div`
	padding: 24px;
	max-width: 1600px;
	margin: 0 auto;
`

const HeaderSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
`

const PageTitle = styled.h1`
	font-size: 28px;
	font-weight: 700;
	color: #111827;
	margin: 0;
`

const PageTitleWithBack = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background: none;
	border: none;
	color: #4f46e5;
	font-weight: 500;
	cursor: pointer;
	padding: 0;
	transition: all 0.2s;

	&:hover {
		opacity: 0.8;
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

const PageDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 4px 0 0;
`

const AddClassButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #4f46e5;
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #4338ca;
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

const ExportDataButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #f9fafb;
	color: #374151;
	border: 1px solid #e5e7eb;
	padding: 10px 16px;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #f3f4f6;
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

// Filters and search
const FiltersContainer = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 24px;
`

const SearchAndFilters = styled.div`
	display: flex;
	gap: 10px;
	flex: 1;
`

const SearchContainer = styled.div`
	display: flex;
	align-items: center;
	background-color: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 0 12px;
	flex: 1;
	max-width: 400px;

	svg {
		color: #9ca3af;
		width: 18px;
		height: 18px;
	}
`

const SearchInput = styled.input`
	border: none;
	padding: 10px 12px;
	font-size: 14px;
	width: 100%;
	outline: none;

	&::placeholder {
		color: #9ca3af;
	}
`

const FilterDropdown = styled.div`
	select {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 14px;
		background-color: white;
		cursor: pointer;
		min-width: 150px;

		&:focus {
			outline: none;
			border-color: #a5b4fc;
			box-shadow: 0 0 0 3px rgba(165, 180, 252, 0.5);
		}
	}
`

const ViewToggle = styled.div`
	display: flex;
	background-color: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden;
`

const ViewButton = styled.button<ViewButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px 12px;
	border: none;
	background-color: ${props => (props.$isActive ? '#f3f4f6' : 'white')};
	color: ${props => (props.$isActive ? '#4F46E5' : '#6B7280')};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: ${props => (props.$isActive ? '#f3f4f6' : '#f9fafb')};
	}

	svg {
		width: 18px;
		height: 18px;
	}
`

// Students header section
const StudentsHeaderSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 24px;
`

// Sections Component
interface SectionsProps {
	sections: Section[]
	searchTerm: string
	grade: string
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onViewStudents: (grade: string, section: string | null) => void
	onBackToGrades: () => void
	onCreateNewSection?: () => void
	onEditSection?: (section: Section) => void
	onAssignTeacher?: (section: Section) => void
	onDeleteSection?: (section: Section) => void // Add new prop for deleting section
}

const SectionsComponent: React.FC<SectionsProps> = ({
	sections,
	searchTerm,
	grade,
	onSearchChange,
	onViewStudents,
	onBackToGrades,
	onCreateNewSection,
	onEditSection,
	onAssignTeacher,
	onDeleteSection,
}) => {
	// Add state to track which section's menu is open
	const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

	// Sort sections alphabetically by name
	const sortedSections = [...sections].sort((a, b) => a.name.localeCompare(b.name))

	// Function to toggle menu visibility
	const toggleMenu = (e: React.MouseEvent, sectionId: string) => {
		e.stopPropagation()
		setActiveMenuId(activeMenuId === sectionId ? null : sectionId)
	}

	// Function to close menu when clicking away
	useEffect(() => {
		const handleClickOutside = () => {
			setActiveMenuId(null)
		}

		document.addEventListener('click', handleClickOutside)
		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [])

	// Function to handle menu item click
	const handleMenuItemClick = (e: React.MouseEvent, action: string, section: Section) => {
		e.stopPropagation()
		setActiveMenuId(null)

		switch (action) {
			case 'edit':
				onEditSection && onEditSection(section)
				break
			case 'assignTeacher':
				onAssignTeacher && onAssignTeacher(section)
				break
			case 'delete':
				onDeleteSection && onDeleteSection(section)
				break
		}
	}

	return (
		<>
			<SectionHeaderContainer>
				<BackToGradesLink onClick={onBackToGrades}>
					<FiArrowLeft />
					Back to Grades
				</BackToGradesLink>
				<SectionPageTitle>
					{/* Show just the grade if it's not a number, otherwise show "Grade X" */}
					{isNaN(Number(grade)) ? `${grade} Sections` : `Grade ${grade} Sections`}
				</SectionPageTitle>
				<SectionPageDescription>
					{sections.length} sections in {isNaN(Number(grade)) ? grade : `Grade ${grade}`}
				</SectionPageDescription>
			</SectionHeaderContainer>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '16px',
				}}
			>
				<SectionSearchContainer>
					<FiSearch />
					<SectionSearchInput
						type='text'
						placeholder='Search sections...'
						value={searchTerm}
						onChange={onSearchChange}
					/>
				</SectionSearchContainer>

				{/* Add button for creating new section */}
				<AddButton
					onClick={onCreateNewSection}
					style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
				>
					<FiPlus />
					<span>Add New Section</span>
				</AddButton>
			</div>

			<SectionsGrid>
				{sortedSections.map((section, index) => {
					// Extract section letter from section name (e.g., "10-A" -> "A")

					return (
						<SectionCard
							key={section.id}
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							onClick={() => onViewStudents(grade, section.name)}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '10px',
								}}
							>
								<SectionLabel>{section.name}</SectionLabel>
								<div style={{ position: 'relative' }}>
									{/* Three-dot menu button */}
									<button
										style={{
											backgroundColor: 'transparent',
											border: 'none',
											borderRadius: '4px',
											padding: '4px',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
										onClick={e => toggleMenu(e, section.id)}
										title='Section Options'
									>
										<FiMoreHorizontal size={18} color='#4338ca' />
									</button>

									{/* Dropdown menu */}
									{activeMenuId === section.id && (
										<div
											style={{
												position: 'absolute',
												top: '30px',
												right: '0',
												backgroundColor: 'white',
												boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
												borderRadius: '4px',
												zIndex: 10,
												width: '160px',
												padding: '4px 0',
											}}
										>
											<button
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													width: '100%',
													textAlign: 'left',
													padding: '8px 12px',
													backgroundColor: 'transparent',
													border: 'none',
													cursor: 'pointer',
													fontSize: '14px',
												}}
												onClick={e => handleMenuItemClick(e, 'edit', section)}
											>
												<FiEdit size={16} />
												Edit Section
											</button>
											<button
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													width: '100%',
													textAlign: 'left',
													padding: '8px 12px',
													backgroundColor: 'transparent',
													border: 'none',
													cursor: 'pointer',
													fontSize: '14px',
												}}
												onClick={e => handleMenuItemClick(e, 'assignTeacher', section)}
											>
												<FiUserPlus size={16} />
												Assign Teacher
											</button>
											<button
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													width: '100%',
													textAlign: 'left',
													padding: '8px 12px',
													backgroundColor: 'transparent',
													border: 'none',
													cursor: 'pointer',
													fontSize: '14px',
													color: '#ef4444',
												}}
												onClick={e => handleMenuItemClick(e, 'delete', section)}
											>
												<FiTrash size={16} />
												Delete Section
											</button>
										</div>
									)}
								</div>
							</div>

							<SectionDetail>
								<SectionIcon>
									<FiMapPin />
								</SectionIcon>
								<span>{section.room}</span>
							</SectionDetail>

							<SectionRow>
								<SectionIconLabel>
									<FiUsers />
									<span>Students</span>
								</SectionIconLabel>
								<SectionValue>{section.students}</SectionValue>
							</SectionRow>

							<SectionRow>
								<SectionIconLabel>
									<FiUserCheck />
									<span>Teacher</span>
								</SectionIconLabel>
								<SectionValue>{section.teacher}</SectionValue>
							</SectionRow>

							<button
								style={{
									width: '100%',
									padding: '14px',
									backgroundColor: '#f9fafb',
									color: '#4338ca',
									border: 'none',
									borderTop: '1px solid #e5e7eb',
									fontSize: '15px',
									fontWeight: 600,
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '8px',
									transition: 'all 0.3s ease',
								}}
								onClick={e => {
									e.stopPropagation() // Prevent triggering the card's onClick
									onViewStudents(grade, section.name)
								}}
								onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.currentTarget.style.backgroundColor = '#4338ca'
									e.currentTarget.style.color = 'white'
									const icon = e.currentTarget.querySelector('svg')
									if (icon) icon.style.transform = 'translateX(4px)'
								}}
								onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.currentTarget.style.backgroundColor = '#f9fafb'
									e.currentTarget.style.color = '#4338ca'
									const icon = e.currentTarget.querySelector('svg')
									if (icon) icon.style.transform = 'translateX(0)'
								}}
							>
								<span>View Students</span>
								<FiChevronRight style={{ transition: 'transform 0.3s ease' }} />
							</button>
						</SectionCard>
					)
				})}

				{sections.length === 0 && (
					<EmptyState>
						<EmptyStateText>
							No sections found for {isNaN(Number(grade)) ? grade : `Grade ${grade}`}.
						</EmptyStateText>
						<EmptyStateActionButton onClick={onCreateNewSection}>
							<FiPlus />
							Create Your First Section
						</EmptyStateActionButton>
					</EmptyState>
				)}
			</SectionsGrid>
		</>
	)
}

// Styled Components
const SectionHeaderContainer = styled.div`
	margin-bottom: 24px;
`

const BackToGradesLink = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background: none;
	border: none;
	color: #4f46e5;
	font-weight: 500;
	cursor: pointer;
	padding: 0;
	margin-bottom: 10px;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		opacity: 0.8;
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

const SectionPageTitle = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: #111827;
	margin: 0 0 4px 0;
`

const SectionPageDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 0;
`

const SectionSearchContainer = styled.div`
	display: flex;
	align-items: center;
	background-color: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 0 12px;
	margin-bottom: 24px;
	width: 100%;
	max-width: 400px;

	svg {
		color: #9ca3af;
		width: 18px;
		height: 18px;
	}
`

const SectionSearchInput = styled.input`
	border: none;
	padding: 10px 12px;
	font-size: 14px;
	width: 100%;
	outline: none;

	&::placeholder {
		color: #9ca3af;
	}
`

// Sections grid styling
const SectionsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 20px;
	margin-top: 16px;
`

const SectionCard = styled.div`
	background-color: white;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
`

const SectionLabel = styled.h3`
	background-color: #4f46e5;
	color: white;
	margin: 0;
	padding: 14px 16px;
	font-size: 16px;
	font-weight: 600;
`

const SectionRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid #f3f4f6;
`

const SectionIconLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: #6b7280;
	font-size: 14px;

	svg {
		width: 16px;
		height: 16px;
	}
`

const SectionValue = styled.div`
	font-weight: 600;
	color: #111827;
`

const SectionDetail = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid #f3f4f6;
	color: #374151;
	font-size: 14px;
`

const SectionIcon = styled.div`
	color: #6b7280;
	display: flex;

	svg {
		width: 16px;
		height: 16px;
	}
`

// Empty state for no data
const EmptyState = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 60px 20px;
	background-color: #f8fafc;
	border-radius: 12px;
	border: 1px dashed #cbd5e1;
	margin-top: 20px;
`

const EmptyStateText = styled.p`
	font-size: 16px;
	color: #6b7280;
	margin: 0;
`

const EmptyStateActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	background-color: #4f46e5;
	color: white;
	border: none;
	border-radius: 8px;
	padding: 12px 20px;
	font-size: 16px;
	font-weight: 600;
	margin-top: 16px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #4338ca;
	}

	svg {
		width: 20px;
		height: 20px;
	}
`

// Add LoadingMessage styled component
const LoadingMessage = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 300px;
	font-size: 16px;
	color: #6b7280;
	gap: 16px;
`

const LoadingSpinner = styled.div`
	border: 4px solid #f3f3f3;
	border-top: 4px solid #4f46e5;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`

// Class grid and cards
const ClassGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 20px;
	margin-top: 12px;
`

const ClassCard = styled.div<ClassCardProps>`
	border-radius: 12px;
	overflow: hidden;
	background-color: white;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
	transition: all 0.3s ease;
	cursor: pointer;
	position: relative;
	border: 1px solid #f1f5f9;
	height: 100%;
	display: flex;
	flex-direction: column;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 20px rgba(0, 0, 0, 0.07);
	}

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 5px;
		background-color: ${props => props.$color};
	}
`

const CardHeader = styled.div<{ $color: string }>`
	background-color: ${props => `${props.$color}10`}; /* Using 10% opacity */
	padding: 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
	border-bottom: 1px solid #f1f5f9;
`

interface ClassNameProps {
	color?: string
}

const ClassName = styled.h3<ClassNameProps>`
	margin: 0;
	color: #1e293b;
	font-size: 18px;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;

	&::before {
		content: '';
		display: block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: ${props => props.color || '#4F46E5'};
	}
`

// Helper function to adjust color brightness
const adjustColorBrightness = (color: string, percent: number) => {
	const num = parseInt(color.replace('#', ''), 16)
	const amt = Math.round(2.55 * percent)
	const R = (num >> 16) + amt
	const G = ((num >> 8) & 0x00ff) + amt
	const B = (num & 0x0000ff) + amt

	return `#${(
		(1 << 24) |
		((R < 255 ? (R < 0 ? 0 : R) : 255) << 16) |
		((G < 255 ? (G < 0 ? 0 : G) : 255) << 8) |
		(B < 255 ? (B < 0 ? 0 : B) : 255)
	)
		.toString(16)
		.slice(1)}`
}

// Custom class number display for purely numeric class names
interface ClassNumberDisplayProps {
	color?: string
}

const ClassNumberDisplay = styled.span<ClassNumberDisplayProps>`
	font-weight: 700;
	font-size: 20px;
	background: linear-gradient(
		135deg,
		${props => props.color || '#4F46E5'},
		${props => (props.color ? adjustColorBrightness(props.color, -15) : '#3730a3')}
	);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	color: transparent;
`

const CardActions = styled.div`
	position: relative;
	z-index: 10;

	svg {
		color: #64748b;
		border-radius: 50%;
		cursor: pointer;
		padding: 6px;
		width: 28px;
		height: 28px;
		transition: all 0.2s ease;

		&:hover {
			background-color: #f1f5f9;
			color: #0f172a;
		}
	}
`

const ActionsMenu = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	background-color: white;
	border-radius: 12px;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	padding: 8px;
	width: 140px;
	z-index: 100;
	margin-top: 8px;
	border: 1px solid #f1f5f9;

	&::before {
		content: '';
		position: absolute;
		top: -6px;
		right: 10px;
		width: 12px;
		height: 12px;
		background: white;
		transform: rotate(45deg);
		border-left: 1px solid #f1f5f9;
		border-top: 1px solid #f1f5f9;
	}
`

const ActionButton = styled.button<ActionButtonProps>`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px;
	border: none;
	background-color: white;
	color: ${props => (props.$isPrimary ? '#4F46E5' : '#EF4444')};
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s ease;
	text-align: left;
	font-weight: 500;

	&:hover {
		background-color: ${props => (props.$isPrimary ? '#EEF2FF' : '#FEF2F2')};
		transform: translateX(2px);
	}

	svg {
		width: 16px;
		height: 16px;
	}
`

const ClassDetails = styled.div`
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	flex: 1;
	background: linear-gradient(to bottom, #ffffff, #fafafa);
`

const DetailItem = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;

	svg {
		color: #64748b;
		min-width: 18px;
		min-height: 18px;
	}

	span {
		color: #334155;
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
		letter-spacing: 0.01em;
	}
`

const ClassStatus = styled.div<StatusProps>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 30px;
	font-size: 13px;
	font-weight: 500;
	width: fit-content;
	margin-bottom: 4px;
	background-color: ${props => (props.$status === 'active' ? '#ECFDF5' : '#FEF2F2')};
	color: ${props => (props.$status === 'active' ? '#059669' : '#DC2626')};
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

	&::before {
		content: '';
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: ${props => (props.$status === 'active' ? '#10b981' : '#ef4444')};
	}
`

// Table view components
const ClassTable = styled.div`
	background-color: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
	width: 100%;
	border: 1px solid #f1f5f9;
	margin-top: 12px;
`

const ClassTableHeader = styled.div`
	display: grid;
	grid-template-columns: 1fr 1.5fr 1.5fr 0.8fr 0.6fr;
	padding: 16px 20px;
	background-color: #f8fafc;
	border-bottom: 1px solid #e2e8f0;
	font-weight: 600;
	color: #64748b;
	font-size: 14px;

	.class-number {
		display: flex;
		align-items: center;
	}

	.days,
	.times,
	.status,
	.actions {
		display: flex;
		align-items: center;
	}
`

interface ClassTableRowProps {
	color?: string
}

const ClassTableRow = styled.div<ClassTableRowProps>`
	display: grid;
	grid-template-columns: 1fr 1.5fr 1.5fr 0.8fr 0.6fr;
	padding: 16px 20px;
	border-bottom: 1px solid #e2e8f0;
	align-items: center;
	transition: background-color 0.2s;
	cursor: pointer;
	position: relative;

	&:hover {
		background-color: #f8fafc;
	}

	&:last-child {
		border-bottom: none;
	}

	.class-number {
		font-weight: 600;
		color: #1e293b;
		display: flex;
		align-items: center;
		gap: 8px;

		&::before {
			content: '';
			display: block;
			width: 8px;
			height: 24px;
			border-radius: 2px;
			background-color: ${props => props.color || '#4F46E5'};
			margin-right: 8px;
		}
	}

	.days,
	.times {
		color: #334155;
		font-size: 14px;
	}

	.status {
		display: flex;
		align-items: center;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
	}
`

const StatusBadge = styled.span<StatusProps>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 30px;
	font-size: 13px;
	font-weight: 500;
	background-color: ${props => (props.$status === 'active' ? '#ECFDF5' : '#FEF2F2')};
	color: ${props => (props.$status === 'active' ? '#059669' : '#DC2626')};
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

	&::before {
		content: '';
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: ${props => (props.$status === 'active' ? '#10b981' : '#ef4444')};
	}
`

const ActionIconsContainer = styled.div`
	display: flex;
	gap: 12px;
`

const ActionIcon = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	width: 32px;
	height: 32px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	padding: 0;
	color: #64748b;

	&:hover {
		background-color: #f1f5f9;
		color: #0f172a;
	}

	&:first-child:hover {
		color: #4f46e5;
	}

	&:last-child:hover {
		color: #ef4444;
	}

	svg {
		width: 18px;
		height: 18px;
	}
`

// Add styled components for the modal
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
	border-radius: 10px;
	padding: 24px;
	width: 600px;
	max-width: 90%;
	max-height: 90vh;
	overflow-y: auto;
`

// Replace these with different names to avoid conflicts
const StudentModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
`

const StudentModalTitle = styled.h2`
	font-size: 20px;
	color: #111827;
	margin: 0;
`

const StudentCloseButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	font-size: 24px;
	cursor: pointer;

	&:hover {
		color: #111827;
	}
`

const SearchStudentInput = styled.input`
	width: 100%;
	padding: 10px 16px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	font-size: 14px;
	margin-bottom: 16px;

	&:focus {
		outline: none;
		border-color: #a5b4fc;
		box-shadow: 0 0 0 3px rgba(165, 180, 252, 0.5);
	}
`

const StudentsList = styled.div`
	margin-bottom: 20px;
	max-height: 400px;
	overflow-y: auto;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
`

const StudentItem = styled.div<{ $isSelected: boolean; $isExcluded?: boolean }>`
	display: flex;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid #e5e7eb;
	cursor: ${props => props.$isExcluded ? 'not-allowed' : 'pointer'};
	background-color: ${props => 
    props.$isExcluded ? '#f3f4f6' : // Different background for excluded
    props.$isSelected ? '#EEF2FF' : 'white'};
  opacity: ${props => props.$isExcluded ? 0.7 : 1};

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: ${props => 
      props.$isExcluded ? '#f3f4f6' : 
      props.$isSelected ? '#EEF2FF' : '#F9FAFB'};
	}
`

const StudentCheckbox = styled.input`
	width: 18px;
	height: 18px;
	margin-right: 12px;
`

const StudentInfo = styled.div`
	flex: 1;
`

const ModalActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 16px;
`

// Rename CancelButton to ModalCancelButton to avoid conflicts

const AddButton = styled.button`
	padding: 10px 16px;
	background-color: #4f46e5;
	color: white;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #4338ca;
	}

	&:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}
`

const SelectedCount = styled.div`
	font-size: 14px;
	color: #4b5563;
	font-weight: 500;
	margin-bottom: 12px;
`

// Add the CancelButton styled component

// Add the CancelButton styled component

// Main component
export const Classes: React.FC = () => {
	// State for search, filters, and view mode
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState<string>('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [isActionsMenuOpen, setIsActionsMenuOpen] = useState<string | null>(null)

	// State for showing sections
	const [showSections, setShowSections] = useState(false)
	const [selectedGradeForSections, setSelectedGradeForSections] = useState<string | null>(null)
	const [sectionSearchTerm, setSectionSearchTerm] = useState('')

	// State for student view
	const [showStudents, setShowStudents] = useState(false)
	const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
	const [selectedSection, setSelectedSection] = useState<string | null>(null)

	// New state for filters in student view
	const [studentFilterOpen, setStudentFilterOpen] = useState(false)
	const [courseFilterOpen, setCourseFilterOpen] = useState(false)
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [courseFilter, setCourseFilter] = useState<string>('all')

	// Classes data state
	const [classes, setClasses] = useState<Class[]>([])
	const [sections, setSections] = useState<Section[]>([])
	const [students, setStudents] = useState<Student[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isSectionsLoading, setIsSectionsLoading] = useState(false)
	const [isStudentsLoading, setIsStudentsLoading] = useState(false)

	// Add new state for the modal
	const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false)
	const [isEditStudentClassModalOpen, setIsEditStudentClassModalOpen] = useState(false)
	const [studentToEditClass, setStudentToEditClass] = useState<Student | null>(null)
	// Add state for delete confirmation modal
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [studentToDeleteFromClass, setStudentToDeleteFromClass] = useState<{
		id: string
		name: string
	} | null>(null)

	// Ref for filter dropdowns
	const studentFilterRef = useRef<HTMLDivElement>(null)
	const courseFilterRef = useRef<HTMLDivElement>(null)

	// Add state for the section modal
	const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)
	const [suggestedSectionName, setSuggestedSectionName] = useState('')
	const [suggestedRoomName, setSuggestedRoomName] = useState('')

	// Add these new state variables after other state declarations
	const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
	const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false)
	const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false)
	const [currentSection, setCurrentSection] = useState<Section | null>(null)

	// Add these new state variables
	const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
	const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false)
	const [currentClass, setCurrentClass] = useState<Class | null>(null)
	const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false)
	const [classToDelete, setClassToDelete] = useState<string | null>(null)

	const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
	const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false)

	const [isManageSubjectTeachersModalOpen, setIsManageSubjectTeachersModalOpen] = useState(false)
	const [currentSectionForSubjectTeachersModal, setCurrentSectionForSubjectTeachersModal] =
		useState<Section | null>(null)

	// New state for ClassTypes
	const [classTypes, setClassTypes] = useState<ClassType[]>([]);
	const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
	const [isLoadingClassTypes, setIsLoadingClassTypes] = useState(true);
	const [classTypesError, setClassTypesError] = useState<string | null>(null);

	// Add click outside listener for filter dropdowns
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (studentFilterRef.current && !studentFilterRef.current.contains(event.target as Node)) {
				setStudentFilterOpen(false)
			}

			if (courseFilterRef.current && !courseFilterRef.current.contains(event.target as Node)) {
				setCourseFilterOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const handleOpenAddStudentsModal = async () => {
		console.log('Opening Add Students modal...')

		// First, register a custom RPC function if we need to use it later
		try {
			// We'll register this once when opening the modal
			console.log('Registering custom RPC function for student insertion...')

			// This is a direct SQL query that will be executed when we call the RPC
			try {
				const { error: rpcError } = await supabase.rpc('create_or_replace_classstudent_function', {
					function_sql: `
            CREATE OR REPLACE FUNCTION insert_classstudent(p_classid UUID, p_studentid UUID)
            RETURNS BOOLEAN AS $$
            BEGIN
              -- Check if the student is already in the class
              IF EXISTS (
                SELECT 1 FROM classstudents
                WHERE classid = p_classid AND studentid = p_studentid
              ) THEN
                RETURN FALSE; -- Already exists
              END IF;

              -- Insert the student
              INSERT INTO classstudents (classid, studentid, status)
              VALUES (p_classid, p_studentid, 'active');

              RETURN TRUE; -- Successfully inserted
            EXCEPTION WHEN OTHERS THEN
              RETURN FALSE; -- Error occurred
            END;
            $$ LANGUAGE plpgsql;
          `,
				})

				if (rpcError) {
					console.log(
						'Note: Could not register RPC function. This may be normal if you do not have privileges:',
						rpcError
					)
				} else {
					console.log('Successfully registered RPC function')
				}
			} catch (err) {
				// Ignore errors, this is just a setup attempt
				console.log('Note: RPC function creation attempted:', err)
			}
		} catch (err) {
			// Ignore errors during RPC setup
			console.log('Note: RPC setup was attempted:', err)
		}

		// Now open the modal
		setIsAddStudentsModalOpen(true)
	}

	const handleCloseAddStudentsModal = () => {
		setIsAddStudentsModalOpen(false)
	}

	const handleAddStudentsToClass = async (studentIds: string[]) => {
		if (!selectedSection) {
			toast.error('No section selected')
			return
		}

		// Find the class ID for the selected section
		const sectionObj = sections.find(s => s.name === selectedSection)
		if (!sectionObj) {
			toast.error('Section not found')
			handleCloseAddStudentsModal()
			return
		}

		const classId = sectionObj.id
		setIsStudentsLoading(true)

		console.log(`Adding ${studentIds.length} students to class ${classId} (${selectedSection})`)
		console.log('Student IDs to add:', studentIds)

		// --- Pre-flight Checks ---
		let dataIsValid = true

		// 1. Validate Class ID
		if (!classId || typeof classId !== 'string' || classId.length < 36) {
			// Basic UUID check
			console.error('Invalid Class ID:', classId)
			toast.error('Internal error: Invalid class ID.')
			dataIsValid = false
		}

		// 2. Validate Student IDs
		for (const studentId of studentIds) {
			if (!studentId || typeof studentId !== 'string' || studentId.length < 36) {
				// Basic UUID check
				console.error('Invalid Student ID found:', studentId)
				toast.error(`Internal error: Invalid student ID format (${studentId}).`)
				dataIsValid = false
				break // Stop checking if one is invalid
			}
		}

		// 3. (Optional but recommended) Check if students already exist in this class
		if (dataIsValid) {
			try {
				const { data: existingStudents, error: checkError } = await supabase
					.from('classstudents')
					.select('studentid')
					.eq('classid', classId)
					.in('studentid', studentIds)

				if (checkError) {
					console.warn('Could not check for existing students:', checkError)
				} else if (existingStudents && existingStudents.length > 0) {
					const existingIds = existingStudents.map(s => s.studentid)
					console.log('Some selected students are already in the class:', existingIds)
					// Filter out students who are already in the class
					const originalCount = studentIds.length
					studentIds = studentIds.filter(id => !existingIds.includes(id))
					const removedCount = originalCount - studentIds.length
					if (removedCount > 0) {
						toast.info(`${removedCount} student(s) are already in this class.`)
					}
					if (studentIds.length === 0) {
						console.log('All selected students are already in the class. Nothing to add.')
						toast.info('All selected students are already in the class.')
						dataIsValid = false // Prevent insertion attempt
					}
				}
			} catch (checkError) {
				console.error('Error during pre-check for existing students:', checkError)
			}
		}

		// --- End Pre-flight Checks ---

		if (!dataIsValid) {
			setIsStudentsLoading(false)
			handleCloseAddStudentsModal()
			return // Stop if data is invalid or nothing to add
		}

		// If checks pass, proceed with insertion
		try {
			console.log('=== STUDENT INSERTION PROCESS STARTING ===')
			console.log(`Attempting to add ${studentIds.length} students to class ${classId}`)

			let successCount = 0
			let failureCount = 0
			const successfulIds = []

			// Process one student at a time for better error control
			for (const studentId of studentIds) {
				try {
					console.log(`---> Processing student ${studentId} for class ${classId}...`)

					// Very simple insert data - just the two required fields
					const insertData = {
						classid: classId,
						studentid: studentId,
					}

					console.log(`Inserting data:`, insertData)

					// First try with upsert to handle potential duplicates
					const { data: insertResult, error: insertError } = await supabase
						.from('classstudents')
						.upsert(insertData, {
							onConflict: 'classid,studentid', // Define conflict columns
							ignoreDuplicates: true, // Skip inserting rows that would cause conflicts
						})

					if (insertError) {
						console.error(`Failed to add student ${studentId}:`, insertError)
						failureCount++

						// If upsert failed, try a direct rpc call as fallback
						try {
							console.log(`Falling back to RPC for student ${studentId}...`)
							const result = await supabase.rpc('insert_classstudent', {
								p_classid: classId,
								p_studentid: studentId,
							})

							if (result.error) {
								console.error(`RPC insert failed:`, result.error)
							} else {
								console.log(`RPC insert succeeded:`, result.data)
								successCount++
								successfulIds.push(studentId)
							}
						} catch (rpcError) {
							console.error(`RPC fallback failed:`, rpcError)
						}
					} else {
						console.log(`Successfully added student ${studentId}!`, insertResult)
						successCount++
						successfulIds.push(studentId)
					}
				} catch (perStudentError) {
					console.error(`Unexpected error for student ${studentId}:`, perStudentError)
					failureCount++
				}

				// Small delay between operations
				await new Promise(resolve => setTimeout(resolve, 100))
			}

			console.log('=== STUDENT INSERTION COMPLETE ===')
			console.log(`Successes: ${successCount}, Failures: ${failureCount}`)
			console.log('Successful student IDs:', successfulIds)

			if (successCount > 0) {
				toast.success(
					`Successfully added ${successCount} student${successCount !== 1 ? 's' : ''} to class`
				)
				// Refresh the student list to see the new additions
				handleViewStudents(selectedGrade!, selectedSection)
			} else {
				console.error('No students were successfully added.')
				toast.error('Failed to add students to class. See console for details.')
			}
		} catch (error) {
			console.error('Unexpected error during student insertion:', error)
			toast.error('An unexpected error occurred while adding students')
		} finally {
			handleCloseAddStudentsModal()
			setIsStudentsLoading(false)
		}
	}

	// Fetch classes data from Supabase
	useEffect(() => {
		const fetchClassTypes = async () => {
			setIsLoadingClassTypes(true);
			setClassTypesError(null);
			try {
				const { data, error } = await supabase
					.from('class_types')
					.select('*')
					.order('name');

				if (error) throw error;
				setClassTypes(data || []);
			} catch (error: any) {
				console.error('Error fetching class types:', error);
				toast.error('Failed to load class types');
				setClassTypesError(error.message);
			} finally {
				setIsLoadingClassTypes(false);
			}
		};

		fetchClassTypes();
	}, []);

	useEffect(() => {
		const fetchClasses = async () => {
			if (!selectedClassType) {
				setClasses([]); // Clear levels if no class type is selected
				setIsLoading(false); // Ensure loading is set to false
				return;
			}

			setIsLoading(true)
			try {
				// Fetch all classes (Levels) based on selectedClassType.id
				const { data: classesData, error: classesError } = await supabase
					.from('levels')
					.select('*')
					.eq('type_id', selectedClassType.id) // Filter by selected class type
					.order('name')

				if (classesError) throw classesError

				// Process each class to get teacher, student count, and section count
				const processedClasses = await Promise.all(
					(classesData || []).map(async cls => {
						// Get teacher name if teacherId exists
						let teacherName = 'No teacher assigned yet'
						if (cls.teacherId) {
							const { data: teacherData, error: teacherError } = await supabase
								.from('users')
								.select('firstName, lastName')
								.eq('id', cls.teacherId)
								.single()

							if (!teacherError && teacherData && teacherData.firstName && teacherData.lastName) {
								teacherName = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim()
								if (!teacherName) teacherName = 'No teacher name available'
							}
						}

						// Count students in this class
						const { count: studentCount, error: countError } = await supabase
							.from('classstudents')
							.select('*', { count: 'exact', head: true })
							.eq('classid', cls.id)

						if (countError) console.error('Error counting students:', countError)

						// Count sections in this class
						const { count: sectionCount, error: sectionCountError } = await supabase
							.from('classes')
							.select('*', { count: 'exact', head: true })
							.eq('level_id', cls.id)

						if (sectionCountError) console.error('Error counting sections:', sectionCountError)

						// Format attendance days
						const formattedDays = formatAttendanceDays(cls.attendanceDays || [])

						// Format attendance times
						const formattedTimes = formatAttendanceTimes(cls.attendanceTimes || [])

						// Assign a color based on id (for UI)
						const colors = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899']
						const colorIndex = parseInt(cls.id, 16) % colors.length
						const color = colors[colorIndex] || colors[0]

						return {
							id: cls.id,
							classname: cls.name,
							teacherName,
							attendanceDays: cls.attendanceDays,
							attendanceTimes: cls.attendanceTimes,
							formattedDays,
							formattedTimes,
							students: studentCount || 0,
							status: cls.status || 'active',
							color,
							sectionCount: sectionCount || 0, // Add the section count
						}
					})
				)

				// Sort the processed classes numerically in ascending order
				const sortedClasses = [...processedClasses].sort((a, b) => {
					// Extract numerical values from class names if possible
					const numA = a.classname ? parseInt(a.classname.replace(/\D/g, '')) : 0
					const numB = b.classname ? parseInt(b.classname.replace(/\D/g, '')) : 0

					// If both have valid numbers, sort numerically
					if (!isNaN(numA) && !isNaN(numB)) {
						return numA - numB
					}

					// Fall back to string comparison if numerical extraction fails
					return (a.classname || '').localeCompare(b.classname || '')
				})

				setClasses(sortedClasses)
			} catch (error) {
				console.error('Error fetching classes:', error)
				toast.error('Failed to load classes')
			} finally {
				setIsLoading(false)
			}
		}

		fetchClasses()
	}, [selectedClassType])

	// Fetch sections data when a grade is selected
	useEffect(() => {
		const fetchSections = async () => {
			if (!selectedGradeForSections) return

			setIsSectionsLoading(true)
			try {
				// First, fetch the level ID that corresponds to the selected grade number
				const { data: levelsData, error: levelsError } = await supabase
					.from('levels')
					.select('id, name')
					.eq('name', selectedGradeForSections)

				if (levelsError) {
					throw levelsError
				}

				if (!levelsData || levelsData.length === 0) {
					console.warn(`No level found for grade ${selectedGradeForSections}`)
					setSections([])
					setIsSectionsLoading(false)
					return
				}

				const levelId = levelsData[0].id
				console.log(`Found level ID ${levelId} for grade ${selectedGradeForSections}`)

				// Now fetch sections using the correct level ID (UUID)
				// Include the teacher ID in the select to be used for looking up the teacher name
				const { data: classesData, error: sectionsError } = await supabase
					.from('classes')
					.select('*')
					.eq('level_id', levelId)

				if (sectionsError) throw sectionsError

				console.log(`Fetched ${classesData?.length || 0} classes for level ID ${levelId}`)

				// If no classes/sections found for this level, don't show an error - just set empty sections array
				// This will show the "No sections found" message but still allow adding new sections
				if (!classesData || classesData.length === 0) {
					console.log(`No sections found for level ${selectedGradeForSections} (ID: ${levelId})`)
					setSections([])
					setIsSectionsLoading(false)
					return
				}

				// Process each class into a section format
				const processedSections = await Promise.all(
					(classesData || []).map(async cls => {
						// Get teacher name from the joined users data
						let teacher = 'No teacher assigned'

						// Only fetch teacher info if teacherid exists
						if (cls.teacherid) {
							console.log(`Fetching teacher info for teacher ID: ${cls.teacherid}`)
							const { data: teacherData, error: teacherError } = await supabase
								.from('users')
								.select('firstName, lastName')
								.eq('id', cls.teacherid)
								.single()

							if (!teacherError && teacherData) {
								teacher = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim()
								if (!teacher) teacher = 'No teacher name'
								console.log(`Found teacher: ${teacher} for class ${cls.classname}`)
							} else {
								console.warn(`Could not find teacher with ID ${cls.teacherid}:`, teacherError)
							}
						} else {
							console.log(`No teacher assigned for class ${cls.classname}`)
						}

						// Count students in this class
						const { count: studentCount, error: countError } = await supabase
							.from('classstudents')
							.select('*', { count: 'exact', head: true })
							.eq('classid', cls.id)

						if (countError) console.error('Error counting students:', countError)

						// Generate a section name from the class
						// Extract letters/numbers that might represent a section (e.g., "A", "1", etc.)
						const sectionMatch = cls.classname.match(/[A-Za-z0-9]+$/)
						const sectionIdentifier = sectionMatch ? sectionMatch[0] : ''

						// Create a clean section name - use the class name directly instead of adding the grade level
						// This prevents duplication like "10-10A" when the class name already contains the grade level
						const sectionName = cls.classname.includes(selectedGradeForSections)
							? cls.classname
							: `${selectedGradeForSections}-${sectionIdentifier}`

						// For now, use a random performance value between 70-100
						const performance = Math.floor(Math.random() * 30) + 70

						return {
							id: cls.id,
							name: sectionName,
							room: cls.room || `Room ${sectionIdentifier || cls.id.substring(0, 3)}`,
							students: studentCount || 0,
							teacher,
							performance,
							grade: selectedGradeForSections,
						}
					})
				)

				console.log('Processed sections with teacher info:', processedSections)
				setSections(processedSections)
			} catch (error) {
				console.error('Error fetching sections:', error)
				toast.error('Failed to load sections')
			} finally {
				setIsSectionsLoading(false)
			}
		}

		fetchSections()
	}, [selectedGradeForSections])

	// Handler function to fetch students for a specific section
	const handleViewStudents = async (grade: string, sectionName: string | null) => {
		console.log(`View students for grade: ${grade}, section: ${sectionName}`)
		setSelectedGrade(grade)
		setSelectedSection(sectionName) // This is the section NAME
		setShowStudents(true)
		setStatusFilter('all')
		setCourseFilter('all')
		setIsStudentsLoading(true)

		try {
			if (!sectionName) throw new Error('Section name is required to view students')

			const sectionObj = sections.find(s => s.name === sectionName || s.id === sectionName) // Try matching by name or ID

			if (!sectionObj) {
				console.error(
					`Section not found by name or ID: ${sectionName} in grade ${grade}. Available sections:`,
					sections.map(s => ({ id: s.id, name: s.name }))
				)
				toast.error(`Section "${sectionName}" not found.`)
				setIsStudentsLoading(false)
				setShowStudents(false) // Go back if section not found
				return
			}

			const currentClassId = sectionObj.id
			setSelectedClassId(currentClassId) // <-- SET THE ID HERE
			console.log(
				`Fetching students for class ID: ${currentClassId} (Section Name: ${sectionObj.name})`
			)

			// Fetch all students in the selected class from classstudents table
			let { data: classstudents, error } = await supabase
				.from('classstudents')
				.select('*')
				.eq('classid', currentClassId)

			if (error) throw error

			console.log(
				`Found ${classstudents?.length || 0} students enrolled in class ID ${currentClassId}`
			)

			if (!classstudents || classstudents.length === 0) {
				setStudents([])
				setIsStudentsLoading(false)
				return
			}

			// Get detailed student information for each enrolled student
			const transformedStudents = await Promise.all(
				classstudents.map(async enrollment => {
					// Fetch each student's user data directly
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('id, firstName, lastName, email, role, status')
						.eq('id', enrollment.studentid)
						.single()

					if (userError || !userData) {
						console.error(
							`Error fetching user data for student ID ${enrollment.studentid}:`,
							userError
						)
						return null
					}

					//get the subjects that the student is enrolled in
					const { data: classSubjects, error: subjectsError } = await supabase
						.from('classsubjects')
						.select('id, subjectid')
						.eq('classid', enrollment.classid)

					if (subjectsError) {
						console.error(
							`Error fetching subjects for class ID ${enrollment.classid}:`,
							subjectsError
						)
					}

					// Get subject names for each subject ID
					let subjectList: string[] = []

					if (classSubjects && classSubjects.length > 0) {
						// Get all subject IDs
						const subjectIds = classSubjects.map(cs => cs.subjectid).filter(Boolean)

						if (subjectIds.length > 0) {
							// Fetch subject names for all subject IDs
							const { data: subjectData, error: subjectNameError } = await supabase
								.from('subjects')
								.select('id, subjectname')
								.in('id', subjectIds)

							if (!subjectNameError && subjectData) {
								// Map to just the subject names
								subjectList = subjectData.map(subj => subj.subjectname).filter(Boolean)
							} else {
								console.error('Error fetching subject names:', subjectNameError)
							}
						}
					}

					// Try to get actual performance and attendance data if available
					let performance = 0
					let attendance = 0 // Default to 0

					try {
						// Check if there's performance data
						const { data: performanceData, error: perfError } = await supabase
							.from('studentperformance')
							.select('performance')
							.eq('studentid', enrollment.studentid)
							.eq('classid', enrollment.classid)
							.single()

						if (!perfError && performanceData) {
							performance = performanceData.performance
						}

						// Check if there's attendance data
						const { data: attendanceData, error: attError } = await supabase
							.from('attendance')
							.select('percentage')
							.eq('studentid', enrollment.studentid)
							.eq('classid', enrollment.classid)
							.single()

						if (!attError && attendanceData) {
							attendance = attendanceData.percentage
						} else if (attError && attError.code !== 'PGRST116') {
							// PGRST116 means no rows found, which is not an error here
							console.error(
								`Error fetching attendance for student ${enrollment.studentid} in class ${enrollment.classid}:`,
								attError
							)
						}
					} catch (dataError) {
						console.error('Error fetching performance/attendance data:', dataError)
					}

					return {
						id: userData.id,
						name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
						email: userData.email || '',
						phone: '', // Phone not available in current structure
						guardian: '', // Guardian not available in current structure
						status: userData.status || 'active',
						course: '', // Course not available in current structure
						grade,
						section: sectionName,
						performance, // Now using real data when available
						subjects: subjectList, // Real subjects from database
					} as Student
				})
			)

			// Filter out null values
			const validStudents = transformedStudents.filter(
				(student): student is Student => student !== null
			)

			console.log(`Successfully processed ${validStudents.length} student records`)
			setStudents(validStudents)
		} catch (error) {
			console.error('Error fetching students:', error)
			toast.error('Failed to load students data')
			setStudents([])
		} finally {
			setIsStudentsLoading(false)
		}
	}

	// Handler functions
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const handleSectionSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSectionSearchTerm(e.target.value)
	}

	const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilterStatus(e.target.value)
	}

	const toggleActionsMenu = (classId: string) => {
		setIsActionsMenuOpen(isActionsMenuOpen === classId ? null : classId)
	}

	const handleEditClass = (classId: string) => {
		// Find the class data from the classes array
		const classToEdit = classes.find(cls => cls.id === classId)

		if (classToEdit) {
			setCurrentClass(classToEdit)
			setSelectedClassId(classId)
			setIsEditClassModalOpen(true)
		} else {
			console.error('Class not found:', classId)
			toast.error('Cannot edit class: Class not found')
		}
	}

	const handleDeleteClass = (classId: string) => {
		setClassToDelete(classId)
		setIsDeleteModalOpen(true)
	}

	const handleBackToClasses = () => {
		if (showStudents) {
			setShowStudents(false)
      // selectedGradeForSections should still be set to the current level/grade
      // selectedSection should also persist to show the correct section view initially
			// No need to explicitly set showSections to true, as the main render logic will handle it
		} else if (showSections) {
			setShowSections(false)
      setSelectedGradeForSections(null); // Clear selected grade when going back to levels view
      setSections([]); // Clear sections
		} else if (selectedClassType) {
      // This case means we are in the Levels view and want to go back to Class Types
      // This is usually handled by a dedicated button, but added for completeness
      setSelectedClassType(null);
      setClasses([]); // Clear levels
      setSelectedGradeForSections(null);
    }
	}

	const handleCardClick = (cls: Class) => {
		// Check if classname exists before trying to match
		if (!cls.classname) {
			toast.warning('Invalid class data')
			return
		}

		// Set the selected grade/level directly from the class name
		// This allows both numeric grades like "10" and named levels like "Middle School"
		setSelectedGradeForSections(cls.classname)
		setShowSections(true)

		// Reset section search when navigating to sections view
		setSectionSearchTerm('')
	}

	const handleStudentStatusFilterChange = (status: string) => {
		setStatusFilter(status)
		setStudentFilterOpen(false)
	}

	const handleCourseFilterChange = (course: string) => {
		setCourseFilter(course)
		setCourseFilterOpen(false)
	}

	// Get all unique courses from students data
	const getUniqueCourses = () => {
		try {
			// First filter students with valid subjects array
			const validStudents = students.filter(
				student => student && student.subjects && Array.isArray(student.subjects)
			)

			// Then extract all subjects, filtering out invalid ones
			const allCourses = validStudents.flatMap(student =>
				student.subjects.filter(subject => subject && typeof subject === 'string')
			)

			// Return unique courses with 'all' at the beginning
			return ['all', ...Array.from(new Set(allCourses))]
		} catch (error) {
			console.error('Error getting unique courses:', error)
			return ['all']
		}
	}

	// Filter classes based on search term and filters
	const filteredClasses = classes.filter(cls => {
		const matchesSearch =
			!searchTerm ||
			(cls.classname && cls.classname.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(cls.teacherName && cls.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))

		const matchesStatus = !filterStatus || cls.status === filterStatus

		return matchesSearch && matchesStatus
	})

	// Filter sections based on search term
	const filteredSections = sections.filter(section => {
		if (!sectionSearchTerm) return true

		const termLower = sectionSearchTerm.toLowerCase()
		return (
			(section.name && section.name.toLowerCase().includes(termLower)) ||
			(section.teacher && section.teacher.toLowerCase().includes(termLower)) ||
			(section.room && section.room.toLowerCase().includes(termLower))
		)
	})

	// Filter students based on selected grade and section and other filters
	const filteredStudents = students.filter(student => {
		// Match by search term
		const matchesSearch =
			!searchTerm ||
			(student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))

		// Match by status filter
		const matchesStatus = statusFilter === 'all' || student.status === statusFilter

		// Match by course filter
		const matchesCourse =
			courseFilter === 'all' ||
			(student.subjects &&
				Array.isArray(student.subjects) &&
				student.subjects.some(
					subject => subject && subject.toLowerCase() === courseFilter.toLowerCase()
				))

		return matchesSearch && matchesStatus && matchesCourse
	})

	const setViewingStudents = (grade: string, section: string | null) => {
		console.log(`Setting viewing students for grade: ${grade}, section: ${section}`)
		// Call handleViewStudents with the correct grade and section
		handleViewStudents(grade, section)
	}

	// Add these new handler functions before the return statement

	const handleEditStudent = (student: Student) => {
		console.log(`Edit student class for: ${student.name} (ID: ${student.id})`)
		setStudentToEditClass(student)
		setIsEditStudentClassModalOpen(true)
	}

	// Updated handler to open the modal instead of directly creating a section
	const handleCreateNewSection = () => {
		if (!selectedGradeForSections) return

		// Generate suggested section name and room
		let nextSectionLetter = 'A'

		if (sections.length > 0) {
			// Find the highest letter section currently in use
			const sectionLetters = sections
				.map(section => {
					const match = section.name.match(/([A-Z])$/)
					return match ? match[1] : ''
				})
				.filter(Boolean)
				.sort()

			if (sectionLetters.length > 0) {
				// Get the last letter and increment it
				const lastLetter = sectionLetters[sectionLetters.length - 1]
				nextSectionLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1)
			}
		}

		// Check if grade is a number (like "10") or a name (like "Middle School")
		const isNumericGrade = !isNaN(Number(selectedGradeForSections))

		// Set suggested values based on grade type
		let suggestedName
		if (isNumericGrade) {
			// For numeric grades, use format like "10A"
			suggestedName = `${selectedGradeForSections}${nextSectionLetter}`
		} else {
			// For named grades, use format like "Middle School A"
			suggestedName = `${selectedGradeForSections} ${nextSectionLetter}`
		}

		setSuggestedSectionName(suggestedName)
		setSuggestedRoomName(`Room ${nextSectionLetter}`)

		// Open the modal
		setIsAddSectionModalOpen(true)
	}

	// New function to handle adding a section from the modal
	const handleAddSectionFromModal = async (sectionName: string, room: string) => {
		if (!selectedGradeForSections) {
			toast.error('No grade selected')
			setIsAddSectionModalOpen(false)
			return
		}

		try {
			console.log('Creating new section:', { sectionName, room, grade: selectedGradeForSections })

			// 1. Fetch current user session
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession()
			if (sessionError || !session || !session.user) {
				console.error('Error getting session or no active session:', sessionError)
				toast.error('Could not get user session. Please log in again.')
				setIsAddSectionModalOpen(false)
				return
			}
			const currentUserId = session.user.id
			console.log('Current user ID:', currentUserId)

			// 2. Get the level ID for the grade
			const { data: levelData, error: levelError } = await supabase
				.from('levels')
				.select('id') // Only select id
				.eq('name', selectedGradeForSections)
				.single()

			if (levelError) {
				console.error('Error fetching level ID:', levelError)
				throw levelError
			}

			if (!levelData) {
				console.error(`Level for grade ${selectedGradeForSections} not found`)
				toast.error(`Level for grade ${selectedGradeForSections} not found`)
				setIsAddSectionModalOpen(false)
				return
			}
			const levelId = levelData.id
			console.log('Found level ID:', levelId, 'for grade', selectedGradeForSections)

			// 3. Extract section letter and Find or Create the Category ID
			// Modified regex to extract the last letter - works for both "10A" and "Middle School A"
			const sectionLetterMatch = sectionName.match(/([A-Z])$/i) // Match last letter, case-insensitive
			const sectionLetter = sectionLetterMatch ? sectionLetterMatch[1].toUpperCase() : null

			if (!sectionLetter) {
				console.error('Could not extract section letter from name:', sectionName)
				toast.error(
					'Invalid section name format. Section name should end with a letter (e.g., "10A" or "Middle School A").'
				)
				setIsAddSectionModalOpen(false)
				return
			}

			console.log(`Extracted section letter: ${sectionLetter} from name: ${sectionName}`)

			let categoryId: string | null = null
			const categoryNameToFind = sectionLetter // Use the extracted letter

			// Try to find the category
			const { data: existingCategory, error: findCategoryError } = await supabase
				.from('categories')
				.select('id')
				.eq('name', categoryNameToFind) // Match category name with the section letter
				.limit(1)

			if (findCategoryError) {
				console.error('Error searching for category:', findCategoryError)
				toast.error(`Error checking for category '${categoryNameToFind}'.`)
				setIsAddSectionModalOpen(false)
				return
			}

			if (existingCategory && existingCategory.length > 0) {
				// Category exists, use its ID
				categoryId = existingCategory[0].id
				console.log('Found existing category ID:', categoryId, 'for name', categoryNameToFind)
			} else {
				// Category does not exist, create it
				console.log(`Category '${categoryNameToFind}' not found, creating it...`)
				const { data: newCategory, error: createCategoryError } = await supabase
					.from('categories')
					.insert([{ name: categoryNameToFind }]) // Create category with the letter name
					.select('id')
					.single() // Expecting a single row back after insert

				if (createCategoryError) {
					console.error('Error creating category:', createCategoryError)
					toast.error(
						`Failed to create category '${categoryNameToFind}'. Error: ${createCategoryError.message}`
					)
					setIsAddSectionModalOpen(false)
					return
				}

				if (!newCategory) {
					console.error('Failed to create category, no data returned after insert.')
					toast.error(`Failed to create category '${categoryNameToFind}'.`)
					setIsAddSectionModalOpen(false)
					return
				}

				categoryId = newCategory.id
				console.log('Successfully created new category with ID:', categoryId)
			}

			// Ensure we have a category ID before proceeding
			if (!categoryId) {
				console.error('Could not obtain a category ID.')
				toast.error('Could not determine the category for the section.')
				setIsAddSectionModalOpen(false)
				return
			}

			// 4. Prepare class data with all required fields
			const newClassData = {
				classname: sectionName,
				level_id: levelId,
				category_id: categoryId, // Use category_id based on the section letter
				createdby: currentUserId,
				// room: room // User removed this field again
			}

			console.log('Inserting class with data:', newClassData)

			// 5. Insert the new class (section)
			const { data: newClass, error: insertError } = await supabase
				.from('classes')
				.insert([newClassData])
				.select()

			if (insertError) {
				console.error('Supabase insert error:', insertError)
				console.error('Insert error object:', JSON.stringify(insertError, null, 2))
				throw insertError
			}

			console.log('Successfully created new section:', newClass)
			toast.success(`Created new section ${sectionName}`)

			// Reload the sections by triggering the useEffect
			setIsSectionsLoading(true)

			// Force a refresh by "changing" the selectedGradeForSections
			const currentGrade = selectedGradeForSections
			setSelectedGradeForSections(null)

			// Wait a moment then restore the grade to trigger a refresh
			setTimeout(() => {
				setSelectedGradeForSections(currentGrade)
				setIsSectionsLoading(false)
			}, 500)
		} catch (error) {
			console.error('Error creating new section:', error)
			if (error && typeof error === 'object') {
				const errorDetails = JSON.stringify(error, null, 2)
				console.error('Detailed error:', errorDetails)
			}
			toast.error('Failed to create new section. Please check the console for details.')
		} finally {
			setIsAddSectionModalOpen(false)
		}
	}

	// Function to handle deleting a student FROM THE CURRENT CLASS
	const handleDeleteStudentFromClass = (studentId: string, studentName: string) => {
		if (!selectedSection) {
			toast.error('Cannot remove student: No section selected.')
			return
		}
		setStudentToDeleteFromClass({ id: studentId, name: studentName })
		setIsDeleteModalOpen(true)
	}

	// Function to actually PERFORM the deletion after confirmation
	const confirmDeleteStudentFromClass = async () => {
		if (!studentToDeleteFromClass || !selectedSection) {
			toast.error('Deletion failed: Missing student or section information.')
			setIsDeleteModalOpen(false)
			return
		}

		const { id: studentId } = studentToDeleteFromClass

		// Find the class ID for the selected section
		const sectionObj = sections.find(s => s.name === selectedSection)
		if (!sectionObj) {
			toast.error('Selected section details not found.')
			setIsDeleteModalOpen(false)
			return
		}
		const classId = sectionObj.id

		console.log(`Confirmed removal of student ${studentId} from class ${classId}`)
		setIsStudentsLoading(true) // Indicate loading state
		setIsDeleteModalOpen(false) // Close modal immediately

		try {
			const { error } = await supabase
				.from('classstudents')
				.delete()
				.match({ classid: classId, studentid: studentId })

			if (error) {
				console.error('Error removing student from class:', error)
				throw error
			}

			toast.success(`Student ${studentToDeleteFromClass.name} removed from class successfully!`)

			// Update the local state to remove the student
			setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId))
		} catch (error) {
			toast.error('Failed to remove student from class. Please check console.')
		} finally {
			setIsStudentsLoading(false)
			setStudentToDeleteFromClass(null) // Clear the student to delete
		}
	}

	// Function to handle the actual class update
	const handleUpdateStudentClass = async (studentId: string, newClassId: string) => {
		console.log(`Updating class for student ${studentId} to new class ${newClassId}`)
		setIsStudentsLoading(true) // Show loading indicator

		try {
			// Update the student's record in the classstudents table
			const { error } = await supabase
				.from('classstudents')
				.update({ classid: newClassId })
				.eq('studentid', studentId)
			// Note: This updates ALL records for the student.
			// If a student could be in multiple classes and you only want to update
			// their record for the *original* class, you'd need the original classId
			// and use .match({ studentid: studentId, classid: originalClassId })

			if (error) {
				console.error('Error updating student class:', error)
				throw error
			}

			toast.success('Student class updated successfully!')

			// Update local state: Remove the student from the *current* view
			// as they have been moved to another class.
			setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId))
		} catch (error) {
			toast.error('Failed to update student class. Please check console.')
		} finally {
			setIsEditStudentClassModalOpen(false) // Close modal
			setStudentToEditClass(null) // Clear the student being edited
			setIsStudentsLoading(false) // Hide loading indicator
		}
	}

	// Add these new handler functions after other handler functions
	const handleEditSection = (section: Section) => {
		setCurrentSection(section)
		setEditingSectionId(section.id)
		setIsEditSectionModalOpen(true)
	}

	const handleAssignTeacher = (section: Section) => {
		setCurrentSection(section)
		setEditingSectionId(section.id)
		setIsAssignTeacherModalOpen(true)
	}

	// Update the handleSaveSection function to fix linter errors and 404 issues
	const handleSaveSection = async (sectionId: string, sectionName: string, room: string) => {
		try {
			console.log('Updating section with ID:', sectionId)
			console.log('New values:', { name: sectionName, room: room })

			// First get the section information
			const sectionToUpdate = sections.find(s => s.id === sectionId)

			if (!sectionToUpdate) {
				console.error('Section not found with ID:', sectionId)
				toast.error('Section not found')
				return
			}

			// Check if this is a real database section or a UI only section
			// In real data, we would update the 'classes' table
			const { error: checkError } = await supabase
				.from('classes')
				.select('id, classname, room')
				.eq('id', sectionId)
				.single()

			if (checkError) {
				console.error('Error checking if class exists:', checkError)
				console.error('Check error details:', JSON.stringify(checkError))
				toast.error('Could not access class data')
				return
			}

			// Update class in database - we're updating the 'classes' table, not 'sections'
			const { data: updatedClass, error } = await supabase
				.from('classes')
				.update({
					classname: sectionName,
					room: room,
				})
				.eq('id', sectionId)
				.select()

			if (error) {
				console.error('Supabase error when updating class:', error)
				console.error('Error details:', JSON.stringify(error))
				throw error
			}

			console.log('Class updated successfully:', updatedClass)

			// Update local state with new values
			setSections(prevSections =>
				prevSections.map(section =>
					section.id === sectionId ? { ...section, name: sectionName, room: room } : section
				)
			)

			// If section name changed, we need to update student view if we're looking at this section
			if (selectedSection === sectionToUpdate.name && sectionName !== sectionToUpdate.name) {
				setSelectedSection(sectionName)

				// Update any students viewed from this section to reflect the new section name
				setStudents(prevStudents =>
					prevStudents.map(student =>
						student.section === sectionToUpdate.name
							? { ...student, section: sectionName }
							: student
					)
				)
			}

			setIsEditSectionModalOpen(false)
			setCurrentSection(null)
			toast.success('Section updated successfully')

			// Refresh sections data
			if (selectedGradeForSections) {
				// Force a refresh by "changing" the selectedGradeForSections
				const currentGrade = selectedGradeForSections
				setSelectedGradeForSections(null)

				// Wait a moment then restore the grade to trigger a refresh
				setTimeout(() => {
					setSelectedGradeForSections(currentGrade)
				}, 500)
			}
		} catch (error) {
			console.error('Error updating section:', error)
			toast.error('Failed to update section')
		}
	}

	// Update handleSaveTeacher to use the correct column name and fix variable references
	const handleSaveTeacher = async (sectionId: string, teacherName: string, teacherId?: string) => {
		try {
			console.log(
				`Assigning teacher ${teacherName} (ID: ${
					teacherId || 'not provided'
				}) to section ${sectionId}`
			)

			// Find the section in our state to get additional info
			const sectionToUpdate = sections.find(s => s.id === sectionId)
			if (!sectionToUpdate) {
				console.error('Section not found with ID:', sectionId)
				toast.error('Section not found')
				return
			}

			// Update class in database - we're updating the 'classes' table
			// Fix: Use 'teacherid' (lowercase) to match the actual database column name
			const { data: updatedClass, error } = await supabase
				.from('classes')
				.update({
					teacherid: teacherId || null, // Fixed column name to match database
					// Don't update classname as it would change the section name too
				})
				.eq('id', sectionId)
				.select()

			if (error) {
				console.error('Supabase error when assigning teacher:', error)
				console.error('Error details:', JSON.stringify(error))
				throw error
			}

			console.log('Teacher assignment successful:', updatedClass)

			// Update local state
			setSections(prevSections =>
				prevSections.map(section =>
					section.id === sectionId ? { ...section, teacher: teacherName } : section
				)
			)

			setIsAssignTeacherModalOpen(false)
			toast.success('Teacher assigned successfully')
		} catch (error) {
			console.error('Error assigning teacher:', error)
			toast.error('Failed to assign teacher')
		}
	}

	// Add this new handler function
	const handleDeleteSection = (section: Section) => {
		setSectionToDelete(section)
		setIsDeleteSectionModalOpen(true)
	}

	const handleConfirmDeleteSection = async () => {
		if (!sectionToDelete) return

		try {
			console.log(`Deleting section with ID: ${sectionToDelete.id}, name: ${sectionToDelete.name}`)

      // Step 1: Delete associated student enrollments from classstudents
      console.log(`Deleting student enrollments for class ID: ${sectionToDelete.id}`);
      const { error: studentDeleteError } = await supabase
        .from('classstudents')
        .delete()
        .eq('classid', sectionToDelete.id);

      if (studentDeleteError) {
        console.error('Supabase error when deleting student enrollments:', studentDeleteError);
        // If it's a foreign key constraint on a table that references classstudents, this might be more complex.
        // For now, we'll assume direct deletion is okay or it might fail if other tables depend on classstudents.
        toast.error(`Failed to remove student enrollments: ${studentDeleteError.message}`);
        // Do not throw here if you want to attempt section deletion anyway, 
        // or throw if this step is critical before section deletion.
        // For now, we'll let it proceed to section deletion attempt but log the error.
      }

			// Step 2: Delete section from database - correct table name is 'classes', not 'sections'
			const { error } = await supabase.from('classes').delete().eq('id', sectionToDelete.id)

			if (error) {
				console.error('Supabase error when deleting section:', error)
				console.error('Error details:', JSON.stringify(error))
				throw error
			}

			console.log('Section deleted successfully')

			// Update local state
			setSections(prevSections => prevSections.filter(section => section.id !== sectionToDelete.id))

			// If we were viewing students from this section, go back to sections view
			if (selectedSection === sectionToDelete.name) {
				setShowStudents(false)
				setSelectedSection(null)
			}

			setIsDeleteSectionModalOpen(false)
			setSectionToDelete(null)
			toast.success('Section deleted successfully')
		} catch (error) {
			console.error('Error deleting section:', error)
      // Check if the error is the specific foreign key violation we encountered
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === '23503') {
        toast.error('Failed to delete section: Ensure all dependent data (like student enrollments) is removed first or set up cascading deletes in your database.');
      } else {
        toast.error('Failed to delete section')
      }
		}
	}

	const handleSaveClass = async (
		classId: string,
		className: string,
		attendanceDays: string[],
		attendanceTimes: string[],
		status: string
	) => {
		try {
			// Update only the name field which exists in the levels table
			const { error } = await supabase
				.from('levels')
				.update({
					name: className,
				})
				.eq('id', classId)

			if (error) throw error

			// Log what's not being saved
			console.log(
				'Note: Attendance days, times, and status are not being saved to the database because the columns do not exist'
			)

			// Update the local state to reflect changes in the UI
			setClasses(
				classes.map(cls =>
					cls.id === classId
						? {
								...cls,
								classname: className,
								attendanceDays,
								attendanceTimes,
								formattedDays: formatAttendanceDays(attendanceDays),
								formattedTimes: formatAttendanceTimes(attendanceTimes),
								status,
						  }
						: cls
				)
			)

			// Close the modal
			setIsEditClassModalOpen(false)
			toast.success('Class name updated successfully')
		} catch (error) {
			console.error('Error updating class:', error)
			toast.error('Failed to update class')
		}
	}

	const handleConfirmDeleteClass = async () => {
		if (!classToDelete) return

		try {
			// Delete the class from the database
			const { error } = await supabase.from('levels').delete().eq('id', classToDelete)

			if (error) throw error

			// Update the local state
			setClasses(classes.filter(cls => cls.id !== classToDelete))

			// Close the modal
			setIsDeleteModalOpen(false)
			setClassToDelete(null)
			toast.success('Class deleted successfully')
		} catch (error) {
			console.error('Error deleting class:', error)
			toast.error('Failed to delete class')
		}
	}

	const handleCreateClass = () => {
		// Check for create_classes permission before opening the modal
		withPermissionCheck(
			'create_classes',
			() => {
				setIsCreateClassModalOpen(true)
			},
			() => {
				toast.error("You don't have permission to create classes")
			}
		)
	}

	const handleSaveNewClass = async (className: string, status: string) => {
		withPermissionCheck(
			'create_classes',
			async () => {
				if (!className) {
					toast.error('Class name is required')
					return
				}

				if (!selectedClassType || !selectedClassType.id) {
					toast.error('No class type selected. Cannot create level.');
					console.error('Attempted to save new level without a selectedClassType.');
					setIsCreateClassModalOpen(false); // Close modal
					return;
				}

				try {
					const randomColor = generateRandomColor()

					// Prepare insertData with name, type_id, and optionally status
					let insertData: { name: string; type_id: string; status?: string } = {
						name: className,
						type_id: selectedClassType.id, // Associate with the selected ClassType
					}

					let response = await supabase.from('levels').insert([insertData]).select()

					// If there's an error specifically about the 'status' column not existing, try again without it
					if (
						response.error &&
						response.error.code === '42703' && // PostgreSQL error code for undefined_column
						response.error.message.toLowerCase().includes('column "status"') // Check if the message is about the "status" column
					) {
						console.log('Status field does not exist in the levels table, trying to insert without it.');
						delete insertData.status; // Remove status from the data
						// Retry insertion with { name, type_id }
						response = await supabase.from('levels').insert([insertData]).select();
					}

					// If we still have an error after potential retry, report it
					if (response.error) {
						console.error('Error saving new class (level):', response.error)
						toast.error('Failed to create class (level)')
						return
					}

					// Check if we have data
					if (!response.data || response.data.length === 0) {
						console.error('No data returned after insert')
						toast.error('Failed to create class (level) - no data returned')
						return
					}

					const newClassData = response.data[0]
					const newClass: Class = {
						id: newClassData.id,
						classname: newClassData.name,
						teacherName: 'No teacher assigned',
						attendanceDays: [], 
						attendanceTimes: [], 
						formattedDays: 'Not scheduled', 
						formattedTimes: 'Not scheduled', 
						students: 0, 
						status: newClassData.status || status, // Use DB status if available, else modal status
						color: randomColor,
						sectionCount: 0, 
					}

					setClasses([...classes, newClass])
					setCurrentClass(newClass) // This state might be for focusing/editing, ensure it's intended
					toast.success('Class (Level) created successfully')
					console.log('New class (level) saved:', newClass)
				} catch (error) {
					console.error('Error in handleSaveNewClass:', error)
					toast.error('An unexpected error occurred while creating the class (level)')
				}

				setIsCreateClassModalOpen(false)
			},
			() => {
				// This runs if the user lacks permission
				toast.error('You do not have permission to create classes')
				setIsCreateClassModalOpen(false)
			}
		)
	}

	// Renamed and repurposed from handleAssignTeacher
	const handleOpenManageSubjectTeachersModal = (section: Section) => {
		setCurrentSectionForSubjectTeachersModal(section)
		setIsManageSubjectTeachersModalOpen(true)
	}

	if (isLoading) {
		return (
			<ClassesContainer>
				<LoadingMessage>
					<LoadingSpinner />
					<span>Loading classes...</span>
				</LoadingMessage>
			</ClassesContainer>
		)
	}

	if (isLoadingClassTypes) {
		return (
			<ClassesContainer>
				<LoadingMessage>
					<LoadingSpinner />
					<span>Loading class types...</span>
				</LoadingMessage>
			</ClassesContainer>
		)
	}

	if (classTypesError) {
		return (
			<ClassesContainer>
				<div style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>
					<p>Error loading class types: {classTypesError}</p>
					<button onClick={() => { /* Implement refetch logic */ }}>Try Again</button>
				</div>
			</ClassesContainer>
		);
	}

	return (
		<ClassesContainer>
			{!selectedClassType && !showSections && !showStudents && (
				<>
					<HeaderSection>
						<div>
							<PageTitle>Class Types</PageTitle>
							<PageDescription>Select a class type to manage levels and sections.</PageDescription>
						</div>
						{/* Add button for creating new class type if needed */}
					</HeaderSection>
					{classTypes.length === 0 && !isLoadingClassTypes && (
						<EmptyState>
							<EmptyStateText>No class types found.</EmptyStateText>
							{/* Button to create class type */}
						</EmptyState>
					)}
					<ClassGrid> {/* Re-using ClassGrid for ClassTypes for now, might need a new style */}
						{classTypes.map(ct => (
							<ClassCard key={ct.id} $color={generateRandomColor()} onClick={() => setSelectedClassType(ct)}>
								<CardHeader $color={generateRandomColor()}>
									<ClassName color={generateRandomColor()}>{ct.name}</ClassName>
								</CardHeader>
							</ClassCard>
						))}
					</ClassGrid>
				</>
			)}

			{selectedClassType && !showSections && !showStudents && (
				<HeaderSection>
					<div>
						<PageTitleWithBack>
							<BackButton onClick={() => { setSelectedClassType(null); setClasses([]); /* Clear other states if needed */ }}>
								<FiArrowLeft />
								Back to Class Types
							</BackButton>
						</PageTitleWithBack>
						<PageTitle>{selectedClassType.name} - Levels</PageTitle>
						<PageDescription>Manage levels (e.g., grades) and their sections.</PageDescription>
					</div>
					<AddClassButton onClick={handleCreateClass}>
						<FiPlus />
						<span>Create New Class</span>
					</AddClassButton>
				</HeaderSection>
			)}

			{showStudents ? (
				// Students View
				<>
					<StudentsHeaderSection>
						<div>
							<PageTitleWithBack>
								<BackButton onClick={handleBackToClasses}>
									<FiArrowLeft />
									Back to {selectedClassType?.name ? `${selectedClassType.name} - Levels` : 'Levels'}
								</BackButton>
							</PageTitleWithBack>
							<PageTitle>{selectedSection} Students</PageTitle>
							<PageDescription>
								{filteredStudents.length} students in {selectedSection}
							</PageDescription>
						</div>

						<div style={{ display: 'flex', gap: '12px' }}>
							<AddButton
								onClick={() => {
									console.log('Add Students button clicked')
									handleOpenAddStudentsModal()
								}}
							>
								<FiPlus />
								<span>Add Students</span>
							</AddButton>
							{/* New Assign Teachers Button - Assuming this is a styled AddButton or similar */}
							<AddButton // Changed from ManageSubjectTeachersButton to AddButton, assuming similar style/functionality base
								onClick={() => {
									const currentSectionObject = sections.find(s => s.id === selectedClassId)
									if (currentSectionObject) {
										handleOpenManageSubjectTeachersModal(currentSectionObject)
									} else {
										toast.error('Could not find section details to manage subject teachers.')
										console.error(
											'Error: currentSectionObject not found for SMT modal, selectedClassId:',
											selectedClassId
										)
									}
								}}
							>
								<FiBookOpen /> 
								<span>Manage Subject Teachers</span>
							</AddButton>
							<ExportDataButton>
								<FiDownload />
								<span>Export Data</span>
							</ExportDataButton>
						</div>
					</StudentsHeaderSection>

					{isStudentsLoading ? (
						<LoadingMessage>
							<LoadingSpinner />
							<span>Loading students...</span>
						</LoadingMessage>
					) : (
						<StudentsView>
							{/* Search and Filter Controls */}
							<StudentsControls>
								<SearchContainer>
									<FiSearch />
									<SearchInput
										type='text'
										placeholder='Search students...'
										value={searchTerm}
										onChange={handleSearchChange}
									/>
								</SearchContainer>

								<StudentsFilterGroup>
									<div ref={studentFilterRef} style={{ position: 'relative' }}>
										<FilterButton
											onClick={() => {
												setStudentFilterOpen(!studentFilterOpen)
												setCourseFilterOpen(false)
											}}
											$isActive={studentFilterOpen}
										>
											<FiFilter />
											<span>Filter: {statusFilter === 'all' ? 'All' : statusFilter}</span>
											<FiChevronDown />
										</FilterButton>

										{studentFilterOpen && (
											<FilterDropdownMenu>
												<FilterOption
													onClick={() => handleStudentStatusFilterChange('all')}
													$isActive={statusFilter === 'all'}
												>
													All Students
												</FilterOption>
												<FilterOption
													onClick={() => handleStudentStatusFilterChange('active')}
													$isActive={statusFilter === 'active'}
												>
													Active
												</FilterOption>
												<FilterOption
													onClick={() => handleStudentStatusFilterChange('inactive')}
													$isActive={statusFilter === 'inactive'}
												>
													Inactive
												</FilterOption>
											</FilterDropdownMenu>
										)}
									</div>

									<div ref={courseFilterRef} style={{ position: 'relative' }}>
										<CourseFilterButton
											onClick={() => {
												setCourseFilterOpen(!courseFilterOpen)
												setStudentFilterOpen(false)
											}}
											$isActive={courseFilterOpen}
										>
											<FiBook />
											<span>Course: {courseFilter === 'all' ? 'All' : courseFilter}</span>
											<FiChevronDown />
										</CourseFilterButton>

										{courseFilterOpen && (
											<FilterDropdownMenu $isCourse>
												{getUniqueCourses().map((course, index) => (
													<FilterOption
														key={index}
														onClick={() => handleCourseFilterChange(course)}
														$isActive={courseFilter === course}
													>
														{course === 'all' ? 'All Courses' : course}
													</FilterOption>
												))}
											</FilterDropdownMenu>
										)}
									</div>
								</StudentsFilterGroup>
							</StudentsControls>

							{/* Students Table */}
							<StudentsTable>
								<StudentsTableHeader>
									<StudentsTableHeaderCell style={{ width: '28%' }}>
										<span>Student</span>
										<FiChevronDown />
									</StudentsTableHeaderCell>
									<StudentsTableHeaderCell style={{ width: '20%' }}>Grade</StudentsTableHeaderCell>
									<StudentsTableHeaderCell style={{ width: '20%' }}>
										Attendance
									</StudentsTableHeaderCell>
									<StudentsTableHeaderCell style={{ width: '20%' }}>Status</StudentsTableHeaderCell>
									<StudentsTableHeaderCell style={{ width: '20%' }}>
										Actions
									</StudentsTableHeaderCell>
								</StudentsTableHeader>

								<StudentsTableBody>
									{filteredStudents.map(student => (
										<StudentsTableRow key={student.id}>
											<StudentsTableCell style={{ width: '26%' }}>
												<StudentProfile>
													<StudentAvatar>{student.name.slice(0, 2)}</StudentAvatar>
													<StudentDetails>
														<StudentName>{student.name}</StudentName>
														<StudentEmail>{student.email}</StudentEmail>
													</StudentDetails>
												</StudentProfile>
											</StudentsTableCell>

											<StudentsTableCell style={{ width: '20%' }}>
												{selectedSection}
											</StudentsTableCell>

											<StudentsTableCell
												style={{ width: '17%', color: '#f59e0b', fontWeight: 'bold' }}
											>
												{student.attendance}%
											</StudentsTableCell>

											<StudentsTableCell style={{ width: '15%' }}>
												<StatusIndicator>
													<StatusDot $active={student.status === 'active'} />
													<span>{student.status === 'active' ? 'Active' : 'Inactive'}</span>
												</StatusIndicator>
											</StudentsTableCell>

											<StudentsTableCell style={{ width: '12%' }}>
												<StudentActionButtons>
													{/* Pass student ID and name to the handler */}
													<ActionIconButton
														onClick={() => handleDeleteStudentFromClass(student.id, student.name)}
														title='Remove from class'
													>
														<FiTrash2 />
													</ActionIconButton>
													{/* Use handleEditStudent for the edit icon */}
													<ActionIconButton
														onClick={() => handleEditStudent(student)}
														title='Change class'
													>
														<FiEdit />
													</ActionIconButton>
												</StudentActionButtons>
											</StudentsTableCell>
										</StudentsTableRow>
									))}
								</StudentsTableBody>
							</StudentsTable>

							{filteredStudents.length === 0 && (
								<EmptyState>
									<EmptyStateText>No students found in this section.</EmptyStateText>
								</EmptyState>
							)}
						</StudentsView>
					)}
				</>
			) : showSections ? (
				// Sections View - pass the handleBackToClasses function and handleCreateNewSection
				isSectionsLoading ? (
					<LoadingMessage>
						<LoadingSpinner />
						<span>Loading sections...</span>
					</LoadingMessage>
				) : (
					<SectionsComponent
						sections={filteredSections}
						searchTerm={sectionSearchTerm}
						grade={selectedGradeForSections!}
						onSearchChange={handleSectionSearchChange}
						onViewStudents={setViewingStudents}
						onBackToGrades={() => {setShowSections(false); /*setSelectedGradeForSections(null);*/} } // Keep selectedGradeForSections to know which level we are in
							onCreateNewSection={handleCreateNewSection}
							onEditSection={handleEditSection}
							onAssignTeacher={handleAssignTeacher}
							onDeleteSection={handleDeleteSection}
					/>
				)
			) : (
				// Default view: Levels for a selected ClassType, or nothing if no ClassType is selected.
				<>
					{selectedClassType && (
						<>
							<FiltersContainer>
								<SearchAndFilters>
									<SearchContainer>
										<FiSearch />
										<SearchInput
											type='text'
											placeholder='Search for levels...' // Updated placeholder
											value={searchTerm}
											onChange={handleSearchChange}
										/>
									</SearchContainer>

									<FilterDropdown>
										<select value={filterStatus} onChange={handleStatusFilterChange}>
											<option value=''>All Status</option>
											<option value='active'>Active</option>
											<option value='inactive'>Inactive</option>
										</select>
									</FilterDropdown>
								</SearchAndFilters>

								<ViewToggle>
									<ViewButton $isActive={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
										<FiGrid />
									</ViewButton>
									<ViewButton $isActive={viewMode === 'list'} onClick={() => setViewMode('list')}>
										<FiList />
									</ViewButton>
								</ViewToggle>
							</FiltersContainer>

							{isLoading && !isLoadingClassTypes && (
								<LoadingMessage>
									<LoadingSpinner />
									<span>Loading levels...</span>
								</LoadingMessage>
							)}

							{filteredClasses.length === 0 && !isLoading && (
								<EmptyState>
									<EmptyStateText>
										No levels found for {selectedClassType?.name}. Try adjusting your search or filters.
									</EmptyStateText>
								</EmptyState>
							)}

							{viewMode === 'grid' ? (
								<ClassGrid>
									{filteredClasses.map(cls => (
										<ClassCard key={cls.id} $color={cls.color} onClick={() => handleCardClick(cls)}>
											<CardHeader $color={cls.color}>
												<ClassName color={cls.color}>
													{!isNaN(Number(cls.classname)) ? (
														<ClassNumberDisplay color={cls.color}>{cls.classname}</ClassNumberDisplay>
													) : (
														cls.classname
													)}
												</ClassName>
												<CardActions
													onClick={e => {
														e.stopPropagation()
														toggleActionsMenu(cls.id)
													}}
												>
													<FiMoreHorizontal />
													<AnimatePresence>
														{isActionsMenuOpen === cls.id && (
															<ActionsMenu
																as={motion.div}
																initial={{ opacity: 0, y: -10 }}
																animate={{ opacity: 1, y: 0 }}
																exit={{ opacity: 0, y: -10 }}
																transition={{ duration: 0.2 }}
																onClick={e => e.stopPropagation()}
															>
																<ActionButton
																	$isPrimary={true}
																	onClick={e => {
																		e.stopPropagation()
																		handleEditClass(cls.id)
																	}}
																>
																	<FiEdit />
																	<span>Edit</span>
																</ActionButton>
																<ActionButton
																	$isPrimary={false}
																	onClick={e => {
																		e.stopPropagation()
																		handleDeleteClass(cls.id)
																	}}
																>
																	<FiTrash2 />
																	<span>Delete</span>
																</ActionButton>
															</ActionsMenu>
														)}
													</AnimatePresence>
												</CardActions>
											</CardHeader>

											<ClassDetails>
												<ClassStatus $status={cls.status}>
													{cls.status === 'active' ? 'Active' : 'Inactive'}
												</ClassStatus>
												<DetailItem>
													<FiLayers />
													<span>
														{cls.sectionCount} {cls.sectionCount === 1 ? 'Section' : 'Sections'}
													</span>
												</DetailItem>
											</ClassDetails>
										</ClassCard>
									))}
								</ClassGrid>
							) : (
								<ClassTable>
									<ClassTableHeader>
										<div className='class-number'>Level #</div> {/* Updated Header */}
										<div className='days'>Sections</div>
										<div className='times'>Times</div>
										<div className='status'>Status</div>
										<div className='actions'>Actions</div>
									</ClassTableHeader>
									{filteredClasses.map(cls => (
										<ClassTableRow key={cls.id} color={cls.color} onClick={() => handleCardClick(cls)}>
											<div className='class-number'>
												{!isNaN(Number(cls.classname)) ? (
													<ClassNumberDisplay color={cls.color}>{cls.classname}</ClassNumberDisplay>
												) : (
													cls.classname
												)}
											</div>
											<div className='days'>
												{cls.sectionCount} {cls.sectionCount === 1 ? 'Section' : 'Sections'}
											</div>
											<div className='times'>{cls.formattedTimes || 'Not scheduled'}</div>
											<div className='status'>
												<StatusBadge $status={cls.status}>
													{cls.status === 'active' ? 'Active' : 'Inactive'}
												</StatusBadge>
											</div>
											<div className='actions'>
												<ActionIconsContainer>
													<ActionIcon
														onClick={e => {
															e.stopPropagation()
															handleEditClass(cls.id)
														}}
														title='Edit'
													>
														<FiEdit />
													</ActionIcon>
													<ActionIcon
														onClick={e => {
															e.stopPropagation()
															handleDeleteClass(cls.id)
														}}
														title='Delete'
													>
														<FiTrash2 />
													</ActionIcon>
												</ActionIconsContainer>
											</div>
										</ClassTableRow>
									))}
								</ClassTable>
							)}
						</>
					)}
				</>
			)}

			{/* Add this near the end of the return statement, just before the closing </> of the Students View */}
			{showStudents && (
				<AddStudentModal
					isOpen={isAddStudentsModalOpen}
					onClose={handleCloseAddStudentsModal}
					onAddStudents={handleAddStudentsToClass}
					classId={sections.find(s => s.name === selectedSection)?.id || ''}
					excludedStudentIds={students.map(student => student.id)}
				/>
			)}

			{/* Add this near the end of the return statement, before the closing tag */}
			<AddSectionModal
				isOpen={isAddSectionModalOpen}
				onClose={() => setIsAddSectionModalOpen(false)}
				onAddSection={handleAddSectionFromModal}
				grade={selectedGradeForSections || ''}
				suggestedName={suggestedSectionName}
				suggestedRoom={suggestedRoomName}
			/>

			{/* Add the new EditStudentClassModal placeholder */}
			{studentToEditClass && (
				<EditStudentClassModal // Corrected component name reference
					isOpen={isEditStudentClassModalOpen}
					onClose={() => setIsEditStudentClassModalOpen(false)}
					onSave={handleUpdateStudentClass}
					student={studentToEditClass}
					currentClassId={sections.find(s => s.name === selectedSection)?.id || ''}
				/>
			)}

			{/* Add the DeleteConfirmationModal */}
			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDeleteStudentFromClass}
				itemName={studentToDeleteFromClass?.name || 'this student'}
				message={`Are you sure you want to remove ${
					studentToDeleteFromClass?.name || 'this student'
				} from the class ${selectedSection}? This action cannot be undone.`}
			/>

			{/* Add the new modals */}
			{currentSection && (
				<>
					<EditSectionModal
						isOpen={isEditSectionModalOpen}
						onClose={() => setIsEditSectionModalOpen(false)}
						onSave={handleSaveSection}
						section={currentSection}
					/>

					<AssignTeacherModal
						isOpen={isAssignTeacherModalOpen}
						onClose={() => setIsAssignTeacherModalOpen(false)}
						onSave={handleSaveTeacher}
						section={currentSection}
					/>
				</>
			)}

			{/* Add the delete confirmation modal */}
			<DeleteConfirmationModal
				isOpen={isDeleteSectionModalOpen}
				onClose={() => setIsDeleteSectionModalOpen(false)}
				onConfirm={handleConfirmDeleteSection}
				itemName={sectionToDelete ? `section ${sectionToDelete.name}` : 'this section'}
				title='Delete Section'
				message={
					sectionToDelete
						? `Are you sure you want to delete section ${sectionToDelete.name}? This will remove all student-section associations and cannot be undone.`
						: ''
				}
			/>

			{/* Add the EditClassModal */}
			{currentClass && (
				<EditClassModal
					isOpen={isEditClassModalOpen}
					onClose={() => setIsEditClassModalOpen(false)}
					onSave={handleSaveClass}
					classData={currentClass}
				/>
			)}

			{/* Add the DeleteConfirmationModal for classes */}
			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleConfirmDeleteClass}
				itemName='class'
				message={`Are you sure you want to delete this class? This will remove all associated sections and student enrollments and cannot be undone.`}
				title='Delete Class'
			/>

			{/* Add the CreateClassModal */}
			<CreateClassModal
				isOpen={isCreateClassModalOpen} // Ensure this uses isCreateClassModalOpen
				onClose={() => setIsCreateClassModalOpen(false)} // Ensure this uses setIsCreateClassModalOpen
				onSave={handleSaveNewClass}
			/>

			{/* Add the ManageClassSubjectTeachersModal */}
			<ManageClassSubjectTeachersModal
				isOpen={isManageSubjectTeachersModalOpen}
				onClose={() => setIsManageSubjectTeachersModalOpen(false)}
				section={currentSectionForSubjectTeachersModal}
			/>
		</ClassesContainer>
	)
}

// Add the AddStudentModal component
const AddStudentModal: React.FC<AddStudentModalProps> = ({
	isOpen,
	onClose,
	onAddStudents,
	classId, // This is the ID of the section we are adding students to
	excludedStudentIds, // Students already in THIS section
}) => {
	console.log('AddStudentModal render - isOpen:', isOpen, 'classId:', classId)
	const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])
	const [filteredStudents, setFilteredStudents] = useState<AvailableStudent[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// Add a mount/unmount logger
	useEffect(() => {
		console.log('AddStudentModal mounted')
		return () => {
			console.log('AddStudentModal unmounted')
		}
	}, [])

	// Count selected students (excluding those already in this section)
	const selectedCount = availableStudents.filter(student => student.selected && !excludedStudentIds.includes(student.id)).length

	// Effect to load available students
	useEffect(() => {
		const fetchAvailableStudents = async () => {
			setIsLoading(true)
			try {
				console.log('Fetching all students with role Student...');

				// Fetch ALL users with the 'Student' role
				const { data: allStudentsData, error: allStudentsError } = await supabase
					.from('users')
					.select('id, firstName, lastName, email, role')
					.eq('role', 'Student')

				if (allStudentsError) {
					console.error('Error fetching all students:', allStudentsError)
					throw allStudentsError
				}

				console.log(`Fetched ${allStudentsData?.length || 0} total student users.`)

				if (!allStudentsData || allStudentsData.length === 0) {
					console.log('No student users found in the database')
					setAvailableStudents([])
					setFilteredStudents([])
					setIsLoading(false)
					return
				}

				// Format all fetched students
				const formattedStudents = allStudentsData.map(user => ({
					id: user.id,
					name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User',
					email: user.email || 'No email',
					role: user.role || 'unknown',
					selected: false, // Initially not selected
				}))

				setAvailableStudents(formattedStudents)
				setFilteredStudents(formattedStudents) // Initially show all available
			} catch (error) {
				console.error('Error fetching available students:', error)
				toast.error('Failed to load available students. Check console.')
				setAvailableStudents([]) // Clear on error
				setFilteredStudents([])
			} finally {
				setIsLoading(false)
			}
		}

		if (isOpen) {
			fetchAvailableStudents()
		}
	}, [isOpen]) // excludedStudentIds is not strictly needed here as a dependency for fetching ALL students
                 // It will be used for UI rendering and selection logic.

	// Filter students based on search term
	useEffect(() => {
		if (searchTerm) {
			const lowerCaseSearch = searchTerm.toLowerCase()
			const filtered = availableStudents.filter(
				student =>
						student.name.toLowerCase().includes(lowerCaseSearch) ||
						student.email.toLowerCase().includes(lowerCaseSearch)
			)
			setFilteredStudents(filtered)
		} else {
			setFilteredStudents(availableStudents)
		}
	}, [searchTerm, availableStudents])

	// Handle search input change for student modal
	const handleStudentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Toggle student selection
	const toggleStudentSelection = (studentId: string) => {
    // Prevent selection if student is already in this specific section
    if (excludedStudentIds.includes(studentId)) {
      toast.info('This student is already in this section.');
      return;
    }
		setAvailableStudents(prevStudents =>
			prevStudents.map(student =>
				student.id === studentId ? { ...student, selected: !student.selected } : student
			)
		)
	}

	// Handle add students button click
	const handleAddStudents = () => {
		const selectedStudentIds = availableStudents
			.filter(student => student.selected)
			.map(student => student.id)

		if (selectedStudentIds.length > 0) {
			onAddStudents(selectedStudentIds)
		} else {
			toast.warning('Please select at least one student to add')
		}
	}

	if (!isOpen) return null

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={e => e.stopPropagation()}>
				<StudentModalHeader>
					<StudentModalTitle>Add Students to Class</StudentModalTitle>
					<StudentCloseButton onClick={onClose}>&times;</StudentCloseButton>
				</StudentModalHeader>

				<SearchStudentInput
					type='text'
					placeholder='Search students by name or email...'
					value={searchTerm}
					onChange={handleStudentSearchChange}
				/>

				{isLoading ? (
					<div style={{ textAlign: 'center', padding: '24px' }}>
						<LoadingSpinner />
						<div style={{ marginTop: '12px' }}>Loading students...</div>
					</div>
				) : (
					<>
						<SelectedCount>
							{selectedCount} student{selectedCount !== 1 ? 's' : ''} selected
						</SelectedCount>

						{filteredStudents.length === 0 ? (
							<div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
								No available students found
							</div>
						) : (
							<StudentsList>
								{filteredStudents.map(student => (
									<StudentItem
										key={student.id}
										$isSelected={student.selected}
                    // Pass a new prop to indicate if the student is already in this section
                    $isExcluded={excludedStudentIds.includes(student.id)}
										onClick={() => toggleStudentSelection(student.id)}
									>
										<StudentCheckbox
											type='checkbox'
											checked={student.selected}
											onChange={() => toggleStudentSelection(student.id)}
											onClick={e => e.stopPropagation()}
                      disabled={excludedStudentIds.includes(student.id)} // Disable if excluded
										/>
										<StudentInfo>
											<ModalStudentName>{student.name}</ModalStudentName>
											<ModalStudentEmail>
												{student.email}
												{student.role && (
													<span style={{ marginLeft: '8px', color: '#4F46E5', fontWeight: 'bold' }}>
														({student.role})
													</span>
												)}
                            {excludedStudentIds.includes(student.id) && (
                              <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                                (Already in this section)
                              </span>
                            )}
											</ModalStudentEmail>
										</StudentInfo>
									</StudentItem>
								))}
							</StudentsList>
						)}
					</>
				)}

				<ModalActions>
					<ClassModalCancelButton onClick={onClose}>Cancel</ClassModalCancelButton>
					<AddButton onClick={handleAddStudents} disabled={selectedCount === 0 || isLoading}>
						{isLoading
							? 'Adding...'
							: selectedCount > 0
							? `Add ${selectedCount} Student${selectedCount !== 1 ? 's' : ''}`
							: 'Add Students'}
					</AddButton>
				</ModalActions>
			</ModalContent>
		</ModalOverlay>
	)
}

// Fix the StudentName and StudentEmail components that were duplicated - add a prefix to the modal versions
const ModalStudentName = styled.div`
	font-weight: 500;
	color: #111827;
`

const ModalStudentEmail = styled.div`
	font-size: 12px;
	color: #6b7280;
`

// Add this new component at the bottom of the file, before export default
const AddSectionModal: React.FC<AddSectionModalProps> = ({
	isOpen,
	onClose,
	onAddSection,
	grade,
	suggestedName,
	suggestedRoom,
}) => {
	const [sectionName, setSectionName] = useState(suggestedName)
	const [roomName, setRoomName] = useState(suggestedRoom)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		setSectionName(suggestedName)
		setRoomName(suggestedRoom)
	}, [suggestedName, suggestedRoom])

	const handleSubmit = () => {
		if (!sectionName.trim()) {
			toast.error('Section name is required')
			return
		}
		// Room can be optional, so we don't need to validate it here

		setIsSubmitting(true)
		// Pass both sectionName and roomName to the handler
		onAddSection(sectionName, roomName || `Room ${suggestedName.slice(-1)}`) // Provide a default room if empty
		// Note: Setting submitting false here might be too early if onAddSection is async
		// It's better managed within the handleAddSectionFromModal finally block
	}

	if (!isOpen) return null

	return (
		<SectionModalOverlay>
			<SectionModalContainer>
				<SectionModalHeader>
					<SectionModalTitle>Add New Section for Grade {grade}</SectionModalTitle>
					<SectionCloseButton onClick={onClose}>×</SectionCloseButton>
				</SectionModalHeader>

				<SectionModalBody>
					<SectionModalLabel>Section Name *</SectionModalLabel>
					<SectionModalInput
						type='text'
						value={sectionName}
						onChange={e => setSectionName(e.target.value)}
						placeholder='e.g., 10A or 10B'
						required // Add required attribute
					/>

					<SectionModalLabel>Room (Optional)</SectionModalLabel>
					<SectionModalInput
						type='text'
						value={roomName}
						onChange={e => setRoomName(e.target.value)}
						placeholder={`e.g., Room ${suggestedName.slice(-1)}`}
					/>
				</SectionModalBody>

				<SectionModalFooter>
					<ClassModalCancelButton onClick={onClose}>Cancel</ClassModalCancelButton>
					<AddButton onClick={handleSubmit} disabled={isSubmitting || !sectionName.trim()}>
						{isSubmitting ? 'Adding...' : 'Add Section'}
					</AddButton>
				</SectionModalFooter>
			</SectionModalContainer>
		</SectionModalOverlay>
	)
}

// Add these styled components near the other modal styled components
const SectionModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`

const SectionModalContainer = styled.div`
	background-color: white;
	border-radius: 8px;
	width: 100%;
	max-width: 500px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const SectionModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 24px;
	border-bottom: 1px solid #e5e7eb;
`

const SectionModalTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #111827;
`

const SectionCloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	color: #6b7280;
	cursor: pointer;

	&:hover {
		color: #111827;
	}
`

const SectionModalBody = styled.div`
	padding: 24px;
`

const SectionModalLabel = styled.label`
	display: block;
	margin-bottom: 8px;
	font-size: 14px;
	font-weight: 500;
	color: #374151;
`

const SectionModalInput = styled.input`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	margin-bottom: 16px;

	&:focus {
		outline: none;
		border-color: #4f46e5;
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}
`

const SectionModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	padding: 16px 24px;
	border-top: 1px solid #e5e7eb;
	gap: 12px;
`

// Placeholder for EditStudentClassModal component
interface EditStudentClassModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (studentId: string, newClassId: string) => void
	student: Student
	currentClassId: string
}

const EditStudentClassModal: React.FC<EditStudentClassModalProps> = ({
	isOpen,
	onClose,
	onSave,
	student,
	currentClassId,
}) => {
	const [availableClasses, setAvailableClasses] = useState<Class[]>([])
	const [selectedClassId, setSelectedClassId] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)

	// Fetch available classes (excluding the current one)
	useEffect(() => {
		const fetchClasses = async () => {
			if (!isOpen) return
			setIsLoading(true)
			try {
				const { data, error } = await supabase
					.from('classes') // Assuming your classes/sections are in the 'classes' table
					.select('id, classname') // Fetch ID and name
				// Optionally filter out the current class: .neq('id', currentClassId)

				if (error) throw error
				// Cast the fetched data - adjust fields as needed based on your actual Class interface
				const fetchedClasses = (data || []).map(c => ({
					id: c.id,
					classname: c.classname,
					// Add other required fields from your Class interface with defaults if necessary
					teacherName: 'N/A',
					attendanceDays: null,
					attendanceTimes: null,
					formattedDays: 'N/A',
					formattedTimes: 'N/A',
					students: 0,
					status: 'active',
					color: '#cccccc',
				})) as Class[]
				setAvailableClasses(fetchedClasses.filter(c => c.id !== currentClassId)) // Filter out current class
			} catch (err) {
				console.error('Error fetching classes for modal:', err)
				toast.error('Could not load available classes.')
			} finally {
				setIsLoading(false)
			}
		}
		fetchClasses()
	}, [isOpen, currentClassId])

	const handleSave = () => {
		if (!selectedClassId) {
			toast.warning('Please select a new class.')
			return
		}
		onSave(student.id, selectedClassId)
	}

	if (!isOpen) return null

	return (
		<SectionModalOverlay onClick={onClose}>
			{' '}
			{/* Re-use SectionModal styles */}
			<SectionModalContainer onClick={e => e.stopPropagation()}>
				<SectionModalHeader>
					<SectionModalTitle>Change Class for {student.name}</SectionModalTitle>
					<SectionCloseButton onClick={onClose}>×</SectionCloseButton>
				</SectionModalHeader>
				<SectionModalBody>
					{isLoading ? (
						<LoadingMessage>Loading classes...</LoadingMessage>
					) : (
						<>
							<SectionModalLabel>Move to Class:</SectionModalLabel>
							<select
								value={selectedClassId}
								onChange={e => setSelectedClassId(e.target.value)}
								style={{ width: '100%', padding: '10px', marginBottom: '20px' }} // Basic styling
							>
								<option value=''>-- Select New Class --</option>
								{availableClasses.map(cls => (
									<option key={cls.id} value={cls.id}>
										{cls.classname} {/* Adjust if your display name is different */}
									</option>
								))}
							</select>
							{availableClasses.length === 0 && <p>No other classes available to move to.</p>}
						</>
					)}
				</SectionModalBody>
				<SectionModalFooter>
					<ClassModalCancelButton onClick={onClose}>Cancel</ClassModalCancelButton>
					<AddButton onClick={handleSave} disabled={isLoading || !selectedClassId}>
						Save Change
					</AddButton>
				</SectionModalFooter>
			</SectionModalContainer>
		</SectionModalOverlay>
	)
}

// Simple reusable Delete Confirmation Modal
interface DeleteConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	itemName: string
	message?: string
	title?: string
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	itemName,
	message = `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
	title = 'Confirm Deletion',
}) => {
	if (!isOpen) return null

	return (
		<SectionModalOverlay onClick={onClose}>
			{' '}
			{/* Reuse SectionModal styles */}
			<SectionModalContainer onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
				<SectionModalHeader>
					<SectionModalTitle>{title}</SectionModalTitle>
					<SectionCloseButton onClick={onClose}>×</SectionCloseButton>
				</SectionModalHeader>
				<SectionModalBody>
					<p style={{ margin: 0, lineHeight: '1.5', color: '#374151' }}>{message}</p>
				</SectionModalBody>
				<SectionModalFooter style={{ justifyContent: 'space-between' }}>
					<ClassModalCancelButton
						onClick={onClose}
						style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
					>
						Cancel
					</ClassModalCancelButton>
					<AddButton onClick={onConfirm} style={{ backgroundColor: '#ef4444' }}>
						Confirm Delete
					</AddButton>
				</SectionModalFooter>
			</SectionModalContainer>
		</SectionModalOverlay>
	)
}

// Add the new modal components at the end of the file
const EditSectionModal: React.FC<EditSectionModalProps> = ({
	isOpen,
	onClose,
	onSave,
	section,
}) => {
	const [sectionName, setSectionName] = useState(section.name)
	const [room, setRoom] = useState(section.room)

	// Reset form values whenever the section prop changes or modal opens
	useEffect(() => {
		if (isOpen && section) {
			setSectionName(section.name)
			setRoom(section.room)
		}
	}, [isOpen, section, section.id]) // Added section.id as dependency

	const handleSubmit = () => {
		if (!sectionName.trim()) {
			toast.error('Section name cannot be empty')
			return
		}

		onSave(section.id, sectionName, room)
	}

	if (!isOpen) return null

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
		>
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '8px',
					width: '400px',
					maxWidth: '90%',
					padding: '20px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '20px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Edit Section</h2>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '1.5rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '4px',
						}}
					>
						×
					</button>
				</div>

				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
						Section Name
					</label>
					<input
						type='text'
						value={sectionName}
						onChange={e => setSectionName(e.target.value)}
						style={{
							width: '100%',
							padding: '10px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '1rem',
						}}
						placeholder='Enter section name'
						autoFocus
					/>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Room</label>
					<input
						type='text'
						value={room}
						onChange={e => setRoom(e.target.value)}
						style={{
							width: '100%',
							padding: '10px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '1rem',
						}}
						placeholder='Enter room number'
					/>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
					<button
						onClick={onClose}
						style={{
							padding: '10px 16px',
							backgroundColor: '#f9fafb',
							color: '#374151',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						style={{
							padding: '10px 16px',
							backgroundColor: '#4338ca',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	)
}

// Update the AssignTeacherModal component to pass teacher ID when saving
const AssignTeacherModal: React.FC<AssignTeacherModalProps> = ({
	isOpen,
	onClose,
	onSave,
	section,
}) => {
	const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
	const [selectedTeacherName, setSelectedTeacherName] = useState<string>(section.teacher || '')
	const [availableTeachers, setAvailableTeachers] = useState<{ id: string; name: string }[]>([])
	const [isLoading, setIsLoading] = useState(false)

	// Fetch available teachers when the modal opens
	useEffect(() => {
		if (isOpen) {
			setSelectedTeacherName(section.teacher || '')
			setSelectedTeacherId('') // Reset the teacher ID when opening the modal
			fetchTeachers()
		}
	}, [isOpen, section])

	// Function to fetch teachers from the users table
	const fetchTeachers = async () => {
		setIsLoading(true)
		try {
			// Fetch users with 'Teacher' role from the database
			const { data: teachers, error } = await supabase
				.from('users')
				.select('id, firstName, lastName, role')
				.eq('role', 'Teacher')
				.order('lastName', { ascending: true })

			if (error) {
				console.error('Error fetching teachers:', error)
				toast.error('Failed to load teachers')
				return
			}

			if (teachers && teachers.length > 0) {
				// Format the teacher data for the dropdown
				const formattedTeachers = teachers.map(teacher => ({
					id: teacher.id,
					name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Unnamed Teacher',
				}))

				console.log(`Loaded ${formattedTeachers.length} teachers from database`)
				setAvailableTeachers(formattedTeachers)
			} else {
				console.log('No teachers found in the database')
				setAvailableTeachers([])
			}
		} catch (error) {
			console.error('Unexpected error fetching teachers:', error)
			toast.error('An error occurred while loading teachers')
		} finally {
			setIsLoading(false)
		}
	}

	// Handle teacher selection from dropdown
	const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const teacherId = e.target.value
		setSelectedTeacherId(teacherId)

		if (!teacherId) {
			// If "No teacher assigned" is selected
			setSelectedTeacherName('')
		} else {
			// Find the name of the selected teacher
			const teacher = availableTeachers.find(t => t.id === teacherId)
			setSelectedTeacherName(teacher ? teacher.name : '')
		}
	}

	const handleSubmit = () => {
		// Pass both teacher name and ID to the save function
		onSave(section.id, selectedTeacherName, selectedTeacherId)
	}

	if (!isOpen) return null

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
		>
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '8px',
					width: '400px',
					maxWidth: '90%',
					padding: '20px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '20px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
						Assign Teacher to {section.name}
					</h2>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '1.5rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '4px',
						}}
					>
						×
					</button>
				</div>

				<div style={{ marginBottom: '24px' }}>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
						Select Teacher
					</label>

					{isLoading ? (
						<div style={{ textAlign: 'center', padding: '10px' }}>Loading teachers...</div>
					) : (
						<select
							value={selectedTeacherId}
							onChange={handleTeacherChange}
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #e5e7eb',
								borderRadius: '4px',
								fontSize: '1rem',
							}}
						>
							<option value=''>No teacher assigned</option>
							{availableTeachers.map(teacher => (
								<option key={teacher.id} value={teacher.id}>
									{teacher.name}
								</option>
							))}
						</select>
					)}
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
					<button
						onClick={onClose}
						style={{
							padding: '10px 16px',
							backgroundColor: '#f9fafb',
							color: '#374151',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						style={{
							padding: '10px 16px',
							backgroundColor: '#4338ca',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Assign Teacher
					</button>
				</div>
			</div>
		</div>
	)
}

interface EditClassModalProps {
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

const EditClassModal: React.FC<EditClassModalProps> = ({ isOpen, onClose, onSave, classData }) => {
	const [className, setClassName] = useState(classData.classname)
	const [status, setStatus] = useState(classData.status || 'active')

	// Reset form when classData changes
	useEffect(() => {
		setClassName(classData.classname)
		setStatus(classData.status || 'active')
	}, [classData])

	const handleSubmit = () => {
		onSave(
			classData.id,
			className,
			[], // Empty attendance days array since we're not using it in this UI
			[], // Empty attendance times array since we're not using it in this UI
			status
		)
	}

	if (!isOpen) return null

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
		>
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '12px',
					width: '500px',
					maxWidth: '90%',
					overflow: 'hidden',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				}}
			>
				<div
					style={{
						padding: '16px 24px',
						borderBottom: '1px solid #e2e8f0',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<h2
						style={{
							margin: 0,
							fontSize: '20px',
							fontWeight: 600,
							color: '#1e293b',
						}}
					>
						Edit Class
					</h2>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '24px',
							color: '#64748b',
							cursor: 'pointer',
						}}
					>
						×
					</button>
				</div>

				<div
					style={{
						padding: '24px',
						display: 'flex',
						flexDirection: 'column',
						gap: '20px',
						maxHeight: '60vh',
						overflowY: 'auto',
					}}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
							Class Name
						</label>
						<input
							type='text'
							value={className}
							onChange={e => setClassName(e.target.value)}
							placeholder='Enter class name (e.g. Grade 10)'
							style={{
								padding: '10px 12px',
								borderRadius: '6px',
								border: '1px solid #cbd5e1',
								fontSize: '14px',
								color: '#1e293b',
							}}
						/>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Status</label>
						<select
							value={status}
							onChange={e => setStatus(e.target.value)}
							style={{
								padding: '10px 12px',
								borderRadius: '6px',
								border: '1px solid #cbd5e1',
								fontSize: '14px',
								color: '#1e293b',
							}}
						>
							<option value='active'>Active</option>
							<option value='inactive'>Inactive</option>
						</select>
					</div>
				</div>

				<div
					style={{
						padding: '16px 24px',
						borderTop: '1px solid #e2e8f0',
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '12px',
					}}
				>
					<button
						onClick={onClose}
						style={{
							padding: '10px 16px',
							borderRadius: '6px',
							backgroundColor: '#f1f5f9',
							color: '#64748b',
							border: 'none',
							fontSize: '14px',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						style={{
							padding: '10px 16px',
							borderRadius: '6px',
							backgroundColor: '#4F46E5',
							color: 'white',
							border: 'none',
							fontSize: '14px',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	)
}

// Define ErrorMessage component
const ErrorMessage = styled.div`
	color: #e53e3e;
	margin-bottom: 10px;
	font-size: 14px;
	text-align: left;
	width: 100%;
`

// Rename this to CreateClassCancelButton to avoid redeclaration
const CreateClassCancelButton = styled.button`
	padding: 8px 16px;
	background-color: #e2e8f0;
	color: #4a5568;
	border: none;
	border-radius: 4px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: #cbd5e0;
	}
`

interface CreateClassModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (className: string, status: string) => void
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onSave }) => {
	const [className, setClassName] = useState('')
	const [status, setStatus] = useState('active')
	const [error, setError] = useState('')

	const handleSave = () => {
		if (!className.trim()) {
			setError('Class name is required')
			return
		}

		onSave(className, status)
		setClassName('')
		setStatus('active')
		setError('')
	}

	const customModalStyles = {
		content: {
			top: '50%',
			left: '50%',
			right: 'auto',
			bottom: 'auto',
			marginRight: '-50%',
			transform: 'translate(-50%, -50%)',
			borderRadius: '8px',
			padding: '0',
			border: '1px solid #e2e8f0',
			maxWidth: '500px',
			width: '100%',
		},
		overlay: {
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			zIndex: 1000,
		},
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			style={customModalStyles}
			contentLabel='Create New Class'
			ariaHideApp={false}
		>
			<ModalHeader>
				<h2>Create New Class</h2>
				<CloseButton onClick={onClose}>&times;</CloseButton>
			</ModalHeader>
			<ModalBody>
				{error && <ErrorMessage>{error}</ErrorMessage>}
				<FormGroup>
					<label htmlFor='className'>Class Name</label>
					<input
						id='className'
						type='text'
						value={className}
						onChange={e => setClassName(e.target.value)}
						placeholder='Enter class name'
					/>
				</FormGroup>
				<FormGroup>
					<label htmlFor='classStatus'>Class Activity</label>
					<select
						id='classStatus'
						value={status}
						onChange={e => setStatus(e.target.value)}
						style={{
							padding: '10px 12px',
							borderRadius: '6px',
							border: '1px solid #cbd5e1',
							fontSize: '14px',
							color: '#1e293b',
							width: '100%',
						}}
					>
						<option value='active'>Active</option>
						<option value='inactive'>Inactive</option>
					</select>
				</FormGroup>
				<ButtonGroup>
					<CreateClassCancelButton type='button' onClick={onClose}>
						Cancel
					</CreateClassCancelButton>
					<SaveButton type='button' onClick={handleSave}>
						Create Class
					</SaveButton>
				</ButtonGroup>
			</ModalBody>
		</Modal>
	)
}

// Modal styles
const ModalHeader = styled.div`
	padding: 16px 24px;
	border-bottom: 1px solid #e2e8f0;
	display: flex;
	justify-content: space-between;
	align-items: center;

	h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #1e293b;
	}
`

const ModalBody = styled.div`
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	max-height: 60vh;
	overflow-y: auto;
`

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	color: #64748b;
	cursor: pointer;
`

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 16px;

	label {
		fontsize: 14px;
		fontweight: 500;
		color: #334155;
	}

	input {
		padding: 10px 12px;
		borderradius: 6px;
		border: 1px solid #cbd5e1;
		fontsize: 14px;
		color: #1e293b;
	}
`

const ButtonGroup = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 16px;
`

const Button = styled.button`
	padding: 10px 16px;
	borderradius: 6px;
	border: none;
	fontsize: 14px;
	fontweight: 500;
	cursor: pointer;
`

const ClassModalCancelButton = styled(Button)`
	background-color: #f1f5f9;
	color: #64748b;

	&:hover {
		background-color: #e2e8f0;
	}
`

const SaveButton = styled(Button)`
	background-color: #4f46e5;
	color: white;

	&:hover {
		background-color: #4338ca;
	}
`

// Add a function to generate random colors for classes
const generateRandomColor = () => {
	const colors = ['#4F46E5', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981']
	return colors[Math.floor(Math.random() * colors.length)]
}

// Add styled component for the new button, similar to AddButton or ExportDataButton
const ManageSubjectTeachersButton = styled(AddButton)`
	// Styles can be customized if needed
`

// Placeholder for the new Modal - to be defined properly later
interface ManageClassSubjectTeachersModalProps {
	isOpen: boolean
	onClose: () => void
	section: Section | null // The class/section we are managing teachers for
	// onSave: (classId: string, subjectTeacherAssignments: any[]) => void; // Define structure later
}

const ManageClassSubjectTeachersModal: React.FC<ManageClassSubjectTeachersModalProps> = ({
	isOpen,
	onClose,
	section,
}) => {
	const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')

	const [availableTeachers, setAvailableTeachers] = useState<{ id: string; name: string }[]>([])
	const [classSubjects, setClassSubjects] = useState<{ id: string; name: string }[]>([])
	const [currentAssignments, setCurrentAssignments] = useState<
		Array<{ subjectId: string; subjectName: string; teacherId: string; teacherName: string }>
	>([])

	const [isLoading, setIsLoading] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (isOpen && section) {
			fetchInitialModalData(section.id)
		}
	}, [isOpen, section])

	const fetchInitialModalData = async (classId: string) => {
		setIsLoading(true)
		try {
			// 1. Fetch all available teachers
			const { data: teachersData, error: teachersError } = await supabase
				.from('users')
				.select('id, firstName, lastName')
				.eq('role', 'Teacher')
			if (teachersError) throw teachersError
			const formattedTeachers =
				teachersData?.map(t => ({
					id: t.id,
					name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
				})) || []
			setAvailableTeachers(formattedTeachers)

			// 2. Fetch subjects associated with this class
			const { data: classSubjectLinks, error: classSubjectsError } = await supabase
				.from('classsubjects')
				.select('subjectid')
				.eq('classid', classId)
			if (classSubjectsError) throw classSubjectsError
			const subjectIds = classSubjectLinks?.map(link => link.subjectid) || []

			let fetchedClassSubjects: { id: string; name: string }[] = []
			if (subjectIds.length > 0) {
				const { data: subjectsData, error: subjectsError } = await supabase
					.from('subjects')
					.select('id, subjectname')
					.in('id', subjectIds)
				if (subjectsError) throw subjectsError
				fetchedClassSubjects = subjectsData?.map(s => ({ id: s.id, name: s.subjectname })) || []
			}
			setClassSubjects(fetchedClassSubjects)

			// 3. Fetch current assignments from classteachers for this class, joining with subjects and users
			await fetchCurrentAssignments(classId)
		} catch (error) {
			console.error('Error fetching initial data for modal:', error)
			toast.error('Failed to load initial data.')
		} finally {
			setIsLoading(false)
		}
	}

	const fetchCurrentAssignments = async (classId: string) => {
		// Helper to prevent race conditions if called multiple times
		// setIsLoading(true); // Usually set by the caller
		try {
			const { data: assignmentsData, error: assignmentsError } = await supabase
				.from('classteachers')
				.select(
					`
                subjectid,
                teacherid,
                subjects (subjectname),
                users (firstName, lastName)
            `
				)
				.eq('classid', classId)

			if (assignmentsError) throw assignmentsError

			const formattedAssignments =
				assignmentsData?.map(a => ({
					subjectId: a.subjectid,
					subjectName: (a.subjects as any)?.subjectname || 'Unknown Subject',
					teacherId: a.teacherid,
					teacherName:
						`${(a.users as any)?.firstName || ''} ${(a.users as any)?.lastName || ''}`.trim() ||
						'Unknown Teacher',
				})) || []
			setCurrentAssignments(formattedAssignments)
		} catch (error) {
			console.error('Error fetching current assignments:', error)
			toast.error('Failed to load current assignments.')
		} finally {
			// setIsLoading(false);
		}
	}

	const handleAssignTeacherToSubject = async () => {
		if (!section || !selectedTeacherId || !selectedSubjectId) {
			toast.warn('Please select a teacher and a subject.')
			return
		}

		// Check if this assignment already exists
		const alreadyExists = currentAssignments.some(
			a => a.subjectId === selectedSubjectId && a.teacherId === selectedTeacherId
		)
		if (alreadyExists) {
			toast.info('This teacher is already assigned to this subject for this class.')
			return
		}

		setIsSubmitting(true)
		try {
			const { error } = await supabase.from('classteachers').insert({
				classid: section.id,
				subjectid: selectedSubjectId,
				teacherid: selectedTeacherId,
			})
			if (error) throw error
			toast.success('Teacher assigned to subject successfully!')
			await fetchCurrentAssignments(section.id) // Refresh the list
			setSelectedSubjectId('') // Reset subject selection
			// Optionally reset teacher selection or keep it for assigning to another subject
		} catch (error) {
			console.error('Error assigning teacher to subject:', error)
			toast.error(
				'Failed to assign teacher. They might already be assigned to another subject in this class if your table has constraints, or an unexpected error occurred.'
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleRemoveAssignment = async (subjectId: string, teacherId: string) => {
		if (!section) return
		setIsSubmitting(true)
		try {
			const { error } = await supabase
				.from('classteachers')
				.delete()
				.match({ classid: section.id, subjectid: subjectId, teacherid: teacherId })
			if (error) throw error
			toast.success('Teacher assignment removed successfully!')
			await fetchCurrentAssignments(section.id) // Refresh the list
		} catch (error) {
			console.error('Error removing assignment:', error)
			toast.error('Failed to remove assignment.')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isOpen || !section) return null

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent
				onClick={e => e.stopPropagation()}
				style={{ width: '800px', maxHeight: '90vh' }}
			>
				<ModalHeader>
					<h2 style={{ fontSize: '18px' }}>Manage Subject Teachers for {section.name}</h2>
					<CloseButton onClick={onClose}>&times;</CloseButton>
				</ModalHeader>
				<ModalBody>
					{isLoading ? (
						<LoadingMessage>Loading data...</LoadingMessage>
					) : (
						<>
							<NewAssignmentSection>
								<h3>Assign New Teacher to Subject</h3>
								<div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
									<ModalFormGroup>
										<label>Teacher</label>
										<StyledSelect
											value={selectedTeacherId}
											onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
												setSelectedTeacherId(e.target.value)
											}
										>
											<option value=''>-- Select Teacher --</option>
											{availableTeachers.map(teacher => (
												<option key={teacher.id} value={teacher.id}>
													{teacher.name}
												</option>
											))}
										</StyledSelect>
									</ModalFormGroup>
									<ModalFormGroup>
										<label>Subject for this Class</label>
										<StyledSelect
											value={selectedSubjectId}
											onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
												setSelectedSubjectId(e.target.value)
											}
											disabled={classSubjects.length === 0}
										>
											<option value=''>-- Select Subject --</option>
											{classSubjects.map(subject => (
												<option key={subject.id} value={subject.id}>
													{subject.name}
												</option>
											))}
											{classSubjects.length === 0 && <option disabled>No subjects linked</option>}
										</StyledSelect>
									</ModalFormGroup>
									<AddButton
										onClick={handleAssignTeacherToSubject}
										disabled={isSubmitting || !selectedTeacherId || !selectedSubjectId}
										style={{ height: '44px', padding: '10px 16px', flexShrink: 0 }}
									>
										{isSubmitting ? 'Assigning...' : 'Assign'}
									</AddButton>
								</div>
							</NewAssignmentSection>

							<CurrentAssignmentsSection>
								<h3>Current Assignments</h3>
								{currentAssignments.length === 0 ? (
									<p
										style={{
											fontSize: '14px',
											color: '#6b7280',
											textAlign: 'center',
											padding: '20px 0',
										}}
									>
										No teachers are assigned to subjects yet.
									</p>
								) : (
									<AssignmentsTable>
										<thead>
											<tr>
												<th>Subject</th>
												<th>Teacher</th>
												<th style={{ textAlign: 'center' }}>Action</th>
											</tr>
										</thead>
										<tbody>
											{currentAssignments.map((assignment, index) => (
												<tr key={`${assignment.subjectId}-${assignment.teacherId}-${index}`}>
													<td>{assignment.subjectName}</td>
													<td>{assignment.teacherName}</td>
													<td>
														<button
															onClick={() =>
																handleRemoveAssignment(assignment.subjectId, assignment.teacherId)
															}
															disabled={isSubmitting}
															title='Remove assignment'
														>
															<FiTrash2 />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</AssignmentsTable>
								)}
							</CurrentAssignmentsSection>
						</>
					)}
				</ModalBody>
				<ModalActions>
					<ClassModalCancelButton onClick={onClose}>Close</ClassModalCancelButton>
				</ModalActions>
			</ModalContent>
		</ModalOverlay>
	)
}

// Styled components for the new modal sections
const NewAssignmentSection = styled.div`
	padding-bottom: 20px;
	border-bottom: 1px solid #eee;
	margin-bottom: 20px;
	h3 {
		margin-top: 0;
	}
`

const CurrentAssignmentsSection = styled.div`
	h3 {
		margin-top: 0;
	}
`

const AssignmentsTable = styled.table`
	width: 100%;
	border-collapse: separate; // Use separate for borders inside radius
	border-spacing: 0;
	margin-top: 10px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden; // Needed for border-radius on table

	th,
	td {
		padding: 12px 15px;
		text-align: left;
		font-size: 14px;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #4b5563;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tbody tr:hover {
		background-color: #f3f4f6;
	}

	td:last-child {
		text-align: center;
	}

	button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		color: #ef4444; // Red color for remove
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;

		&:hover {
			background-color: #fee2e2;
		}
		&:disabled {
			color: #ccc;
			cursor: not-allowed;
			background-color: transparent;
		}
		svg {
			width: 16px;
			height: 16px;
		}
	}
`

const ModalFormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	flex: 1; // Allow flex-grow

	label {
		font-size: 13px;
		font-weight: 500;
		color: #374151;
	}
`

const StyledSelect = styled.select`
	padding: 10px 12px;
	border-radius: 6px;
	border: 1px solid #d1d5db;
	font-size: 14px;
	background-color: white;
	height: 44px; // Match button height
	width: 100%;

	&:focus {
		outline: none;
		border-color: #4f46e5;
		box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
	}

	&:disabled {
		background-color: #f3f4f6;
		cursor: not-allowed;
	}
`
