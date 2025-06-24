import React from 'react'
import { Calendar } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { SearchInput } from '../../../components/ui'

// Component props interface
interface TopSectionProps {
	subjectName: string
	searchQuery: string
	setSearchQuery: (query: string) => void

	// Updated props
	className?: string
	gradeName?: string
	selectedQuarterId: string
	quarters: Array<{ id: string; name: string }>
	quarterDropdownOpen: boolean
	quarterDropdownRef: React.RefObject<HTMLDivElement>
	lessons: Array<{ id: string; title: string; date: string }>
	toggleQuarterDropdown: () => void
	handleQuarterSelect: (quarterId: string) => void
}

const TopSection: React.FC<TopSectionProps> = ({
	subjectName,
	searchQuery,
	setSearchQuery,
	className,
	gradeName,
	selectedQuarterId,
	quarters,
	quarterDropdownOpen,
	quarterDropdownRef,
	lessons,
	toggleQuarterDropdown,
	handleQuarterSelect,
}) => {
	const navigate = useNavigate()
	const { t } = useTranslation()

	// Find the selected quarter's name
	const selectedQuarterName =
		quarters.find(q => q.id === selectedQuarterId)?.name || t('grades.selectQuarter')

	return (
		<TopSectionContainer style={{ width: '100%' }}>
			<HeaderInfo>
				<HeaderTitle>{subjectName || t('grades.selectSubject')}</HeaderTitle>
				{className && gradeName && (
					<HeaderSubtitle>
						{className} - {gradeName}
					</HeaderSubtitle>
				)}
			</HeaderInfo>

			<ToolbarContainer>
				<SearchInputWrapper>
					<SearchInput
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder={t('grades.searchStudents')}
						variant="elevated"
						size="medium"
					/>
				</SearchInputWrapper>

				<RightControls>
					<QuarterSelector>
						<QuarterButton onClick={toggleQuarterDropdown}>
							<Calendar size={16} />
							<span>{selectedQuarterName}</span>
						</QuarterButton>

						{quarterDropdownOpen && (
							<QuarterDropdown ref={quarterDropdownRef}>
								{quarters.map(quarter => (
									<QuarterOption
										key={quarter.id}
										$isSelected={quarter.id === selectedQuarterId}
										onClick={() => handleQuarterSelect(quarter.id)}
									>
										{quarter.name}
									</QuarterOption>
								))}
							</QuarterDropdown>
						)}
					</QuarterSelector>
				</RightControls>
			</ToolbarContainer>
		</TopSectionContainer>
	)
}

export default TopSection

// Styled components
const TopSectionContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 20px;
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

const HeaderInfo = styled.div`
	display: flex;
	flex-direction: column;
`

const HeaderTitle = styled.h1`
	font-size: 1.5rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	margin: 0;
`

const HeaderSubtitle = styled.h2`
	font-size: 1rem;
	font-weight: 400;
	color: ${props => props.theme.colors.text.secondary};
	margin: 4px 0 0 0;
`

const ToolbarContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
	justify-content: space-between;
	margin-top: 8px;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const SearchInputWrapper = styled.div`
	flex: 1;
	max-width: 400px;
	min-width: 280px;

	@media (max-width: 768px) {
		max-width: 100%;
		width: 100%;
	}
`

const RightControls = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;

	@media (max-width: 640px) {
		width: 100%;
		justify-content: space-between;
	}
`

const QuarterSelector = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`

const QuarterButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background-color: ${props => props.theme.colors.background.lighter};
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary};
	cursor: pointer;

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}

	svg {
		color: ${props => props.theme.colors.primary[500]};
	}
`

const QuarterDropdown = styled.div`
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 10;
	width: 200px;
	max-height: 250px;
	overflow-y: auto;
	background-color: white;
	border: 1px solid ${props => props.theme.colors.border.light};
	border-radius: 6px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	margin-top: 4px;
`

interface QuarterOptionProps {
	$isSelected: boolean
}

const QuarterOption = styled.div<QuarterOptionProps>`
	padding: 8px 12px;
	cursor: pointer;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.primary};
	background-color: ${props =>
		props.$isSelected ? props.theme.colors.primary[50] : 'transparent'};
	font-weight: ${props => (props.$isSelected ? '600' : 'normal')};

	&:hover {
		background-color: ${props => props.theme.colors.background.hover};
	}
`
