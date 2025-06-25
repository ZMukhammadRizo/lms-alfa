import styled from 'styled-components'

// Styled Component Interfaces
export interface PerformanceBarProps {
	$percentage: number
	$color: string
}

export interface SectionPerformanceBarProps {
	$percentage: number
	$color: string
}

export interface StatusDotProps {
	$active: boolean
}

export interface ClassCardProps {
	$color: string
}

export interface ViewButtonProps {
	$isActive: boolean
}

export interface StatusProps {
	$status: string
}

export interface ActionButtonProps {
	$isPrimary: boolean
}

export interface ClassNameProps {
	color?: string
}

export interface ClassNumberDisplayProps {
	color?: string
}

export interface ClassTableRowProps {
	color?: string
}

// Main Container
export const ClassesContainer = styled.div`
	padding: clamp(1.5rem, 4vw, 3rem);
	background-color: ${({ theme }) => theme.colors.background.primary};
	min-height: 100vh;
`

// Header Components
export const HeaderSection = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	gap: 1rem;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

export const StudentsHeaderSection = styled(HeaderSection)``

export const PageTitle = styled.h1`
	font-size: clamp(1.8rem, 5vw, 2.5rem);
	font-weight: 700;
	color: ${({ theme }) => theme.colors.text.primary};
	margin: 0 0 0.5rem 0;
	line-height: 1.2;
`

export const PageDescription = styled.p`
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 1rem;
	margin: 0;
	max-width: 60ch;
	line-height: 1.6;
`

export const PageTitleWithBack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

export const BackButton = styled.button`
	background: transparent;
	border: none;
	color: ${({ theme }) => theme.colors.text.secondary};
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	padding: 0.5rem 0;
	font-size: 0.95rem;
	transition: all 0.2s ease;
	margin-bottom: 0;
	flex-shrink: 0;

	&:hover {
		color: ${({ theme }) => theme.colors.primary[500]};
	}

	svg {
		font-size: 1rem;
	}
`

// Button Components
export const AddClassButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background-color: ${({ theme }) => theme.colors.primary[500]};
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.primary[600]};
		transform: translateY(-1px);
	}

	svg {
		font-size: 1.1rem;
	}
`

export const AddButton = styled(AddClassButton)``

export const ExportDataButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background-color: ${({ theme }) => theme.colors.background.secondary};
	color: ${({ theme }) => theme.colors.text.primary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	padding: 0.75rem 1.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${({ theme }) => theme.colors.background.primary};
		border-color: ${({ theme }) => theme.colors.border.medium};
	}

	svg {
		font-size: 1.1rem;
	}
`

// Loading and Empty States
export const LoadingMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 1.1rem;
	gap: 1rem;
`

export const LoadingSpinner = styled.div`
	width: 32px;
	height: 32px;
	border: 3px solid ${({ theme }) => theme.colors.border.light};
	border-top: 3px solid ${({ theme }) => theme.colors.primary[500]};
	border-radius: 50%;
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

export const EmptyState = styled.div`
	padding: 4rem 2rem;
	text-align: center;
	color: ${({ theme }) => theme.colors.text.secondary};
`

export const EmptyStateText = styled.p`
	font-size: 1.1rem;
	margin: 0;
	max-width: 50ch;
	margin: 0 auto;
	line-height: 1.6;
`

// Grid and Card Components
export const ClassGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;
	margin-top: 1rem;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 1rem;
	}
`

export const ClassCard = styled.div<ClassCardProps>`
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	overflow: hidden;
	transition: all 0.25s ease-out;
	cursor: pointer;
	position: relative;
	box-shadow: ${({ theme }) => theme.shadows.sm};

	&:hover {
		transform: translateY(-4px);
		box-shadow: ${({ theme }) => theme.shadows.lg};
		border-color: ${({ theme }) => theme.colors.primary[300]};
	}
`

export const CardHeader = styled.div<{ $color: string }>`
	background: linear-gradient(135deg, ${props => props.$color}dd, ${props => props.$color});
	padding: 1.5rem;
	color: white;
	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
`

export const ClassName = styled.h3<ClassNameProps>`
	font-size: 1.3rem;
	font-weight: 600;
	margin: 0;
	color: white;
	flex-grow: 1;
`

export const ClassNumberDisplay = styled.span<ClassNumberDisplayProps>`
	font-size: 2rem;
	font-weight: 700;
	color: white;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

export const CardActions = styled.div`
	position: relative;
	z-index: 10;
`

export const ActionsMenu = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	background: white;
	border-radius: ${({ theme }) => theme.borderRadius.md};
	box-shadow: ${({ theme }) => theme.shadows.lg};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	overflow: hidden;
	min-width: 140px;
	z-index: 20;
`

export const ActionButton = styled.button<ActionButtonProps>`
	width: 100%;
	padding: 0.75rem 1rem;
	border: none;
	background: transparent;
	text-align: left;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 0.9rem;
	color: ${props =>
		props.$isPrimary ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};

	&:hover {
		background-color: ${props =>
			props.$isPrimary ? props.theme.colors.primary[50] : props.theme.colors.background.secondary};
		color: ${props =>
			props.$isPrimary ? props.theme.colors.primary[700] : props.theme.colors.text.primary};
	}

	svg {
		font-size: 1rem;
	}
`

export const ClassDetails = styled.div`
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`

export const ClassStatus = styled.span<StatusProps>`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.75rem;
	border-radius: ${({ theme }) => theme.borderRadius.full};
	font-size: 0.75rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	background-color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[100] : props.theme.colors.warning[100]};
	color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[800] : props.theme.colors.warning[800]};
	width: fit-content;
`

export const DetailItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	font-size: 0.9rem;

	svg {
		color: ${({ theme }) => theme.colors.primary[500]};
		font-size: 1rem;
	}
`

// Search and Filter Components
export const FiltersContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	gap: 1rem;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

export const SearchAndFilters = styled.div`
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	flex: 1;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`

export const SearchContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	background: ${({ theme }) => theme.colors.background.secondary};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	transition: all 0.2s ease;
	min-width: 240px;

	&:focus-within {
		border-color: ${({ theme }) => theme.colors.primary[500]};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '30'};
	}

	svg {
		color: ${({ theme }) => theme.colors.text.tertiary};
		flex-shrink: 0;
	}
`

export const SearchInput = styled.input`
	width: 100%;
	border: none;
	background: transparent;
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.primary};
	outline: none;

	&::placeholder {
		color: ${({ theme }) => theme.colors.text.tertiary};
	}
`

export const FilterDropdown = styled.div`
	select {
		padding: 0.6rem 1rem;
		border: 1px solid ${({ theme }) => theme.colors.border.light};
		border-radius: ${({ theme }) => theme.borderRadius.md};
		background: ${({ theme }) => theme.colors.background.secondary};
		color: ${({ theme }) => theme.colors.text.primary};
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;

		&:focus {
			outline: none;
			border-color: ${({ theme }) => theme.colors.primary[500]};
			box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500] + '30'};
		}
	}
`

export const ViewToggle = styled.div`
	display: flex;
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	border-radius: ${({ theme }) => theme.borderRadius.md};
	overflow: hidden;
`

export const ViewButton = styled.button<ViewButtonProps>`
	padding: 0.6rem 0.75rem;
	border: none;
	background: ${props =>
		props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.background.secondary};
	color: ${props => (props.$isActive ? 'white' : props.theme.colors.text.secondary)};
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: ${props =>
			props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.background.primary};
	}

	svg {
		font-size: 1rem;
	}
`

// Table Components
export const ClassTable = styled.div`
	background: ${({ theme }) => theme.colors.background.secondary};
	border-radius: ${({ theme }) => theme.borderRadius.xl};
	border: 1px solid ${({ theme }) => theme.colors.border.light};
	overflow: hidden;
	box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const ClassTableHeader = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 120px 80px;
	padding: 1rem 1.5rem;
	background: ${({ theme }) => theme.colors.background.primary};
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
	font-weight: 600;
	font-size: 0.9rem;
	color: ${({ theme }) => theme.colors.text.secondary};
	text-transform: uppercase;
	letter-spacing: 0.05em;

	@media (max-width: 768px) {
		grid-template-columns: 1fr 1fr 80px;
		.times,
		.actions {
			display: none;
		}
	}
`

export const ClassTableRow = styled.div<ClassTableRowProps>`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 120px 80px;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
	cursor: pointer;
	transition: all 0.2s ease;
	align-items: center;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: ${({ theme }) => theme.colors.background.primary};
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr 1fr 80px;
		.times,
		.actions {
			display: none;
		}
	}
`

export const StatusBadge = styled.span<StatusProps>`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.75rem;
	border-radius: ${({ theme }) => theme.borderRadius.full};
	font-size: 0.75rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	background-color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[100] : props.theme.colors.warning[100]};
	color: ${props =>
		props.$status === 'active' ? props.theme.colors.success[800] : props.theme.colors.warning[800]};
`

export const ActionIconsContainer = styled.div`
	display: flex;
	gap: 0.5rem;
`

export const ActionIcon = styled.button`
	background: transparent;
	border: none;
	color: ${({ theme }) => theme.colors.text.tertiary};
	cursor: pointer;
	padding: 0.25rem;
	border-radius: ${({ theme }) => theme.borderRadius.sm};
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: ${({ theme }) => theme.colors.background.primary};
		color: ${({ theme }) => theme.colors.primary[500]};
	}

	svg {
		font-size: 1rem;
	}
`

// Student Components
export const StudentsView = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`

export const StudentsControls = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 16px;
	flex-wrap: wrap;
	gap: 1rem;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`

export const StudentsFilterGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
`

export const FilterButton = styled.button<{ $isActive?: boolean }>`
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
	transition: all 0.2s ease;

	&:hover {
		background-color: #f3f4f6;
	}

	svg {
		width: 1rem;
		height: 1rem;
	}
`

export const CourseFilterButton = styled(FilterButton)``

export const FilterDropdownMenu = styled.div<{ $isCourse?: boolean }>`
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

export const FilterOption = styled.div<{ $isActive: boolean }>`
	padding: 8px 16px;
	font-size: 14px;
	color: ${props => (props.$isActive ? '#4338ca' : '#374151')};
	background-color: ${props => (props.$isActive ? '#eef2ff' : 'white')};
	cursor: pointer;
	transition: all 0.2s ease;

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

export const StudentsTable = styled.div`
	width: 100%;
	background-color: white;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

export const StudentsTableHeader = styled.div`
	display: flex;
	background-color: white;
	border-bottom: 1px solid #e5e7eb;
	padding: 20px 16px;
`

export const StudentsTableHeaderCell = styled.div`
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

export const StudentsTableBody = styled.div`
	max-height: 600px;
	overflow-y: auto;
`

export const StudentsTableRow = styled.div`
	display: flex;
	padding: 18px 16px;
	border-bottom: 1px solid #e5e7eb;
	transition: all 0.2s ease;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: #f9fafb;
	}
`

export const StudentsTableCell = styled.div`
	display: flex;
	align-items: center;
	font-size: 14px;
	color: #374151;
	padding: 0 8px;
`

export const StudentProfile = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`

export const StudentDetails = styled.div`
	display: flex;
	flex-direction: column;
`

export const StudentEmail = styled.span`
	color: #6b7280;
	font-size: 0.75rem;
	margin-top: 0.125rem;
`

export const StudentName = styled.h3`
	margin: 0;
	color: #111827;
	font-size: 16px;
	font-weight: 600;
`

export const StudentAvatar = styled.div`
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

export const StatusIndicator = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`

export const StatusDot = styled.span<StatusDotProps>`
	display: inline-block;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: ${props => (props.$active ? '#10b981' : '#ef4444')};
`

export const StudentActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
`

export const ActionIconButton = styled.button`
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

// Section-Specific Components
export const SectionHeaderContainer = styled.div`
	margin-bottom: 24px;
`

export const BackToGradesLink = styled.button`
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

export const SectionPageTitle = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: #111827;
	margin: 0 0 4px 0;
`

export const SectionPageDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 0;
`

export const SectionSearchContainer = styled.div`
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

export const SectionSearchInput = styled.input`
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
export const SectionsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 20px;
	margin-top: 16px;
`

export const SectionCard = styled.div`
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

export const SectionLabel = styled.h3`
	background-color: #4f46e5;
	color: white;
	margin: 0;
	padding: 14px 16px;
	font-size: 16px;
	font-weight: 600;
`

export const SectionRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid #f3f4f6;
`

export const SectionIconLabel = styled.div`
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

export const SectionValue = styled.div`
	font-weight: 600;
	color: #111827;
`

export const SectionDetail = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid #f3f4f6;
	color: #374151;
	font-size: 14px;
`

export const SectionIcon = styled.div`
	color: #6b7280;
	display: flex;

	svg {
		width: 16px;
		height: 16px;
	}
`

// Empty state for no data
export const EmptyStateActionButton = styled.button`
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
