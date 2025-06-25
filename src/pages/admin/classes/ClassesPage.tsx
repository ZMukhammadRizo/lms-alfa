import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FiArrowLeft,
	FiEdit,
	FiGrid,
	FiLayers,
	FiList,
	FiMoreHorizontal,
	FiPlus,
	FiSearch,
	FiTrash2,
} from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import supabase from '../../../config/supabaseClient'
import {
	ActionButton,
	ActionIcon,
	ActionIconsContainer,
	ActionsMenu,
	AddClassButton,
	BackButton,
	CardActions,
	CardHeader,
	ClassCard,
	ClassDetails,
	ClassesContainer,
	ClassGrid,
	ClassName,
	ClassNumberDisplay,
	ClassStatus,
	ClassTable,
	ClassTableHeader,
	ClassTableRow,
	DetailItem,
	EmptyState,
	EmptyStateText,
	FilterDropdown,
	FiltersContainer,
	HeaderSection,
	LoadingMessage,
	LoadingSpinner,
	PageDescription,
	PageTitle,
	PageTitleWithBack,
	SearchAndFilters,
	SearchContainer,
	SearchInput,
	StatusBadge,
	ViewButton,
	ViewToggle,
} from './shared/styledComponents'
import { Class, ClassType } from './shared/types'
import { formatAttendanceDays, formatAttendanceTimes, withPermissionCheck } from './shared/utils'

const ClassesPage: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { typeId } = useParams()
	const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null)
	const [classes, setClasses] = useState<Class[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState<string>('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [isActionsMenuOpen, setIsActionsMenuOpen] = useState<string | null>(null)

	useEffect(() => {
		const fetchClassType = async () => {
			if (!typeId) return

			try {
				const { data, error } = await supabase
					.from('class_types')
					.select('*')
					.eq('id', typeId)
					.single()

				if (error) throw error
				setSelectedClassType(data)
			} catch (error) {
				console.error('Error fetching class type:', error)
				toast.error('Failed to load class type')
			}
		}

		fetchClassType()
	}, [typeId])

	useEffect(() => {
		const fetchClasses = async () => {
			if (!typeId) {
				setClasses([])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			try {
				// Fetch all classes (Levels) based on typeId
				const { data: classesData, error: classesError } = await supabase
					.from('levels')
					.select('*')
					.eq('type_id', typeId)
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
						const formattedDays = formatAttendanceDays(cls.attendanceDays || [], t)

						// Format attendance times
						const formattedTimes = formatAttendanceTimes(cls.attendanceTimes || [], t)

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
							sectionCount: sectionCount || 0,
						}
					})
				)

				// Sort the processed classes numerically in ascending order
				const sortedClasses = [...processedClasses].sort((a, b) => {
					const numA = a.classname ? parseInt(a.classname.replace(/\D/g, '')) : 0
					const numB = b.classname ? parseInt(b.classname.replace(/\D/g, '')) : 0

					if (!isNaN(numA) && !isNaN(numB)) {
						return numA - numB
					}

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
	}, [typeId, t])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}

	const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilterStatus(e.target.value)
	}

	const toggleActionsMenu = (classId: string) => {
		setIsActionsMenuOpen(isActionsMenuOpen === classId ? null : classId)
	}

	const handleEditClass = (classId: string) => {
		console.log('Edit class:', classId)
		// TODO: Implement edit class functionality
		setIsActionsMenuOpen(null)
	}

	const handleDeleteClass = (classId: string) => {
		console.log('Delete class:', classId)
		// TODO: Implement delete class functionality
		setIsActionsMenuOpen(null)
	}

	const handleCardClick = (cls: Class) => {
		navigate(`/admin/classes/types/${typeId}/levels/${cls.id}`)
	}

	const handleCreateClass = () => {
		withPermissionCheck(
			'create_classes',
			() => {
				console.log('Create new class')
				// TODO: Implement create class functionality
			},
			() => {
				toast.error("You don't have permission to create classes")
			}
		)
	}

	const handleBackToClassTypes = () => {
		navigate('/admin/classes')
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

	if (isLoading) {
		return (
			<ClassesContainer>
				<LoadingMessage>
					<LoadingSpinner />
					<span>{t('classes.loadingLevels')}</span>
				</LoadingMessage>
			</ClassesContainer>
		)
	}

	return (
		<ClassesContainer>
			<HeaderSection>
				<div>
					<PageTitleWithBack>
						<BackButton onClick={handleBackToClassTypes}>
							<FiArrowLeft />
							{t('classes.backToClassTypes')}
						</BackButton>
					</PageTitleWithBack>
					<PageTitle>
						{selectedClassType?.name} - {t('classes.levels')}
					</PageTitle>
					<PageDescription>{t('classes.levelsDescription')}</PageDescription>
				</div>
				<AddClassButton onClick={handleCreateClass}>
					<FiPlus />
					<span>{t('classes.createNewClass')}</span>
				</AddClassButton>
			</HeaderSection>

			<FiltersContainer>
				<SearchAndFilters>
					<SearchContainer>
						<FiSearch />
						<SearchInput
							type='text'
							placeholder={t('classes.searchLevels')}
							value={searchTerm}
							onChange={handleSearchChange}
						/>
					</SearchContainer>

					<FilterDropdown>
						<select value={filterStatus} onChange={handleStatusFilterChange}>
							<option value=''>{t('classes.allStatus')}</option>
							<option value='active'>{t('classes.active')}</option>
							<option value='inactive'>{t('classes.inactive')}</option>
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

			{filteredClasses.length === 0 ? (
				<EmptyState>
					<EmptyStateText>
						{t('classes.noLevelsFound', { classType: selectedClassType?.name })}
					</EmptyStateText>
				</EmptyState>
			) : viewMode === 'grid' ? (
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
													<span>{t('classes.edit')}</span>
												</ActionButton>
												<ActionButton
													$isPrimary={false}
													onClick={e => {
														e.stopPropagation()
														handleDeleteClass(cls.id)
													}}
												>
													<FiTrash2 />
													<span>{t('classes.delete')}</span>
												</ActionButton>
											</ActionsMenu>
										)}
									</AnimatePresence>
								</CardActions>
							</CardHeader>

							<ClassDetails>
								<ClassStatus $status={cls.status}>
									{cls.status === 'active' ? t('classes.active') : t('classes.inactive')}
								</ClassStatus>
								<DetailItem>
									<FiLayers />
									<span>
										{cls.sectionCount}{' '}
										{cls.sectionCount === 1 ? t('classes.section') : t('classes.sections')}
									</span>
								</DetailItem>
							</ClassDetails>
						</ClassCard>
					))}
				</ClassGrid>
			) : (
				<ClassTable>
					<ClassTableHeader>
						<div className='class-number'>Level #</div>
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
		</ClassesContainer>
	)
}

export default ClassesPage
