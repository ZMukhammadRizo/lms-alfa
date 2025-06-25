import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiChevronRight } from 'react-icons/fi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import supabase from '../../../../config/supabaseClient'

interface BreadcrumbItem {
	label: string
	path?: string
	isActive?: boolean
}

const BreadcrumbContainer = styled.nav`
	padding: 1rem 0;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
	margin-bottom: 2rem;
`

const BreadcrumbList = styled.ol`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
	flex-wrap: wrap;
`

const BreadcrumbItem = styled.li<{ $isActive?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${({ $isActive, theme }) =>
		$isActive ? theme.colors.text.primary : theme.colors.text.secondary};
	font-size: 0.9rem;
	font-weight: ${({ $isActive }) => ($isActive ? '500' : '400')};
`

const BreadcrumbLink = styled.button`
	background: none;
	border: none;
	color: ${({ theme }) => theme.colors.primary[500]};
	cursor: pointer;
	font-size: 0.9rem;
	padding: 0.25rem 0;
	transition: all 0.2s ease;

	&:hover {
		color: ${({ theme }) => theme.colors.primary[600]};
		text-decoration: underline;
	}
`

const BreadcrumbSeparator = styled.span`
	color: ${({ theme }) => theme.colors.text.tertiary};
	display: flex;
	align-items: center;

	svg {
		font-size: 0.8rem;
	}
`

const ClassesBreadcrumb: React.FC = () => {
	const { t } = useTranslation()
	const location = useLocation()
	const navigate = useNavigate()
	const { typeId, levelId, sectionId } = useParams()
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

	useEffect(() => {
		const buildBreadcrumbs = async () => {
			const items: BreadcrumbItem[] = [
				{
					label: t('navigation.classes'),
					path: '/admin/classes',
				},
			]

			// Add Class Type if present
			if (typeId) {
				try {
					const { data: classType } = await supabase
						.from('class_types')
						.select('name')
						.eq('id', typeId)
						.single()

					if (classType) {
						items.push({
							label: classType.name,
							path: `/admin/classes/types/${typeId}`,
						})
					}
				} catch (error) {
					console.error('Error fetching class type:', error)
					items.push({
						label: `${t('classes.classType')} ${typeId}`,
						path: `/admin/classes/types/${typeId}`,
					})
				}
			}

			// Add Level if present
			if (levelId && typeId) {
				try {
					const { data: level } = await supabase
						.from('levels')
						.select('name')
						.eq('id', levelId)
						.single()

					if (level) {
						items.push({
							label: `${level.name} ${t('classes.sections')}`,
							path: `/admin/classes/types/${typeId}/levels/${levelId}`,
						})
					}
				} catch (error) {
					console.error('Error fetching level:', error)
					items.push({
						label: `${t('classes.level')} ${levelId}`,
						path: `/admin/classes/types/${typeId}/levels/${levelId}`,
					})
				}
			}

			// Add Section if present (final page, no link)
			if (sectionId && levelId && typeId) {
				try {
					const { data: section } = await supabase
						.from('classes')
						.select('classname')
						.eq('id', sectionId)
						.single()

					if (section) {
						items.push({
							label: `${section.classname} ${t('classes.students')}`,
							isActive: true,
						})
					}
				} catch (error) {
					console.error('Error fetching section:', error)
					items.push({
						label: `${t('classes.section')} ${sectionId}`,
						isActive: true,
					})
				}
			} else {
				// Mark the last item as active if it's the current page
				if (items.length > 0) {
					items[items.length - 1].isActive = true
				}
			}

			setBreadcrumbs(items)
		}

		buildBreadcrumbs()
	}, [location.pathname, typeId, levelId, sectionId, t])

	const handleNavigate = (path: string) => {
		navigate(path)
	}

	if (breadcrumbs.length <= 1) {
		return null
	}

	return (
		<BreadcrumbContainer>
			<BreadcrumbList>
				{breadcrumbs.map((item, index) => (
					<React.Fragment key={index}>
						<BreadcrumbItem $isActive={item.isActive}>
							{item.path && !item.isActive ? (
								<BreadcrumbLink onClick={() => handleNavigate(item.path!)}>
									{item.label}
								</BreadcrumbLink>
							) : (
								<span>{item.label}</span>
							)}
						</BreadcrumbItem>
						{index < breadcrumbs.length - 1 && (
							<BreadcrumbSeparator>
								<FiChevronRight />
							</BreadcrumbSeparator>
						)}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</BreadcrumbContainer>
	)
}

export default ClassesBreadcrumb
