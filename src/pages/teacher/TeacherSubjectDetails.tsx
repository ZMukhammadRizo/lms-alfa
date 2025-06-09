import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { FiArrowLeft, FiBookOpen, FiInfo, FiList, FiChevronRight, FiCalendar } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import supabase from '../../config/supabaseClient'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// Interfaces
interface Subject {
  id: string
  subjectname: string
  code: string
  description?: string
  status: string
}

interface Lesson {
  id: string
  lessonname: string
  description?: string
  uploadedat: string
  duration?: string
  videourl?: string
}

interface Class {
  id: string
  classname: string
  description?: string
  student_count: number
}

// Styled Components
const PageContainer = styled.div`
  padding: clamp(1.5rem, 4vw, 3rem);
  background-color: ${({ theme }) => theme.colors.background.primary};
  min-height: 100vh;
`

const PageHeader = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2.5rem;
`

const HeaderContent = styled.div`
  flex-grow: 1;
`

const PageTitle = styled.h1`
  font-size: clamp(1.8rem, 5vw, 2.2rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 0.25rem 0;
`

const PageSubtitle = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 60ch;
`

const StyledBackButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
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
    color: ${props => props.theme.colors.primary[500]};
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`

const TabButton = styled.button<{ $isActive: boolean }>`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary[600] : theme.colors.text.secondary};
  background-color: transparent;
  border: none;
  border-bottom: 3px solid
    ${({ theme, $isActive }) => ($isActive ? theme.colors.primary[500] : 'transparent')};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[500]};
  }

  svg {
    font-size: 1.1rem;
    color: ${({ theme, $isActive }) =>
      $isActive ? theme.colors.primary[500] : theme.colors.text.tertiary};
  }
`

const TabContentContainer = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: clamp(1.5rem, 4vw, 2.5rem);
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`

const LoadingState = styled.div`
  padding: 4rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
`

const EmptyState = styled.div`
  padding: 4rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const ItemCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-top: 4px solid ${({ theme }) => theme.colors.primary[500]};
  overflow: hidden;
  transition: all 0.25s ease-out;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  margin-bottom: 1.5rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-4px);
  }

  &:last-child {
      margin-bottom: 0;
  }
`

const CardBody = styled.div`
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`

const CardTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
`

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  flex-grow: 1;
`

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`

const CardStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};

  svg {
    color: ${({ theme }) => theme.colors.primary[500]};
    font-size: 1rem;
    flex-shrink: 0;
  }
`

const ViewDetailsButton = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  gap: 0.3rem;

  svg {
    transition: transform 0.2s ease;
  }

  ${ItemCard}:hover & svg {
    transform: translateX(3px);
  }
`

const OverviewContent = styled.div`
  p {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.7;
    max-width: 75ch;
  }
`

const LessonsListContainer = styled.div``

const TeacherSubjectDetails: React.FC = () => {
  const { t } = useTranslation()
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>()
  const navigate = useNavigate()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [className, setClassName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons'>('overview')
  const theme = useTheme()

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId || !classId) {
        toast.error(t('common.missingClassOrSubjectId'))
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        // Fetch subject details
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', subjectId)
          .single()

        if (subjectError) throw subjectError
        setSubject(subjectData)

        // Fetch class name (simplified)
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('classname')
          .eq('id', classId)
          .single()

        if (classError) {
          console.warn('Could not fetch class name:', classError.message)
          setClassName('Class') // Fallback class name
        } else {
          setClassName(classData.classname)
        }

        // Fetch lessons for the subject
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('subjectid', subjectId)
          .order('uploadedat', { ascending: true })

        if (lessonsError) throw lessonsError
        setLessons(lessonsData || [])

      } catch (error: any) {
        console.error('Error fetching subject details:', error)
        toast.error(error.message || t('teacher.subjects.loadingSubjectDetails'))
        setSubject(null)
        setLessons([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [subjectId, classId])

  const handleLessonClick = (lessonId: string) => {
    navigate(`/teacher/classes/${classId}/subjects/${subjectId}/lessons/${lessonId}`)
  }

  const handleBackClick = () => {
    navigate("/teacher/classes")
  }

  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>{t('teacher.subjects.loadingSubjectDetails')}</LoadingState>
      </PageContainer>
    )
  }

  if (!subject) {
    return (
      <PageContainer>
        <StyledBackButton onClick={handleBackClick}>
          <FiArrowLeft /> {t('common.back')}
        </StyledBackButton>
        <EmptyState>{t('teacher.subjects.subjectNotFound')}</EmptyState>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader layout>
        <StyledBackButton onClick={handleBackClick}>
          <FiArrowLeft /> {t('common.back')}
        </StyledBackButton>
        <HeaderContent>
          <PageTitle>{subject.subjectname}</PageTitle>
          <PageSubtitle>{subject.code} - {className}</PageSubtitle>
        </HeaderContent>
      </PageHeader>

      <TabContainer>
        <TabButton $isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          <FiInfo /> {t('common.overview')}
        </TabButton>
        <TabButton $isActive={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')}>
          <FiList /> {t('teacher.subjects.lessons')} ({lessons.length})
        </TabButton>
      </TabContainer>

      <AnimatePresence mode="wait">
        <TabContentContainer
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {activeTab === 'overview' && (
            <OverviewContent>
              <p>{subject.description || t('common.noDescription')}</p>
            </OverviewContent>
          )}

          {activeTab === 'lessons' && (
            <LessonsListContainer>
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <ItemCard
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.id)}
                    layout
                  >
                    <CardBody>
                      <CardTitle>{lesson.lessonname}</CardTitle>
                      <CardDescription>
                        {lesson.description || t('common.noDescription')}
                      </CardDescription>
                      <CardFooter>
                        <CardStat>
                          <FiCalendar size={14} />
                          <span>{new Date(lesson.uploadedat).toLocaleDateString()}</span>
                        </CardStat>
                        <ViewDetailsButton>
                          {t('teacher.subjects.viewLessons')} <FiChevronRight />
                        </ViewDetailsButton>
                      </CardFooter>
                    </CardBody>
                  </ItemCard>
                ))
              ) : (
                <EmptyState>{t('teacher.subjects.noLessonsFound')}</EmptyState>
              )}
            </LessonsListContainer>
          )}
        </TabContentContainer>
      </AnimatePresence>
    </PageContainer>
  )
}

export { TeacherSubjectDetails }; 