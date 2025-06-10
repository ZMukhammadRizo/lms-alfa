import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiUser, FiBarChart2, FiCheck, FiX, FiAlertCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentGrades, SubjectGrade,   } from '../../services/gradesService';
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Type for view mode
type GradeViewMode = 'quarterly' | 'daily';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const GradeDetails: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<SubjectGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<GradeViewMode>('quarterly'); // State for view mode
  
  const { user } = useAuth();
  
  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !subjectId) {
        console.error('Missing required information (user ID or subject ID)');
        navigate('/student/grades');
        return;
      }
      
      setLoading(true);
      try {
        // Fetch all grades to find this specific subject
        const gradesData = await getStudentGrades(user.id);
        
        // Use an empty array as fallback if no real data is available
        const allGrades = gradesData.length > 0 ? gradesData : [];
        const foundSubject = allGrades.find((subject: SubjectGrade) => subject.id === subjectId);
        
   
        // Set subject to foundSubject or null if not found
        setSubject(foundSubject || null);
      } catch (error) {
        console.error('Error fetching subject details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, subjectId, navigate]);

  // Get attendance pie chart data
  const getAttendanceChartData = (attendance: SubjectGrade['attendance']) => {
    return [
      { name: 'Present', value: attendance.present, color: '#4CAF50' },
      { name: 'Absent', value: attendance.absent, color: '#F44336' },
      { name: 'Late', value: attendance.late, color: '#FF9800' },
      { name: 'Excused', value: attendance.excused, color: '#2196F3' },
    ].filter(item => item.value > 0); // Only show non-zero values
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <p>Loading subject details...</p>
      </LoadingContainer>
    );
  }

  if (!subject) {
    return (
      <ErrorContainer>
        <p>Subject not found</p>
        <BackButton onClick={() => navigate('/student/grades')}>
          <FiArrowLeft />
          Back to Grades
        </BackButton>
      </ErrorContainer>
    );
  }

  return (
    <DetailsContainer
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <DetailsHeader>
        <BackButton onClick={() => navigate('/student/grades')}>
          <FiArrowLeft />
          Back to Grades
        </BackButton>
        <DetailsTitle $color={subject.color}>
          {subject.subjectName}
        </DetailsTitle>
        <DetailsSubtitle>
          <FiUser size={16} />
          <span>
            {subject.teacherFirstName && subject.teacherLastName 
              ? `${subject.teacherFirstName} ${subject.teacherLastName}` 
              : subject.teacherName}
          </span>
          <Separator />
          <FiCalendar size={16} />
          <span>{subject.className}</span>
        </DetailsSubtitle>
      </DetailsHeader>

      <TwoColumnLayout>
        <SectionContainer variants={itemVariants}>
          <SectionTitle>
            <FiClock size={20} />
            Attendance
          </SectionTitle>
          <AttendanceSummary>
            <AttendanceStatItem>
              <StatIcon $color="#4CAF50"><FiCheck size={18} /></StatIcon>
              <StatLabel>Present:</StatLabel>
              <StatValue>{subject.attendance.present} days</StatValue>
            </AttendanceStatItem>
            <AttendanceStatItem>
              <StatIcon $color="#F44336"><FiX size={18} /></StatIcon>
              <StatLabel>Absent:</StatLabel>
              <StatValue>{subject.attendance.absent} days</StatValue>
            </AttendanceStatItem>
            <AttendanceStatItem>
              <StatIcon $color="#FF9800"><FiClock size={18} /></StatIcon>
              <StatLabel>Late:</StatLabel>
              <StatValue>{subject.attendance.late} days</StatValue>
            </AttendanceStatItem>
            <AttendanceStatItem>
              <StatIcon $color="#2196F3"><FiAlertCircle size={18} /></StatIcon>
              <StatLabel>Excused:</StatLabel>
              <StatValue>{subject.attendance.excused} days</StatValue>
            </AttendanceStatItem>
            <AttendanceRateWrapper>
              <AttendanceRateLabel>Total Attendance Rate:</AttendanceRateLabel>
              <AttendanceRate $percentage={subject.attendance.percentage}>
                {subject.attendance.percentage}%
              </AttendanceRate>
            </AttendanceRateWrapper>
          </AttendanceSummary>
        </SectionContainer>

        <SectionContainer variants={itemVariants}>
          <SectionTitle>
            <FiBarChart2 size={20} />
            Attendance Breakdown
          </SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getAttendanceChartData(subject.attendance)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {getAttendanceChartData(subject.attendance).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} days`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </SectionContainer>
      </TwoColumnLayout>

      <SectionContainer variants={itemVariants}>
        <SectionHeaderWithToggle>
          <SectionTitle>
            <FiBarChart2 size={20} />
            Grade Details
          </SectionTitle>
          {/* View Toggle Buttons */}
          <ViewToggle>
            <ToggleButton 
              $active={viewMode === 'quarterly'} 
              onClick={() => setViewMode('quarterly')}
            >
              Quarterly
            </ToggleButton>
            <ToggleButton 
              $active={viewMode === 'daily'} 
              onClick={() => setViewMode('daily')}
            >
              Daily
            </ToggleButton>
          </ViewToggle>
        </SectionHeaderWithToggle>

        {/* Conditional Table Rendering */}
        <GradesTable>
          <thead>
            {viewMode === 'quarterly' ? (
              <tr>
                <th>Quarter</th>
                <th>Score</th>
                <th>Letter Grade</th>
                <th>Status</th>
              </tr>
            ) : (
              <tr>
                <th>Lesson</th>
                <th>Date</th>
                <th>Score</th>
                {/* Optional: Add Letter Grade/Status for daily if needed */}
              </tr>
            )}
          </thead>
          <tbody>
            {viewMode === 'quarterly' ? (
              // Quarterly View
              subject.grades.map((grade) => (
                <tr key={grade.quarterId}>
                  <td>{grade.quarterName}</td>
                  <td>
                    <ScoreCell $score={grade.score}>
                      {grade.score}
                    </ScoreCell>
                  </td>
                  <td>
                    <GradeCell $score={grade.score}>
                      {grade.letterGrade}
                    </GradeCell>
                  </td>
                  <td>
                    <GradeStatus $score={grade.score}>
                      {grade.score >= 60 ? 'Passing' : 'Failing'}
                    </GradeStatus>
                  </td>
                </tr>
              ))
            ) : (
              // Daily View
              subject.dailyScores && subject.dailyScores.length > 0 ? (
                subject.dailyScores.map((score) => (
                  <tr key={score.id}> 
                    <td>{score.lessonTitle}</td>
                    <td>{score.lessonDate ? new Date(score.lessonDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <ScoreCell $score={score.score}>
                        {score.score}
                      </ScoreCell>
                    </td>
                    {/* Optional: Add cells for daily letter grade/status */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No daily scores available.</td>
                </tr>
              )
            )}
          </tbody>
        </GradesTable>
      </SectionContainer>
    </DetailsContainer>
  );
};

// Styled Components
const DetailsContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const DetailsHeader = styled.div`
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #3f51b5;
  font-weight: 500;
  padding: 8px 0;
  cursor: pointer;
  margin-bottom: 16px;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface ColorProps {
  $color?: string;
}

const DetailsTitle = styled.h1<ColorProps>`
  font-size: 2.2rem;
  margin: 0 0 12px 0;
  color: ${props => props.$color || '#333'};
`;

const DetailsSubtitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 1rem;
`;

const Separator = styled.div`
  height: 16px;
  width: 1px;
  background-color: #ddd;
  margin: 0 4px;
`;

const SectionContainer = styled(motion.div)`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AttendanceSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AttendanceStatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`;

interface IconColorProps {
  $color: string;
}

const StatIcon = styled.div<IconColorProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => `${props.$color}22`}; /* Adding transparency */
  color: ${props => props.$color};
`;

const StatLabel = styled.span`
  font-weight: 500;
  flex: 1;
`;

const StatValue = styled.span`
  font-weight: 600;
`;

const AttendanceRateWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  margin-top: 8px;
  border-top: 1px solid #eee;
`;

const AttendanceRateLabel = styled.span`
  font-weight: 500;
  flex: 1;
`;

interface PercentageProps {
  $percentage: number;
}

const AttendanceRate = styled.span<PercentageProps>`
  font-weight: 700;
  font-size: 1.2rem;
  color: ${props => {
    if (props.$percentage >= 90) return '#4CAF50';
    if (props.$percentage >= 80) return '#8BC34A';
    if (props.$percentage >= 70) return '#FFEB3B';
    if (props.$percentage >= 60) return '#FF9800';
    return '#F44336';
  }};
`;

const GradesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 16px;
    text-align: left;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
  
  tr {
    border-bottom: 1px solid #eee;
  }
  
  tr:last-child {
    border-bottom: none;
  }
`;

interface ScoreProps {
  $score: number;
}

const ScoreCell = styled.div<ScoreProps>`
  font-weight: 600;
  color: ${props => {
    const score = props.$score;
    if (score >= 9) return '#4CAF50'; // A
    if (score >= 8) return '#8BC34A'; // B
    if (score >= 7) return '#FFEB3B'; // C
    if (score >= 6) return '#FF9800'; // D
    return '#F44336'; // F
  }};
`;

const GradeCell = styled.div<ScoreProps>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props => {
    const score = props.$score;
    const color = score >= 9 ? '#4CAF50' : score >= 8 ? '#8BC34A' : score >= 7 ? '#FFEB3B' : score >= 6 ? '#FF9800' : '#F44336';
    return `${color}22`;
  }};
  color: ${props => {
    const score = props.$score;
    return score >= 9 ? '#4CAF50' : score >= 8 ? '#8BC34A' : score >= 7 ? '#FFEB3B' : score >= 6 ? '#FF9800' : '#F44336';
  }};
  font-weight: 700;
`;

const GradeStatus = styled.div<ScoreProps>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background-color: ${props => props.$score >= 60 ? '#4CAF5022' : '#F4433622'};
  color: ${props => props.$score >= 60 ? '#4CAF50' : '#F44336'};
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3f51b5;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
`;

// New styled components for the toggle
const SectionHeaderWithToggle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ViewToggle = styled.div`
  display: flex;
  background-color: ${props => props.theme.colors.background.tertiary};
  border-radius: 8px;
  padding: 4px;
`;

interface ToggleButtonProps {
  $active: boolean;
}

const ToggleButton = styled.button<ToggleButtonProps>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  background-color: ${props => props.$active ? props.theme.colors.primary[500] : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text.secondary};

  &:hover {
    background-color: ${props => props.$active ? props.theme.colors.primary[600] : props.theme.colors.background.secondary};
    color: ${props => props.$active ? 'white' : props.theme.colors.text.primary};
  }
`;

export default GradeDetails; 