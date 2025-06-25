import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import supabase from '../../../config/supabaseClient'
import {
	CardHeader,
	ClassCard,
	ClassesContainer,
	ClassGrid,
	ClassName,
	EmptyState,
	EmptyStateText,
	HeaderSection,
	LoadingMessage,
	LoadingSpinner,
	PageDescription,
	PageTitle,
} from './shared/styledComponents'
import { ClassType } from './shared/types'
import { generateRandomColor } from './shared/utils'

const ClassTypesPage: React.FC = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [classTypes, setClassTypes] = useState<ClassType[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchClassTypes = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const { data, error } = await supabase.from('class_types').select('*').order('name')

				if (error) throw error
				setClassTypes(data || [])
			} catch (error: any) {
				console.error('Error fetching class types:', error)
				toast.error('Failed to load class types')
				setError(error.message)
			} finally {
				setIsLoading(false)
			}
		}

		fetchClassTypes()
	}, [])

	const handleClassTypeClick = (classType: ClassType) => {
		navigate(`/admin/classes/types/${classType.id}`)
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.1 },
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	}

	if (isLoading) {
		return (
			<ClassesContainer>
				<LoadingMessage>
					<LoadingSpinner />
					<span>{t('classes.loadingClassTypes')}</span>
				</LoadingMessage>
			</ClassesContainer>
		)
	}

	if (error) {
		return (
			<ClassesContainer>
				<div style={{ textAlign: 'center', color: 'red', marginTop: '20px' }}>
					<p>
						{t('classes.errorLoadingClassTypes')} {error}
					</p>
					<button onClick={() => window.location.reload()}>{t('classes.tryAgain')}</button>
				</div>
			</ClassesContainer>
		)
	}

	return (
		<ClassesContainer>
			<HeaderSection>
				<div>
					<PageTitle>{t('classes.classTypes')}</PageTitle>
					<PageDescription>{t('classes.classTypesDescription')}</PageDescription>
				</div>
			</HeaderSection>

			{classTypes.length === 0 ? (
				<EmptyState>
					<EmptyStateText>{t('classes.noClassTypesFound')}</EmptyStateText>
				</EmptyState>
			) : (
				<motion.div variants={containerVariants} initial='hidden' animate='visible'>
					<ClassGrid>
						{classTypes.map(classType => {
							const color = generateRandomColor()
							return (
								<motion.div
									key={classType.id}
									variants={itemVariants}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<ClassCard $color={color} onClick={() => handleClassTypeClick(classType)}>
										<CardHeader $color={color}>
											<ClassName color={color}>{classType.name}</ClassName>
										</CardHeader>
									</ClassCard>
								</motion.div>
							)
						})}
					</ClassGrid>
				</motion.div>
			)}
		</ClassesContainer>
	)
}

export default ClassTypesPage
