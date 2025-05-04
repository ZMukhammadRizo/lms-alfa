import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiBook, FiCheck, FiChevronRight, FiClock, FiPlay, FiPlayCircle, FiFileText, FiDownload } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { NewClass } from '../../types/Class'
import supabase from '../../config/supabaseClient'
import { getClassSubjects } from '../../api/teacher'

// Lesson interface
interface Lesson {
	id: string
	lessonname: string
	duration: string
	videourl: string
	description?: string
}

// Add interface for Lesson Files
interface LessonFile {
    id: string;
    lesson_id: string;
    file_name: string;
    file_url: string;
    // Add other relevant fields like file_type, size, uploaded_at if available
}

// Subject interface
interface Subject {
	id: string
	subjectname: string
	code: string
	description: string
	status: string
}

// Course interface
interface Course {
	id: string
	name: string
	subject: string
	description: string
	coverImage: string
	lessons: Lesson[]
}

const getEmbedUrl = (url: string | null): string => {
	if (!url) return '';
	
	// If it's already an embed URL, return it
	if (url.includes('youtube.com/embed/')) {
		return url;
	}
	
	// Convert youtube.com/watch?v=VIDEO_ID to youtube.com/embed/VIDEO_ID
	if (url.includes('youtube.com/watch?v=')) {
		const videoId = url.split('v=')[1]?.split('&')[0];
		return `https://www.youtube.com/embed/${videoId}`;
	}
	
	// Convert youtu.be/VIDEO_ID to youtube.com/embed/VIDEO_ID
	if (url.includes('youtu.be/')) {
		const videoId = url.split('youtu.be/')[1]?.split('?')[0];
		return `https://www.youtube.com/embed/${videoId}`;
	}
	
	// If it's not a recognizable YouTube URL, return as is
	return url;
};

const TeacherClassDetails: React.FC = () => {
	const { id: classId } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [classInfo, setClassInfo] = useState<NewClass | null>(null)
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [videoLoaded, setVideoLoaded] = useState<boolean>(false)
	const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false)
	const videoSectionRef = useRef<HTMLDivElement>(null)
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
	const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false)
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [lessonFiles, setLessonFiles] = useState<LessonFile[]>([]); // State for lesson files
	const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false); // Loading state for files

	// Fetch class data
	useEffect(() => {
		setIsLoading(true)

		const fetchClassInfo = async () => {
			try {
				const { data, error } = await supabase
					.from('classes')
					.select(
						`
      *,
      subjects:subjectid (*),
      createdby:createdby (id, firstName, lastName, email)
    `
					)
					.eq('id', classId)
					.single()

				if (error) {
					throw error
				}

				setClassInfo(data)
				setIsLoading(false)
				
				// Load subjects for this class
				loadClassSubjects()
			} catch (error) {
				console.error('Error fetching class info:', error)
				setIsLoading(false)
			}
		}

		fetchClassInfo()
	}, [classId])
	
	// Function to load subjects for the class
	const loadClassSubjects = async () => {
		if (!classId) return
		
		setIsLoadingSubjects(true)
		try {
			const subjectsData = await getClassSubjects(classId)
			setSubjects(subjectsData)
			
			// If subjects are found, select the first one by default
			if (subjectsData && subjectsData.length > 0) {
				setSelectedSubject(subjectsData[0])
				// Load lessons for the first subject
				await loadLessons(subjectsData[0].id)
			}
		} catch (error) {
			console.error('Error loading class subjects:', error)
		} finally {
			setIsLoadingSubjects(false)
		}
	}
	
	// Function to load lessons for a subject
	const loadLessons = async (subjectId: string) => {
		try {
			const { data, error } = await supabase
				.from('lessons')
				.select('*')
				.eq('subjectid', subjectId)
				
			if (error) throw error
			
			setLessons(data || [])
		} catch (error) {
			console.error('Error loading lessons:', error)
		}
	}
	
	// Function to handle subject selection
	const handleSubjectSelect = async (subject: Subject) => {
		setSelectedSubject(subject)
		setSelectedLesson(null) // Clear selected lesson
		await loadLessons(subject.id)
	}

	// Function to handle selecting a lesson
	const handleSelectLesson = async (lesson: Lesson) => {
		setSelectedLesson(lesson)
		setVideoLoaded(false)
		setLessonFiles([]); // Clear previous files
		setIsLoadingFiles(true); // Set loading true for files
		
		console.log('[Debug] Selected lesson object:', lesson);
		console.log('[Debug] Selected lesson video URL:', lesson.videourl);

		// --- Fetch associated files --- 
		try {
			console.log(`[Debug] Fetching files for lesson ID: ${lesson.id}`);
			const { data: filesData, error: filesError } = await supabase
				.from('lesson_files') // Assuming table name is 'lesson_files'
				.select('id, lesson_id, file_name, file_url') // Select necessary columns
				.eq('lesson_id', lesson.id);

			if (filesError) {
				console.error('[Debug] Error fetching lesson files:', filesError);
				throw filesError;
			}

			console.log('[Debug] Fetched files data:', filesData);
			setLessonFiles(filesData || []);

		} catch (error) {
			console.error('Error fetching lesson files in handleSelectLesson:', error);
			setLessonFiles([]); // Ensure files are empty on error
		} finally {
			setIsLoadingFiles(false);
		}
		// --- End Fetch Files --- 

		// Show success toast
		setShowSuccessToast(true)
		setTimeout(() => setShowSuccessToast(false), 3000)

		// Scroll to video section on mobile
		if (window.innerWidth < 768 && videoSectionRef.current) {
			videoSectionRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			})
		}
	}

	// Handle video load
	const handleVideoLoad = () => {
		console.log('Video loaded successfully')
		setVideoLoaded(true)
	}

	// Function to determine if a URL is a YouTube video
	const isYouTubeUrl = (url: string): boolean => {
		return url.includes('youtube.com') || url.includes('youtu.be')
	}

	// Function to determine if a URL is a Vimeo video
	const isVimeoUrl = (url: string): boolean => {
		return url.includes('vimeo.com')
	}

	// Function to get proper embed URL
	const getEmbedUrl = (url: string): string => {
		if (!url) {
			console.log('[Debug] getEmbedUrl received empty URL');
			return ''
		}
		
		console.log(`[Debug] getEmbedUrl processing URL: ${url}`);
		
		if (isYouTubeUrl(url)) {
			// Convert YouTube URL to embed format
			const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
			const match = url.match(youtubeRegex)
			const videoId = match ? match[1] : null
			console.log(`[Debug] YouTube regex match: ${match}, Video ID: ${videoId}`);
			
			if (videoId) {
				const embedUrl = `https://www.youtube.com/embed/${videoId}`;
				console.log(`[Debug] Generated YouTube embed URL: ${embedUrl}`);
				return embedUrl;
			}
		} else if (isVimeoUrl(url)) {
			// Convert Vimeo URL to embed format
			const vimeoRegex = /vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/
			const match = url.match(vimeoRegex)
			const videoId = match ? match[1] : null
			console.log(`[Debug] Vimeo regex match: ${match}, Video ID: ${videoId}`);
			
			if (videoId) {
				const embedUrl = `https://player.vimeo.com/video/${videoId}`;
				console.log(`[Debug] Generated Vimeo embed URL: ${embedUrl}`);
				return embedUrl;
			}
		}
		
		// Return original URL if not YouTube or Vimeo
		console.log('[Debug] URL not recognized as YouTube/Vimeo, returning original');
		return url
	}

	// Loading state
	if (isLoading) {
		return (
			<PageContainer>
				<LoadingContainer>
					<LoadingSpinner />
					<LoadingText>Loading course content...</LoadingText>
				</LoadingContainer>
			</PageContainer>
		)
	}

	// No course found state
	if (!classInfo) {
		return (
			<PageContainer>
				<NotFoundContainer>
					<NotFoundIcon>404</NotFoundIcon>
					<h2>Course Not Found</h2>
					<p>The course you're looking for doesn't exist or has been removed.</p>
					<BackButton onClick={() => navigate('/teacher/classes')}>
						<FiArrowLeft size={18} />
						<span>Back to My Courses</span>
					</BackButton>
				</NotFoundContainer>
			</PageContainer>
		)
	}

	return (
		<PageContainer>
			{/* Navigation and Course Info */}
			<HeaderSection>
				<Breadcrumb>
					<BreadcrumbItem onClick={() => navigate('/teacher/classes')}>My Courses</BreadcrumbItem>
					<FiChevronRight size={14} />
					<BreadcrumbItem active>{classInfo.classname}</BreadcrumbItem>
				</Breadcrumb>

				<CourseHeader>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						<BackButton onClick={() => navigate('/teacher/classes')}>
							<FiArrowLeft size={18} />
							<span>Back to courses</span>
						</BackButton>

						<CourseHeaderContent $category={classInfo.subject || ''}>
							<CourseInfo>
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: 0.1 }}
								>
									<CourseTitle>{classInfo.classname}</CourseTitle>
									<CourseDescription>{classInfo.description}</CourseDescription>
									<CourseMeta>
										{classInfo.subjects && (
										<CourseMetaItem>
											<CategoryBadge $category={classInfo.subjects.name}>
												{classInfo.subjects.name}
											</CategoryBadge>
										</CourseMetaItem>
											)}
									</CourseMeta>
								</motion.div>
							</CourseInfo>
						</CourseHeaderContent>
					</motion.div>
				</CourseHeader>
			</HeaderSection>

			{/* Subjects Section */}
			<SubjectsSection>
				<SectionHeader>
					<SectionTitle>Subjects</SectionTitle>
					{subjects && <SubjectCount>{subjects.length} subjects</SubjectCount>}
				</SectionHeader>
				
				{isLoadingSubjects ? (
					<LoadingIndicator>Loading subjects...</LoadingIndicator>
				) : subjects.length > 0 ? (
					<SubjectsGrid>
						{subjects.map(subject => (
							<SubjectCard
								key={subject.id}
								onClick={() => handleSubjectSelect(subject)}
								$isActive={selectedSubject?.id === subject.id}
							>
								<SubjectIconWrapper>
									<FiBook size={24} />
								</SubjectIconWrapper>
								<SubjectContent>
									<SubjectName>{subject.subjectname}</SubjectName>
									<SubjectCode>{subject.code}</SubjectCode>
								</SubjectContent>
							</SubjectCard>
						))}
					</SubjectsGrid>
				) : (
					<EmptyState>
						<EmptyStateText>No subjects found for this class</EmptyStateText>
					</EmptyState>
				)}
			</SubjectsSection>

			{/* Main Content Area */}
			{selectedSubject && (
			<ContentSection>
				{/* Lessons and Video Layout */}
				<CourseContent>
					{/* Lessons List - Left Side */}
					<LessonsSection>
						<SectionHeader>
								<SectionTitle>{selectedSubject.subjectname} Lessons</SectionTitle>
								{lessons && <LessonCount>{lessons.length} lessons</LessonCount>}
						</SectionHeader>

							{lessons.length > 0 ? (
							<LessonsList>
								<AnimatePresence>
										{lessons.map((lesson: any, index: number) => (
										<motion.div
											key={lesson.id}
											initial={{ opacity: 0, y: 15 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											transition={{ duration: 0.2, delay: index * 0.05 }}
										>
											<LessonItem
												onClick={() => handleSelectLesson(lesson)}
												$isActive={selectedLesson?.id === lesson.id}
											>
												<LessonNumber>{index + 1}</LessonNumber>
												<LessonContent>
													<LessonTitle>{lesson.lessonname}</LessonTitle>
													<LessonMeta>
														<Duration>
															<FiClock size={14} />
																<span>{lesson.duration || '30 min'}</span>
														</Duration>
													</LessonMeta>
												</LessonContent>
												{selectedLesson?.id === lesson.id ? (
													<NowPlayingBadge>
														<span>Currently Playing</span>
													</NowPlayingBadge>
												) : (
													<PlayButton>
														<FiPlay size={14} />
													</PlayButton>
												)}
											</LessonItem>
										</motion.div>
									))}
								</AnimatePresence>
							</LessonsList>
							) : (
								<EmptyState>
									<EmptyStateText>No lessons found for this subject</EmptyStateText>
								</EmptyState>
						)}
					</LessonsSection>

					{/* Video Player - Right Side */}
						{selectedLesson && (
					<VideoSection ref={videoSectionRef}>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.4 }}
							>
								<VideoHeader>
									<SelectedLessonTitle>{selectedLesson.lessonname}</SelectedLessonTitle>
									<SelectedLessonMeta>
										<FiClock size={14} />
											<span>{selectedLesson.duration || '30 min'}</span>
									</SelectedLessonMeta>
								</VideoHeader>

									<VideoContainer $loaded={videoLoaded}>
										{showSuccessToast && (
											<SuccessToast>
												<SuccessToastIcon>
													<FiCheck size={16} />
												</SuccessToastIcon>
												<span>Lesson loaded successfully!</span>
											</SuccessToast>
										)}
										
										{!selectedLesson.videourl ? (
											<NoVideoMessage>
												<FiPlayCircle size={48} />
												<h3>No Video Available</h3>
												<p>This lesson doesn't have a video attached.</p>
											</NoVideoMessage>
										) : isYouTubeUrl(selectedLesson.videourl) || isVimeoUrl(selectedLesson.videourl) ? (
											// For YouTube/Vimeo videos, use iframe
									<iframe
										src={getEmbedUrl(selectedLesson.videourl)}

										title={selectedLesson.lessonname}
												frameBorder="0"
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
										onLoad={handleVideoLoad}
												style={{ opacity: videoLoaded ? 1 : 0, width: '100%', aspectRatio: '16/9' }}
											/>
										) : (
											// For direct video files, use HTML5 video element
											<CourseVideo
												src={selectedLesson.videourl}
												controls
												onLoadedData={handleVideoLoad}
												style={{ opacity: videoLoaded ? 1 : 0 }}
											/>
										)}
										
										{!videoLoaded && selectedLesson.videourl && (
											<VideoPlaceholderEnhanced>
												<LoadingSpinner />
												<LoadingText>Loading video...</LoadingText>
											</VideoPlaceholderEnhanced>
										)}
								</VideoContainer>

								{selectedLesson.description && (
										<LessonDescription>
											<h4>Description</h4>
										<p>{selectedLesson.description}</p>
										</LessonDescription>
								)}

                                {/* --- Files Section --- */}
                                {isLoadingFiles ? (
                                    <LoadingIndicator>Loading files...</LoadingIndicator>
                                ) : lessonFiles.length > 0 && (
                                    <FilesSection>
                                        <SectionHeader style={{ marginBottom: '1rem' }}>
                                            <SectionTitle>Lesson Materials</SectionTitle>
                                        </SectionHeader>
                                        <FileList>
                                            {lessonFiles.map(file => (
                                                <FileItem key={file.id}>
                                                    <FileInfo>
                                                        <FileIcon><FiFileText /></FileIcon> 
                                                        <FileName>{file.file_name || 'Untitled File'}</FileName>
                                                    </FileInfo>
                                                    <DownloadButton 
                                                        href={file.file_url} 
                                                        target="_blank" // Open in new tab
                                                        rel="noopener noreferrer" // Security measure
                                                        download // Suggest downloading
                                                    >
                                                        <FiDownload size={14}/> Download
                                                    </DownloadButton>
                                                </FileItem>
                                            ))}
                                        </FileList>
                                    </FilesSection>
                                )}
                                {/* --- End Files Section --- */}

							</motion.div>
					</VideoSection>
						)}
				</CourseContent>
			</ContentSection>
				)}
		</PageContainer>
	)
}

// Add new styled components for subjects grid
const SubjectsSection = styled.div`
	margin-top: 2rem;
	padding: 1.5rem;
	background-color: white;
	border-radius: 0.75rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const SubjectsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const SubjectCard = styled.div<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	padding: 1rem;
	background-color: ${props => props.$isActive ? props.theme.colors.primary[50] : 'white'};
	border: 1px solid ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.border.light};
	border-radius: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		border-color: ${props => props.theme.colors.primary[500]};
	}
`;

const SubjectIconWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 8px;
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[600]};
	margin-right: 0.75rem;
`;

const SubjectContent = styled.div`
	flex: 1;
`;

const SubjectName = styled.div`
	font-weight: 600;
	margin-bottom: 0.25rem;
	color: ${props => props.theme.colors.text.primary};
`;

const SubjectCode = styled.div`
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
`;

const SubjectCount = styled.span`
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
	display: flex;
	align-items: center;
`;

const EmptyState = styled.div`
	padding: 2rem;
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 0.5rem;
	margin-top: 1rem;
`;

const EmptyStateText = styled.p`
	font-size: 0.9rem;
	margin: 0;
`;

const LoadingIndicator = styled.div`
	padding: 2rem;
	text-align: center;
	color: ${props => props.theme.colors.text.secondary};
`;

// Styled Components
const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;

	@media (max-width: 768px) {
		padding: 1.5rem 1rem;
	}
`

const HeaderSection = styled.div`
	margin-bottom: 2rem;
`

const ContentSection = styled.div`
	margin-bottom: 2rem;
`

const Breadcrumb = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	font-size: 0.875rem;
	color: ${props => props.theme.colors.text.secondary};
`

interface BreadcrumbItemProps {
	active?: boolean
}

const BreadcrumbItem = styled.span<BreadcrumbItemProps>`
	cursor: pointer;
	color: ${props =>
		props.active ? props.theme.colors.text.primary : props.theme.colors.primary[500]};
	font-weight: ${props => (props.active ? '600' : 'normal')};

	&:hover {
		text-decoration: ${props => (props.active ? 'none' : 'underline')};
	}
`

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: none;
	border: none;
	color: ${props => props.theme.colors.primary[500]};
	font-size: 0.875rem;
	font-weight: 500;
	padding: 0;
	cursor: pointer;
	margin-bottom: 1rem;

	&:hover {
		color: ${props => props.theme.colors.primary[600]};
	}
`

interface CourseHeaderContentProps {
	$category: string
}

const CourseHeader = styled.div`
	margin-bottom: 2rem;
`

const CourseHeaderContent = styled.div<CourseHeaderContentProps>`
	position: relative;
	padding: 2rem;
	border-radius: 1.25rem;
	overflow: hidden;
	background-image: linear-gradient(
		to bottom right,
		${props => {
			switch (props.$category) {
				case 'STEM':
					return 'rgba(167, 139, 250, 0.6), rgba(139, 92, 246, 0.4)' // purple gradient
				case 'Humanities':
					return 'rgba(251, 191, 36, 0.6), rgba(245, 158, 11, 0.4)' // amber gradient
				case 'Athletics':
					return 'rgba(52, 211, 153, 0.6), rgba(16, 185, 129, 0.4)' // green gradient
				case 'Arts':
					return 'rgba(236, 72, 153, 0.6), rgba(219, 39, 119, 0.4)' // pink gradient
				default:
					return 'rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.4)' // blue gradient
			}
		}}
	);
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
`

const CourseInfo = styled.div`
	color: white;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	max-width: 650px;
`

const CourseTitle = styled.h1`
	font-size: 2.25rem;
	font-weight: 700;
	margin: 0 0 1rem;

	@media (max-width: 768px) {
		font-size: 1.75rem;
	}
`

const CourseDescription = styled.p`
	font-size: 1.125rem;
	margin: 0 0 1.5rem;
	opacity: 0.9;
	line-height: 1.6;

	@media (max-width: 768px) {
		font-size: 1rem;
	}
`

const CourseMeta = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	flex-wrap: wrap;
`

const CourseMetaItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`

interface CategoryBadgeProps {
	$category: string
}

const CategoryBadge = styled.span<CategoryBadgeProps>`
	display: inline-block;
	padding: 0.35rem 1rem;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
	background-color: rgba(255, 255, 255, 0.25);
	backdrop-filter: blur(5px);
	color: white;
`

const LessonCount = styled.div`
	font-size: 0.875rem;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: rgba(255, 255, 255, 0.9);
`

const CourseContent = styled.div`
	display: grid;
	grid-template-columns: 350px 1fr;
	gap: 2rem;

	@media (max-width: 1024px) {
		grid-template-columns: 300px 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: 2rem;
	}
`

const SectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const LessonsSection = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 1rem;
	padding: 1.5rem;
	height: fit-content;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-right: 1.5rem;

	@media (max-width: 768px) {
		margin-bottom: 2rem;
		margin-right: 0;
	}
`

const LessonsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	max-height: 600px;
	overflow-y: auto;
	padding-right: 0.5rem;

	/* Scrollbar styling */
	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 10px;
	}

	&::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 10px;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}
`

interface LessonItemProps {
	$isActive: boolean
}

const LessonItem = styled.div<LessonItemProps>`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.75rem;
	cursor: pointer;
	background-color: ${props => (props.$isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent')};
	border: 1px solid ${props => (props.$isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent')};
	transition: all 0.2s ease;

	&:hover {
		background-color: ${props =>
			props.$isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)'};
	}
`

const LessonNumber = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.background.tertiary};
	font-size: 0.875rem;
	font-weight: 600;
	color: ${props => props.theme.colors.text.primary};
	flex-shrink: 0;
`

const LessonContent = styled.div`
	flex: 1;
	min-width: 0;
`

const LessonTitle = styled.h3`
	font-size: 0.9375rem;
	font-weight: 500;
	margin: 0 0 0.25rem;
	color: ${props => props.theme.colors.text.primary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const LessonMeta = styled.div`
	display: flex;
	gap: 1rem;
`

const Duration = styled.div`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: ${props => props.theme.colors.text.secondary};
`

const PlayButton = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background-color: ${props => props.theme.colors.primary[100]};
	color: ${props => props.theme.colors.primary[600]};
	flex-shrink: 0;
	opacity: 0.8;
	transition: all 0.2s ease;

	${LessonItem}:hover & {
		background-color: ${props => props.theme.colors.primary[500]};
		color: white;
		opacity: 1;
	}
`

const NowPlayingBadge = styled.div`
	display: flex;
	align-items: center;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	background-color: ${props => props.theme.colors.primary[500]};
	color: white;
	font-size: 0.75rem;
	font-weight: 500;
	flex-shrink: 0;
`

const VideoSection = styled.div`
	background-color: ${props => props.theme.colors.background.secondary};
	border-radius: 1rem;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const VideoHeader = styled.div`
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

const SelectedLessonTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	color: ${props => props.theme.colors.text.primary};
`

const SelectedLessonMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${props => props.theme.colors.text.secondary};
	font-size: 0.875rem;
`

const VideoContainer = styled.div<{ $loaded: boolean }>`
	position: relative;
	width: 100%;

	iframe {
		aspect-ratio: 16 / 9;
		width: 100%;
		border: none;
		display: block;
	}

	${props =>
		props.$loaded
			? `
		iframe {
			opacity: 1;
		}
	`
			: `
		iframe {
			opacity: 0;
		}
	`}
`

const VideoPlaceholder = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
`

const LoadingSpinner = styled.div`
	width: 3rem;
	height: 3rem;
	border: 4px solid ${props => props.theme.colors.primary[100]};
	border-top: 4px solid ${props => props.theme.colors.primary[500]};
	border-radius: 50%;
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
`

const LoadingText = styled.p`
	font-size: 1rem;
	color: ${props => props.theme.colors.text.secondary};
`

const VideoPlaceholderEnhanced = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: ${props => props.theme.colors.background.tertiary};
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	
	/* Define styles for children components */
	> div {  /* Target the LoadingSpinner */
		width: 2.5rem;
		height: 2.5rem;
	}
`

const CourseVideo = styled.video`
	width: 100%;
	height: 100%;
`

const LessonDescription = styled.div`
	padding: 1.5rem;
	border-top: 1px solid ${props => props.theme.colors.border.light};

	h4 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: ${props => props.theme.colors.text.primary};
	}

	p {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: ${props => props.theme.colors.text.secondary};
		margin: 0;
	}
`

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 50vh;
	gap: 1.5rem;
`

const NotFoundContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 4rem 2rem;

	h2 {
		font-size: 1.5rem;
		margin: 1rem 0 0.5rem;
		color: ${props => props.theme.colors.text.primary};
	}

	p {
		color: ${props => props.theme.colors.text.secondary};
		margin-bottom: 2rem;
	}
`

const NotFoundIcon = styled.div`
	font-size: 3rem;
	font-weight: 700;
	color: ${props => props.theme.colors.primary[500]};
	opacity: 0.6;
`

const SuccessToast = styled.div`
	position: absolute;
	top: 1rem;
	right: 1rem;
	padding: 0.5rem 1rem;
	background-color: #ecfdf5;
	border: 1px solid #10b981;
	color: #065f46;
	border-radius: 0.25rem;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	z-index: 10;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const SuccessToastIcon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-right: 0.5rem;
	color: #10b981;
`

const NoVideoMessage = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	aspect-ratio: 16/9;
	width: 100%;
	background-color: ${props => props.theme.colors.background.tertiary};
	color: ${props => props.theme.colors.text.secondary};
	text-align: center;
	padding: 2rem;

	h3 {
		margin: 1rem 0 0.5rem;
		font-size: 1.25rem;
		color: ${props => props.theme.colors.text.primary};
	}

	p {
		margin: 0;
		font-size: 0.875rem;
	}

	svg {
		color: ${props => props.theme.colors.primary[300]};
		opacity: 0.7;
	}
`

// Styled components for Files Section
const FilesSection = styled.div`
    margin-top: 2rem; // Space above the files section
    padding: 1.5rem;
    border-top: 1px solid ${props => props.theme.colors.border.light};
`;

const FileList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem; // Space between files
`;

const FileItem = styled.li`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: ${props => props.theme.colors.background.tertiary};
    border-radius: ${props => props.theme.borderRadius.md};
    border: 1px solid ${props => props.theme.colors.border.light};
`;

const FileInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`;

const FileIcon = styled.div`
    font-size: 1.25rem;
    color: ${props => props.theme.colors.primary[500]};
    display: flex;
    align-items: center;
`;

const FileName = styled.span`
    font-size: 0.9rem;
    font-weight: 500;
    color: ${props => props.theme.colors.text.primary};
`;

const DownloadButton = styled.a`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background-color: ${props => props.theme.colors.primary[500]};
    color: white;
    border: none;
    border-radius: ${props => props.theme.borderRadius.sm};
    font-size: 0.8rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: ${props => props.theme.colors.primary[600]};
    }

    svg {
        font-size: 0.9rem;
    }
`;

export default TeacherClassDetails