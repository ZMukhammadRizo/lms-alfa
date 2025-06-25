import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiArrowLeft,
	FiChevronRight,
	FiEdit,
	FiMapPin,
	FiMoreHorizontal,
	FiPlus,
	FiSearch,
	FiTrash,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import supabase from '../../../config/supabaseClient'
import {
	AddButton,
	BackButton,
	ClassesContainer,
	EmptyState,
	EmptyStateActionButton,
	EmptyStateText,
	LoadingMessage,
	LoadingSpinner,
	SectionCard,
	SectionDetail,
	SectionHeaderContainer,
	SectionIcon,
	SectionIconLabel,
	SectionLabel,
	SectionPageDescription,
	SectionPageTitle,
	SectionRow,
	SectionSearchContainer,
	SectionSearchInput,
	SectionsGrid,
	SectionValue,
} from './shared/styledComponents'
import { ClassType, Section } from './shared/types'

const SectionsPage: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { typeId, levelId } = useParams()
	const [sections, setSections] = useState<Section[]>([])
	const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null)
	const [levelName, setLevelName] = useState<string>('')
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

	// Modal states
	const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)
	const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false)
	const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false)
	const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false)
	const [currentSection, setCurrentSection] = useState<Section | null>(null)
	const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
	const [suggestedSectionName, setSuggestedSectionName] = useState('')
	const [suggestedRoomName, setSuggestedRoomName] = useState('')

	// Fetch class type and level information
	useEffect(() => {
		const fetchClassTypeAndLevel = async () => {
			if (!typeId || !levelId) return

			try {
				// Fetch class type
				const { data: classType } = await supabase
					.from('class_types')
					.select('*')
					.eq('id', typeId)
					.single()

				if (classType) {
					setSelectedClassType(classType)
				}

				// Fetch level
				const { data: level } = await supabase
					.from('levels')
					.select('name')
					.eq('id', levelId)
					.single()

				if (level) {
					setLevelName(level.name)
				}
			} catch (error) {
				console.error('Error fetching class type and level:', error)
				toast.error('Failed to load class type and level information')
			}
		}

		fetchClassTypeAndLevel()
	}, [typeId, levelId])

	// Fetch sections for the level
	useEffect(() => {
		const fetchSections = async () => {
			if (!levelId) return

			setIsLoading(true)
			try {
				// Fetch sections using the level ID
				const { data: classesData, error: sectionsError } = await supabase
					.from('classes')
					.select('*')
					.eq('level_id', levelId)

				if (sectionsError) throw sectionsError

				if (!classesData || classesData.length === 0) {
					console.log(`No sections found for level ID ${levelId}`)
					setSections([])
					setIsLoading(false)
					return
				}

				// Process each class into a section format
				const processedSections = await Promise.all(
					(classesData || []).map(async cls => {
						// Get teacher name from the joined users data
						let teacher = 'No teacher assigned'

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
						}

						// Count students in this class
						const { count: studentCount, error: countError } = await supabase
							.from('classstudents')
							.select('*', { count: 'exact', head: true })
							.eq('classid', cls.id)

						if (countError) console.error('Error counting students:', countError)

						// For now, use a random performance value between 70-100
						const performance = Math.floor(Math.random() * 30) + 70

						return {
							id: cls.id,
							name: cls.classname,
							room: cls.room || `Room ${cls.id.substring(0, 3)}`,
							students: studentCount || 0,
							teacher,
							performance,
							grade: levelName,
						}
					})
				)

				console.log('Processed sections with teacher info:', processedSections)
				setSections(processedSections)
			} catch (error) {
				console.error('Error fetching sections:', error)
				toast.error('Failed to load sections')
			} finally {
				setIsLoading(false)
			}
		}

		fetchSections()
	}, [levelId, levelName])

	// Handle navigation
	const handleBackToLevels = () => {
		navigate(`/admin/classes/types/${typeId}`)
	}

	const handleViewStudents = (grade: string, sectionName: string | null) => {
		const section = sections.find(s => s.name === sectionName)
		if (section) {
			navigate(`/admin/classes/types/${typeId}/levels/${levelId}/sections/${section.id}`)
		}
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	// Section management handlers
	const handleCreateNewSection = () => {
		if (!levelName) return

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
		const isNumericGrade = !isNaN(Number(levelName))

		// Set suggested values based on grade type
		let suggestedName
		if (isNumericGrade) {
			// For numeric grades, use format like "10A"
			suggestedName = `${levelName}${nextSectionLetter}`
		} else {
			// For named grades, use format like "Middle School A"
			suggestedName = `${levelName} ${nextSectionLetter}`
		}

		setSuggestedSectionName(suggestedName)
		setSuggestedRoomName(`Room ${nextSectionLetter}`)

		// Open the modal
		setIsAddSectionModalOpen(true)
	}

	const handleAddSectionFromModal = async (sectionName: string, room: string) => {
		if (!levelId) {
			toast.error('No level selected')
			setIsAddSectionModalOpen(false)
			return
		}

		try {
			console.log('Creating new section:', { sectionName, room, levelId })

			// Get current user session
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

			// Extract section letter and find or create category ID
			const sectionLetterMatch = sectionName.match(/([A-Z])$/i)
			const sectionLetter = sectionLetterMatch ? sectionLetterMatch[1].toUpperCase() : null

			if (!sectionLetter) {
				console.error('Could not extract section letter from name:', sectionName)
				toast.error(
					'Invalid section name format. Section name should end with a letter (e.g., "10A" or "Middle School A").'
				)
				setIsAddSectionModalOpen(false)
				return
			}

			let categoryId: string | null = null
			const categoryNameToFind = sectionLetter

			// Try to find the category
			const { data: existingCategory, error: findCategoryError } = await supabase
				.from('categories')
				.select('id')
				.eq('name', categoryNameToFind)
				.limit(1)

			if (findCategoryError) {
				console.error('Error searching for category:', findCategoryError)
				toast.error(`Error checking for category '${categoryNameToFind}'.`)
				setIsAddSectionModalOpen(false)
				return
			}

			if (existingCategory && existingCategory.length > 0) {
				categoryId = existingCategory[0].id
				console.log('Found existing category ID:', categoryId, 'for name', categoryNameToFind)
			} else {
				// Create new category
				console.log(`Category '${categoryNameToFind}' not found, creating it...`)
				const { data: newCategory, error: createCategoryError } = await supabase
					.from('categories')
					.insert([{ name: categoryNameToFind }])
					.select('id')
					.single()

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

			if (!categoryId) {
				console.error('Could not obtain a category ID.')
				toast.error('Could not determine the category for the section.')
				setIsAddSectionModalOpen(false)
				return
			}

			// Prepare class data
			const newClassData = {
				classname: sectionName,
				level_id: levelId,
				category_id: categoryId,
				createdby: currentUserId,
			}

			console.log('Inserting class with data:', newClassData)

			// Insert the new class (section)
			const { data: newClass, error: insertError } = await supabase
				.from('classes')
				.insert([newClassData])
				.select()

			if (insertError) {
				console.error('Supabase insert error:', insertError)
				throw insertError
			}

			console.log('Successfully created new section:', newClass)
			toast.success(`Created new section ${sectionName}`)

			// Refresh sections
			const refreshSections = async () => {
				setIsLoading(true)
				// Re-trigger the fetch by updating the effect dependencies
				setTimeout(() => {
					setIsLoading(false)
				}, 500)
			}

			await refreshSections()
		} catch (error) {
			console.error('Error creating new section:', error)
			toast.error('Failed to create new section. Please check the console for details.')
		} finally {
			setIsAddSectionModalOpen(false)
		}
	}

	const handleEditSection = (section: Section) => {
		setCurrentSection(section)
		setIsEditSectionModalOpen(true)
	}

	const handleSaveSection = async (sectionId: string, sectionName: string, room: string) => {
		try {
			console.log('Updating section with ID:', sectionId)
			console.log('New values:', { name: sectionName, room: room })

			const sectionToUpdate = sections.find(s => s.id === sectionId)
			if (!sectionToUpdate) {
				console.error('Section not found with ID:', sectionId)
				toast.error('Section not found')
				return
			}

			// Update class in database
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
				throw error
			}

			console.log('Class updated successfully:', updatedClass)

			// Update local state
			setSections(prevSections =>
				prevSections.map(section =>
					section.id === sectionId ? { ...section, name: sectionName, room: room } : section
				)
			)

			setIsEditSectionModalOpen(false)
			setCurrentSection(null)
			toast.success('Section updated successfully')
		} catch (error) {
			console.error('Error updating section:', error)
			toast.error('Failed to update section')
		}
	}

	const handleAssignTeacher = (section: Section) => {
		setCurrentSection(section)
		setIsAssignTeacherModalOpen(true)
	}

	const handleSaveTeacher = async (sectionId: string, teacherName: string, teacherId?: string) => {
		try {
			console.log(
				`Assigning teacher ${teacherName} (ID: ${
					teacherId || 'not provided'
				}) to section ${sectionId}`
			)

			const sectionToUpdate = sections.find(s => s.id === sectionId)
			if (!sectionToUpdate) {
				console.error('Section not found with ID:', sectionId)
				toast.error('Section not found')
				return
			}

			// Update class in database
			const { data: updatedClass, error } = await supabase
				.from('classes')
				.update({
					teacherid: teacherId || null,
				})
				.eq('id', sectionId)
				.select()

			if (error) {
				console.error('Supabase error when assigning teacher:', error)
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

	const handleDeleteSection = (section: Section) => {
		setSectionToDelete(section)
		setIsDeleteSectionModalOpen(true)
	}

	const handleConfirmDeleteSection = async () => {
		if (!sectionToDelete) return

		try {
			console.log(`Deleting section with ID: ${sectionToDelete.id}, name: ${sectionToDelete.name}`)

			// Delete associated student enrollments
			const { error: studentDeleteError } = await supabase
				.from('classstudents')
				.delete()
				.eq('classid', sectionToDelete.id)

			if (studentDeleteError) {
				console.error('Supabase error when deleting student enrollments:', studentDeleteError)
				toast.error(`Failed to remove student enrollments: ${studentDeleteError.message}`)
			}

			// Delete section from database
			const { error } = await supabase.from('classes').delete().eq('id', sectionToDelete.id)

			if (error) {
				console.error('Supabase error when deleting section:', error)
				throw error
			}

			console.log('Section deleted successfully')

			// Update local state
			setSections(prevSections => prevSections.filter(section => section.id !== sectionToDelete.id))

			setIsDeleteSectionModalOpen(false)
			setSectionToDelete(null)
			toast.success('Section deleted successfully')
		} catch (error) {
			console.error('Error deleting section:', error)
			toast.error('Failed to delete section')
		}
	}

	// Menu handlers
	const toggleMenu = (e: React.MouseEvent, sectionId: string) => {
		e.stopPropagation()
		setActiveMenuId(activeMenuId === sectionId ? null : sectionId)
	}

	const handleMenuItemClick = (e: React.MouseEvent, action: string, section: Section) => {
		e.stopPropagation()
		setActiveMenuId(null)

		switch (action) {
			case 'edit':
				handleEditSection(section)
				break
			case 'assignTeacher':
				handleAssignTeacher(section)
				break
			case 'delete':
				handleDeleteSection(section)
				break
		}
	}

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			setActiveMenuId(null)
		}

		document.addEventListener('click', handleClickOutside)
		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [])

	// Filter sections based on search term
	const filteredSections = sections.filter(section => {
		if (!searchTerm) return true

		const termLower = searchTerm.toLowerCase()
		return (
			(section.name && section.name.toLowerCase().includes(termLower)) ||
			(section.teacher && section.teacher.toLowerCase().includes(termLower)) ||
			(section.room && section.room.toLowerCase().includes(termLower))
		)
	})

	// Sort sections alphabetically by name
	const sortedSections = [...filteredSections].sort((a, b) => a.name.localeCompare(b.name))

	if (isLoading) {
		return (
			<ClassesContainer>
				<LoadingMessage>
					<LoadingSpinner />
					<span>{t('classes.loadingSections')}</span>
				</LoadingMessage>
			</ClassesContainer>
		)
	}

	return (
		<ClassesContainer>
			<SectionHeaderContainer>
				<BackButton onClick={handleBackToLevels}>
					<FiArrowLeft />
					Back to Levels
				</BackButton>
				<SectionPageTitle>
					{/* Show just the level name if it's not a number, otherwise show "Grade X" */}
					{isNaN(Number(levelName)) ? `${levelName} Sections` : `Grade ${levelName} Sections`}
				</SectionPageTitle>
				<SectionPageDescription>
					{sections.length} sections in{' '}
					{isNaN(Number(levelName)) ? levelName : `Grade ${levelName}`}
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
						placeholder={t('classes.searchSections')}
						value={searchTerm}
						onChange={handleSearchChange}
					/>
				</SectionSearchContainer>

				<AddButton
					onClick={handleCreateNewSection}
					style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
				>
					<FiPlus />
					<span>{t('classes.createNewSection')}</span>
				</AddButton>
			</div>

			{sortedSections.length === 0 ? (
				<EmptyState>
					<EmptyStateText>
						No sections found for {isNaN(Number(levelName)) ? levelName : `Grade ${levelName}`}.
					</EmptyStateText>
					<EmptyStateActionButton onClick={handleCreateNewSection}>
						<FiPlus />
						Create Your First Section
					</EmptyStateActionButton>
				</EmptyState>
			) : (
				<SectionsGrid>
					{sortedSections.map((section, index) => (
						<SectionCard
							key={section.id}
							as={motion.div}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							onClick={() => handleViewStudents(levelName, section.name)}
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
										title={t('classes.sectionOptions')}
									>
										<FiMoreHorizontal size={18} color='#4338ca' />
									</button>

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
												{t('classes.editSection')}
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
												{t('classes.assignTeacher')}
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
												{t('classes.deleteSection')}
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
									<span>{t('classes.students')}</span>
								</SectionIconLabel>
								<SectionValue>{section.students}</SectionValue>
							</SectionRow>

							<SectionRow>
								<SectionIconLabel>
									<FiUserCheck />
									<span>{t('userManagement.teacher')}</span>
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
									e.stopPropagation()
									handleViewStudents(levelName, section.name)
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
								<span>{t('classes.students')}</span>
								<FiChevronRight style={{ transition: 'transform 0.3s ease' }} />
							</button>
						</SectionCard>
					))}
				</SectionsGrid>
			)}

			{/* TODO: Add modal components here when they are created */}
			{/* <AddSectionModal
				isOpen={isAddSectionModalOpen}
				onClose={() => setIsAddSectionModalOpen(false)}
				onAddSection={handleAddSectionFromModal}
				grade={levelName}
				suggestedName={suggestedSectionName}
				suggestedRoom={suggestedRoomName}
			/>
			<EditSectionModal
				isOpen={isEditSectionModalOpen}
				onClose={() => setIsEditSectionModalOpen(false)}
				onSave={handleSaveSection}
				section={currentSection!}
			/>
			<AssignTeacherModal
				isOpen={isAssignTeacherModalOpen}
				onClose={() => setIsAssignTeacherModalOpen(false)}
				onSave={handleSaveTeacher}
				section={currentSection!}
			/>
			<DeleteConfirmationModal
				isOpen={isDeleteSectionModalOpen}
				onClose={() => setIsDeleteSectionModalOpen(false)}
				onConfirm={handleConfirmDeleteSection}
				itemName={sectionToDelete?.name || ''}
				title='Delete Section'
				message='Are you sure you want to delete this section? This action cannot be undone.'
			/> */}
		</ClassesContainer>
	)
}

export default SectionsPage
