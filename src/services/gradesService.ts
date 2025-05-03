import useGradesStore from '../store/gradesStore'
import { Attendance } from '../store/attendanceStore'
import {
	ClassSubjectOverview,
	GradeLevelOverview,
	JournalTable,
	LevelCategoryOverview,
} from '../types/grades'
import supabase from '../config/supabaseClient'
import { toast } from 'react-toastify'

// Debug function to check database tables structure
export async function debugCheckTables() {
	console.log('🔍 Checking database tables structure...');
	
	try {
		// Check scores table
		const { data: scores, error: scoresError } = await supabase
			.from('scores')
			.select('*')
			.limit(1);
			
		if (scoresError) {
			console.error('❌ Error accessing scores table:', scoresError);
		} else {
			console.log('✅ Scores table accessible:', scores);
			if (scores && scores.length > 0) {
				console.log('    Columns in scores:', Object.keys(scores[0]));
			}
		}
		
		// Check attendance table
		const { data: attendance, error: attendanceError } = await supabase
			.from('attendance')
			.select('*')
			.limit(1);
			
		if (attendanceError) {
			console.error('❌ Error accessing attendance table:', attendanceError);
		} else {
			console.log('✅ Attendance table accessible:', attendance);
			if (attendance && attendance.length > 0) {
				console.log('    Columns in attendance:', Object.keys(attendance[0]));
			}
		}
	} catch (error) {
		console.error('❌ Critical error checking tables:', error);
	}
}

// Utility methods that either encapsulate special logic or aren't suitable for the store

// Get class information by ID (can be used without the store)
export const getClassInfo = async (classId: string): Promise<{ id: string; name: string }> => {
	const { data, error } = await supabase
		.from('classes')
		.select('id, classname')
		.eq('id', classId)
		.single()

	if (error) {
		console.error('Error fetching class info:', error)
		// Return mock data for development
		return {
			id: classId,
			name: `Class ${classId.toUpperCase()}`,
		}
	}

	return {
		id: data.id,
		name: data.classname,
	}
}

// Get grade information by ID (can be used without the store)
export const getGradeInfo = async (gradeId: string): Promise<{ id: string; name: string }> => {
	const { data, error } = await supabase
		.from('levels')
		.select('id, name')
		.eq('id', gradeId)
		.single()

	if (error) {
		console.error('Error fetching grade info:', error)
		// Return mock data for development
		return {
			id: gradeId,
			name: `Grade ${gradeId}`,
		}
	}

	return {
		id: data.id,
		name: `Grade ${data.name}`,
	}
}

// Wrapper functions that use the store, making it easier to migrate existing code

// Get all grade levels assigned to a teacher
export const getTeacherLevels = async (): Promise<GradeLevelOverview[]> => {
	const store = useGradesStore.getState()
	await store.fetchTeacherLevels()
	return store.levels
}

// Get all classes for a specific level assigned to a teacher (optional levelId)
export const getLevelClasses = async (levelId?: string): Promise<LevelCategoryOverview[]> => {
	const store = useGradesStore.getState()
	await store.fetchLevelClasses(levelId)
	return store.classes
}

// Get all classes directly assigned to a teacher
export const getTeacherClasses = async () => {
	const store = useGradesStore.getState()
	await store.fetchTeacherClasses()
	return store.classes
}

// Get all subjects for a specific class
export const getClassSubjects = async (classId: string): Promise<ClassSubjectOverview[]> => {
	const store = useGradesStore.getState()
	await store.fetchClassSubjects(classId)
	return store.subjects
}

// Get lesson count for a subject
export const getLessonCount = async (subjectId: string): Promise<number> => {
	const { count, error } = await supabase
		.from('lessons')
		.select('*', { count: 'exact', head: true })
		.eq('subjectid', subjectId)

	if (error) {
		console.error('Error fetching lesson count:', error)
		throw error
	}

	return count || 0
}

// Get journal data for a specific subject in a class
export const getJournalData = async (
	classId: string,
	subjectId: string,
	quarterId: string
): Promise<JournalTable> => {
	const store = useGradesStore.getState()
	await store.fetchJournalData(classId, subjectId, quarterId)
	return store.journalData as JournalTable
}

// Save or update a score
export const saveScore = async (
	studentId: string,
	lessonId: string,
	quarterId: string,
	score: number
): Promise<void> => {
	const store = useGradesStore.getState()
	await store.saveScore(studentId, lessonId, quarterId, score)
}

// Get active quarters
export const getActiveQuarters = async (): Promise<any[]> => {
	const store = useGradesStore.getState()
	await store.fetchActiveQuarters()
	return store.activeQuarters
}

/**
 * Interface for subject data with grades and attendance
 */
export interface SubjectGrade {
	id: string;
	subjectName: string;
	teacherName: string;
	teacherFirstName?: string;
	teacherLastName?: string;
	className: string;
	color?: string;
	grades: {
		quarterId: string;
		quarterName: string;
		score: number;
		letterGrade: string;
	}[];
	dailyScores?: ScoreRecord[];
	attendance: {
		present: number;
		absent: number;
		late: number;
		excused: number;
		percentage: number;
	};
	materials?: number;
}

// Interface for raw data fetched from scores table
interface RawScoreData {
	id: string;
	lesson_id: string; // Snake case from DB
	score: number;
	created_at: string; // Snake case from DB
	quarter_id?: string; // Snake case from DB
}

// Define structure for individual score records (camelCase for frontend)
export interface ScoreRecord {
	id: string;
	lessonId: string;
	lessonTitle?: string;
	lessonDate?: string;
	score: number;
	quarterId?: string;
}

/**
 * Get all subjects with grades for a student
 */
export async function getStudentGrades(studentId: string): Promise<SubjectGrade[]> {
	try {
		// Check if studentId is valid (not empty)
		if (!studentId || studentId.trim() === '') {
			console.warn('Invalid student ID provided');
			toast.error('Invalid student ID. Please login again.');
			return [];
		}

		console.log('📊 Fetching grades data for student ID:', studentId);

		// Check if required tables exist - only fetch from ONE table to minimize requests
		const { data: testData, error: tableCheckError } = await supabase
			.from('scores')
			.select('id')
			.limit(1);
		
		if (tableCheckError) {
			console.error('❌ Required database tables do not exist:', tableCheckError);
			toast.error('Database tables might be missing. Using mock data instead.');
			return getMockGrades();
		}

		// Get student's class information first
		const { data: studentData, error: studentError } = await supabase
			.from('classstudents')
			.select('classid')
			.eq('studentid', studentId);

		if (studentError) {
			console.error('❌ Error fetching student class info:', studentError);
			toast.error('Error fetching your class information.');
			return [];
		}
		
		if (!studentData || studentData.length === 0) {
			console.warn('⚠️ No classes found for student ID:', studentId);
			toast.warning('You are not assigned to any classes. Please contact your administrator.');
			return [];
		}
		
		// Extract class IDs
		const classIds = studentData.map(item => item.classid);
		console.log('📚 Student is assigned to classes:', classIds);
		
		// Get subjects for those classes - simplify query to avoid foreign key issues
		const { data: classSubjectsData, error: classSubjectsError } = await supabase
			.from('classsubjects')
			.select(`
				id, 
				classid, 
				subjectid
			`)
			.in('classid', classIds);

		if (classSubjectsError) {
			console.error('❌ Error fetching class subjects:', classSubjectsError);
			toast.error('Error fetching subject information.');
			return [];
		}
		
		if (!classSubjectsData || classSubjectsData.length === 0) {
			console.warn('⚠️ No subjects found for classes:', classIds);
			toast.warning('No subjects are assigned to your classes. Please contact your administrator.');
			return [];
		}

		console.log('📝 Found class subjects:', classSubjectsData.length);
		
		// Get class details including teacherid
		const { data: fetchedClassesData, error: fetchedClassesError } = await supabase
			.from('classes')
			.select('id, classname, teacherid') // Fetch teacherid here
			.in('id', classIds);
			
		if (fetchedClassesError || !fetchedClassesData) {
			console.error('❌ Error fetching class details:', fetchedClassesError);
			// Handle error appropriately, maybe return empty or mock data
			return []; // Or return mock data
		}
		const classesData = fetchedClassesData; // Assign to the original variable name if needed elsewhere, or refactor
		
		// --- Fetch Teacher Information --- 
		// Extract unique teacher IDs from classesData
		const teacherIds = classesData
			.map(c => c.teacherid)
			.filter((id, index, self) => id && self.indexOf(id) === index); 
		
		let teachersData: any[] | null = null;
		if (teacherIds.length > 0) {
			const { data, error: teachersError } = await supabase
				.from('users') // Assuming teachers are in the users table
				.select('id, firstName, lastName') // Use camelCase: firstName, lastName
				.in('id', teacherIds);

			if (teachersError) {
				console.error('❌ Error fetching teacher details:', teachersError);
				// Continue without teacher names if fetch fails
			} else {
				teachersData = data;
				console.log('🧑‍🏫 Found teachers:', teachersData?.length);
			}
		}
		// --- End Fetch Teacher Information ---
		
		// Get subject details
		const subjectIds = classSubjectsData.map(cs => cs.subjectid);
		const { data: subjectsData, error: subjectsError } = await supabase
			.from('subjects')
			.select('id, subjectname')
			.in('id', subjectIds);
			
		if (subjectsError || !subjectsData || subjectsData.length === 0) {
			console.error('❌ Error fetching subject details:', subjectsError);
			return [];
		}
		
		// Combine the data to create the subject list
		const combinedSubjects = classSubjectsData.map(classSubject => {
			const subject = subjectsData.find(s => s.id === classSubject.subjectid);
			const classInfo = classesData?.find(c => c.id === classSubject.classid);
			
			if (!subject || !classInfo) return null; // Ensure we have both subject and class info

			// Find the teacher using the teacherid from classInfo
			const teacher = teachersData?.find(t => t.id === classInfo.teacherid);
			
			return {
				id: classSubject.id,
				subjects: subject,
				classes: classInfo, // Contains classname and teacherid
				teacher: teacher // Contains teacher firstname/lastname
			};
		}).filter(Boolean);

		// Get quarters
		const { data: quartersData, error: quartersError } = await supabase
			.from('quarters')
			.select('*')
			.order('start_date', { ascending: true });

		if (quartersError || !quartersData || quartersData.length === 0) {
			console.error('❌ Error fetching quarters or no quarters found:', quartersError);
			toast.error('No academic quarters found in the system.');
			return [];
		}

		console.log('🗓️ Found quarters:', quartersData.length);

		// For each subject, get the grades and attendance
		const subjectsWithGrades = await Promise.all(
			combinedSubjects.map(async (subject) => {
				try {
					if (!subject) {
						console.error('❌ Invalid subject data (null)');
						return null;
					}
					
					const subjectId = subject.subjects?.id;
					if (!subjectId) {
						console.error('❌ Invalid subject data:', subject);
						return null;
					}

					// --- Fetch Lessons for the Subject ---
					let lessonIds: string[] = [];
					let lessonsMap = new Map<string, { id: string; lessonname?: string }>();
					try {
						const { data: lessonsData, error: lessonsError } = await supabase
							.from('lessons')
							.select('id, lessonname')
							.eq('subjectid', subjectId);

						if (lessonsError) {
							console.error(`❌ Error fetching lessons for subject ${subjectId}:`, lessonsError);
						} else if (lessonsData) {
							lessonIds = lessonsData.map(lesson => lesson.id);
							lessonsData.forEach(lesson => lessonsMap.set(lesson.id, lesson));
							console.log(`📚 Found ${lessonIds.length} lessons for subject ${subjectId}`);
						}
					} catch (err) {
						console.error(`❌ Critical error fetching lessons:`, err);
					}
					// --- End Fetch Lessons ---

					// --- Fetch Scores for Subject's Lessons ---
					let scoresData: ScoreRecord[] | null = null;
					let scoresError = null;
					
					if (lessonIds.length > 0) {
						try {
							// Fetch into a raw data variable
							const { data: rawScores, error } = await supabase
								.from('scores')
								.select('id, lesson_id, score, created_at, quarter_id') 
								.eq('student_id', studentId) 
								.in('lesson_id', lessonIds);
								
							scoresError = error;

							// --- Debugging Log --- 
							console.log('Raw scores fetched:', { rawScores, scoresError }); 
							// --- End Debugging Log ---

							if (scoresError) {
								console.error(`❌ Error fetching scores for subject ${subjectId} lessons:`, scoresError);
							} else if (rawScores) {
								// Map raw data to ScoreRecord[] immediately
								scoresData = rawScores.map((rawScore: RawScoreData): ScoreRecord => {
									const lessonInfo = lessonsMap.get(rawScore.lesson_id);
									return {
										id: rawScore.id,
										lessonId: rawScore.lesson_id,
										lessonTitle: lessonInfo?.lessonname || 'Unknown Lesson',
										lessonDate: rawScore.created_at,
										score: rawScore.score,
										quarterId: rawScore.quarter_id
									};
								});
								console.log(`💰 Mapped ${scoresData?.length || 0} score records for subject ${subjectId}`);
							} else {
								scoresData = []; // Ensure it's an empty array if rawScores is null/undefined
							}
						} catch (err) {
							console.error(`❌ Error querying scores for subject ${subjectId}:`, err);
							scoresError = err;
						}
					} else {
						console.warn(`⚠️ No lessons found for subject ${subjectId}, cannot fetch scores.`);
					}
					// --- End Fetch Scores ---

					// --- Fetch Attendance for Subject's Lessons ---
					let attendanceData: Attendance[] | null = null;
					let attendanceError = null;
					
					if (lessonIds.length > 0) {
						try {
							const { data, error } = await supabase
								.from('attendance')
								.select('*')
								.eq('student_id', studentId)
								.in('lesson_id', lessonIds);
								
							attendanceData = data;
							attendanceError = error;

							if (attendanceError) {
								console.error(`❌ Error fetching attendance for subject ${subjectId} lessons:`, attendanceError);
								console.warn('Using mock data for attendance due to database error');
							} else {
								console.log(`📊 Fetched ${attendanceData?.length || 0} attendance records for subject ${subjectId}`);
							}
						} catch (err) {
							console.error(`❌ Error querying attendance for subject ${subjectId}:`, err);
							attendanceError = err;
						}
					} else {
						console.warn(`⚠️ No lessons found for subject ${subjectId}, cannot fetch attendance.`);
					}
					// --- End Fetch Attendance ---

					// --- Determine Teacher Name --- 
					const teacherFirstName = subject.teacher?.firstName || 'Unknown';
					const teacherLastName = subject.teacher?.lastName || 'Teacher';
					// --- End Determine Teacher Name ---

					// If errors occurred, use mock data for this subject
					let grades = [];
					
					// Process grades data by quarter only if we have data
					if (!scoresError && scoresData && scoresData.length > 0) {
						grades = quartersData.map(quarter => {
							// Filter scores belonging to this quarter
							const quarterScores = scoresData.filter(score => score.quarterId === quarter.id);
							// Calculate average score for the quarter
							const averageScore = quarterScores.length > 0 
								? Math.round(quarterScores.reduce((sum, score) => sum + score.score, 0) / quarterScores.length)
								: 0;
							
							return {
								quarterId: quarter.id,
								quarterName: quarter.quartername || quarter.name,
								score: averageScore,
								letterGrade: getLetterGrade(averageScore)
							};
						});
					} else {
						// Generate mock grades if we couldn't get real data
						grades = quartersData.map(quarter => {
							const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
							return {
								quarterId: quarter.id,
								quarterName: quarter.quartername || quarter.name,
								score: score,
								letterGrade: getLetterGrade(score)
							};
						});
					}

					// --- Process Daily Scores --- (Use scoresData which is now ScoreRecord[])
					const dailyScores: ScoreRecord[] = scoresData || []; 
					/* Remove redundant mapping logic here - it was already done above
					if (!scoresError && scoresData && scoresData.length > 0) {
						// This block is no longer needed as scoresData is already ScoreRecord[]
					}
					*/
					// --- End Process Daily Scores ---

					// Calculate attendance statistics
					const attendance = calculateAttendance(attendanceData || []);

					// Generate color for subject
					const color = subject && subject.subjects ? getSubjectColor(subject.subjects.subjectname) : '#4299E1';

					return {
						id: subjectId,
						subjectName: subject && subject.subjects ? subject.subjects.subjectname : 'Unknown Subject',
						teacherName: `${teacherFirstName} ${teacherLastName}`,
						teacherFirstName: teacherFirstName,
						teacherLastName: teacherLastName,
						className: subject && subject.classes ? subject.classes.classname || 'Unknown Class' : 'Unknown Class',
						color,
						grades,
						dailyScores,
						attendance,
						materials: 0,
					};
				} catch (error) {
					console.error('❌ Error processing subject data:', error);
					return null;
				}
			})
		);

		// Filter out null results from any subjects that had errors
		const validSubjects = subjectsWithGrades.filter(Boolean) as SubjectGrade[];
		
		if (validSubjects.length === 0) {
			console.warn('⚠️ No valid subjects with grades found.');
			toast.warning('No subjects with grades were found. Data may be incomplete.');
			return [];
		}
		
		console.log('✅ Successfully fetched grades data for', validSubjects.length, 'subjects');
		return validSubjects;
	} catch (error) {
		console.error('❌ Critical error in getStudentGrades:', error);
		toast.error('Error loading grades data. Please try again later or contact support.');
		return [];
	}
}

/**
 * Calculate attendance statistics from attendance records
 */
function calculateAttendance(attendanceData: any[]): {
	present: number;
	absent: number;
	late: number;
	excused: number;
	percentage: number;
} {
	// Default values
	const attendance = {
		present: 0,
		absent: 0,
		late: 0,
		excused: 0,
		percentage: 0
	};

	if (!attendanceData || attendanceData.length === 0) {
		return attendance;
	}

	// Reset counts before iterating
	attendance.present = 0;
	attendance.absent = 0;
	attendance.late = 0;
	attendance.excused = 0;

	// Count attendance based on the status column (case-insensitive)
	attendanceData.forEach(record => {
		const status = record.status?.toLowerCase(); // Get status safely and convert to lowercase

		switch (status) {
			case 'present':
				attendance.present++;
				break;
			case 'absent':
				attendance.absent++;
				break;
			case 'late':
				attendance.late++;
				// Assumption: If someone is late, they are also considered present for the day count?
				// If not, you might need to adjust the logic or total calculation.
				// For now, we count late separately and it contributes to the total days.
				break;
			case 'excused':
				attendance.excused++;
				break;
			default:
				// Optional: Handle unknown or null statuses if necessary
				console.warn(`Unknown attendance status: ${record.status}`);
				break;
		}
	});

	// Calculate attendance percentage
	const total = attendance.present + attendance.absent + attendance.late + attendance.excused;
	// Count present and late (with penalty) for percentage
	// You might want to adjust this logic based on your school's policy
	const presentEquivalent = attendance.present + (attendance.late * 0.5) + (attendance.excused * 0.7);
	
	attendance.percentage = total > 0 ? Math.round((presentEquivalent / total) * 100) : 0;

	return attendance;
}

/**
 * Convert numerical score to letter grade
 */
export function getLetterGrade(score: number): string {
	// Adjust thresholds for 10-point scale
	if (score >= 9) return 'A';
	if (score >= 8) return 'B';
	if (score >= 7) return 'C';
	if (score >= 6) return 'D';
	return 'F';
}

/**
 * Get color based on subject name
 */
export function getSubjectColor(subjectName: string): string {
	// Map of subject keywords to colors
	const colorMap: Record<string, string> = {
		'math': '#4299E1', // blue
		'physics': '#805AD5', // purple
		'chemistry': '#38B2AC', // teal
		'biology': '#68D391', // green
		'history': '#F6AD55', // orange
		'literature': '#FC8181', // red
		'english': '#63B3ED', // light blue
		'geography': '#9AE6B4', // light green
		'art': '#FBD38D', // yellow
		'music': '#B794F4', // light purple
		'pe': '#F687B3', // pink
		'computer': '#76E4F7', // cyan
	};

	// Default colors if no match is found
	const defaultColors = [
		'#4299E1', '#805AD5', '#38B2AC', '#68D391', 
		'#F6AD55', '#FC8181', '#63B3ED', '#9AE6B4',
		'#FBD38D', '#B794F4', '#F687B3', '#76E4F7'
	];

	// Try to find a matching color based on subject name
	const subjectLower = subjectName.toLowerCase();
	for (const [keyword, color] of Object.entries(colorMap)) {
		if (subjectLower.includes(keyword)) {
			return color;
		}
	}

	// If no match, use a color based on string hash
	const hash = subjectName.split('').reduce(
		(acc, char) => acc + char.charCodeAt(0), 0
	);
	
	return defaultColors[hash % defaultColors.length];
}

/**
 * Get all quarters
 */
export async function getQuarters(): Promise<any[]> {
	try {
		const { data, error } = await supabase
			.from('quarters')
			.select('*')
			.order('start_date', { ascending: true });

		if (error || !data || data.length === 0) {
			console.error('Error fetching quarters or no quarters found:', error);
			// Return mock quarters
			return [
				{ id: '1', name: 'Quarter 1', start_date: '2023-09-01', end_date: '2023-11-30' },
				{ id: '2', name: 'Quarter 2', start_date: '2023-12-01', end_date: '2024-02-28' },
				{ id: '3', name: 'Quarter 3', start_date: '2024-03-01', end_date: '2024-05-31' },
				{ id: '4', name: 'Quarter 4', start_date: '2024-06-01', end_date: '2024-08-31' },
			];
		}

		// Normalize quarter data to ensure it has a name property
		return data.map(quarter => ({
			...quarter,
			name: quarter.name || quarter.quartername || `Quarter ${quarter.id}`
		}));
	} catch (error) {
		console.error('Error in getQuarters:', error);
		// Return mock quarters
		return [
			{ id: '1', name: 'Quarter 1', start_date: '2023-09-01', end_date: '2023-11-30' },
			{ id: '2', name: 'Quarter 2', start_date: '2023-12-01', end_date: '2024-02-28' },
			{ id: '3', name: 'Quarter 3', start_date: '2024-03-01', end_date: '2024-05-31' },
			{ id: '4', name: 'Quarter 4', start_date: '2024-06-01', end_date: '2024-08-31' },
		];
	}
}

/**
 * Generate mock grades data for testing when Supabase tables are not available
 * This should only be used during development or when the database is not set up
 */
export function getMockGrades(): SubjectGrade[] {
	const subjects = [
		{ id: '1', name: 'Mathematics', teacherFirst: 'Richard', teacherLast: 'Thompson', class: 'Class 10-A', color: '#4299E1' },
		{ id: '2', name: 'Physics', teacherFirst: 'Lisa', teacherLast: 'Johnson', class: 'Class 10-A', color: '#805AD5' },
		{ id: '3', name: 'Chemistry', teacherFirst: 'Alan', teacherLast: 'Wilson', class: 'Class 10-A', color: '#38B2AC' },
		{ id: '4', name: 'Biology', teacherFirst: 'Sarah', teacherLast: 'Davis', class: 'Class 10-A', color: '#68D391' },
		{ id: '5', name: 'History', teacherFirst: 'James', teacherLast: 'Anderson', class: 'Class 10-A', color: '#F6AD55' },
		{ id: '6', name: 'Literature', teacherFirst: 'Emily', teacherLast: 'Clark', class: 'Class 10-A', color: '#FC8181' },
	];

	const quarters = [
		{ id: '1', name: 'Quarter 1' },
		{ id: '2', name: 'Quarter 2' },
		{ id: '3', name: 'Quarter 3' },
		{ id: '4', name: 'Quarter 4' },
	];

	return subjects.map(subject => {
		// Generate random scores for each quarter (0-10 scale)
		const grades = quarters.map(quarter => {
			// Generate score between 6 and 10 for mock data
			const score = Math.floor(Math.random() * 5) + 6; 
			return {
				quarterId: quarter.id,
				quarterName: quarter.name,
				score, // Now 0-10
				letterGrade: getLetterGrade(score)
			};
		});

		// Generate random attendance data
		const present = Math.floor(Math.random() * 30) + 40; // 40-70 days present
		const absent = Math.floor(Math.random() * 5) + 1; // 1-5 days absent
		const late = Math.floor(Math.random() * 7) + 1; // 1-7 days late
		const excused = Math.floor(Math.random() * 3); // 0-3 days excused
		const total = present + absent + late + excused;
		const percentage = Math.round((present / total) * 100);

		return {
			id: subject.id,
			subjectName: subject.name,
			teacherName: `${subject.teacherFirst} ${subject.teacherLast}`,
			teacherFirstName: subject.teacherFirst,
			teacherLastName: subject.teacherLast,
			className: subject.class,
			color: subject.color,
			grades, // Quarterly grades (scores now 0-10)
			attendance: {
				present,
				absent,
				late,
				excused,
				percentage
			},
			materials: Math.floor(Math.random() * 10) + 1,
			// Add mock daily scores (adjust scores to 0-10 scale)
			dailyScores: [
				{ id: 'ds1', lessonId: 'l1', lessonTitle: 'Intro to Algebra', lessonDate: '2024-01-10T10:00:00Z', score: 9, quarterId: '1' }, 
				{ id: 'ds2', lessonId: 'l2', lessonTitle: 'Equations', lessonDate: '2024-01-17T11:30:00Z', score: 10, quarterId: '1' },
				{ id: 'ds3', lessonId: 'l3', lessonTitle: 'Geometry Basics', lessonDate: '2024-03-05T09:15:00Z', score: 7, quarterId: '3' },
			]
		};
	});
}
