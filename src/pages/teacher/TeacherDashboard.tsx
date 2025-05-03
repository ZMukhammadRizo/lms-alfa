import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiBook, FiUsers, FiClipboard, FiCheckSquare, 
  FiCalendar, FiBarChart2, FiClock, FiMessageSquare,
  FiRefreshCw
} from 'react-icons/fi';
import StatCard from '../../components/admin/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../config/supabaseClient';

const TeacherDashboard: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('week');
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState([
    { id: 1, title: 'My Courses', value: 5, change: '+1', icon: <FiBook />, color: 'primary' },
    { id: 2, title: 'Students', value: 0, change: '0', icon: <FiUsers />, color: 'green' },
    { id: 3, title: 'Assignments', value: 12, change: '+2', icon: <FiClipboard />, color: 'yellow' },
    { id: 4, title: 'Messages', value: 8, change: '+5', icon: <FiMessageSquare />, color: 'purple' },
  ]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);

  // Fetch dashboard data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch student count
        const { count: studentCount, error: studentError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');
          
        if (studentError) {
          console.error('Error fetching student count:', studentError);
        }
        
        // Fetch teacher courses count
        const { data: courses, error: coursesError } = await supabase
          .from('teacher_courses')
          .select('*')
          .eq('teacher_id', user?.id || '');
          
        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
        }
        
        // Fetch assignments count
        const { count: assignmentCount, error: assignmentError } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user?.id || '');
          
        if (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
        }
        
        // Fetch messages count (unread)
        const { count: messageCount, error: messageError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user?.id || '')
          .eq('is_read', false);
          
        if (messageError) {
          console.error('Error fetching messages:', messageError);
        }
        
        // Fetch upcoming classes for today
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const { data: todayClasses, error: classesError } = await supabase
          .from('schedule')
          .select('*, subjects(name), classes(name)')
          .eq('teacher_id', user?.id || '')
          .eq('date', todayStr)
          .order('start_time', { ascending: true });
          
        if (classesError) {
          console.error('Error fetching today classes:', classesError);
        }
        
        // Fetch pending assignments
        const { data: pendingAssignmentsData, error: pendingError } = await supabase
          .from('assignments')
          .select('*, classes(name)')
          .eq('teacher_id', user?.id || '')
          .gt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(3);
          
        if (pendingError) {
          console.error('Error fetching pending assignments:', pendingError);
        }
        
        // Fetch recent grades
        const { data: recentGradesData, error: gradesError } = await supabase
          .from('assessment_results')
          .select('*, classes(name)')
          .eq('teacher_id', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (gradesError) {
          console.error('Error fetching recent grades:', gradesError);
        }
        
        // Update state with fetched data
        setStudentCount(studentCount || 0);
        
        // Update dashboard stats
        setDashboardStats([
          { 
            id: 1, 
            title: 'My Courses', 
            value: courses?.length || 0, 
            change: '+1', 
            icon: <FiBook />, 
            color: 'primary' 
          },
          { 
            id: 2, 
            title: 'Students', 
            value: studentCount || 0, 
            change: `+${Math.floor((studentCount || 0) * 0.05)}`, // 5% growth 
            icon: <FiUsers />, 
            color: 'green' 
          },
          { 
            id: 3, 
            title: 'Assignments', 
            value: assignmentCount || 0, 
            change: '+2', 
            icon: <FiClipboard />, 
            color: 'yellow' 
          },
          { 
            id: 4, 
            title: 'Unread Messages', 
            value: messageCount || 0, 
            change: '+5', 
            icon: <FiMessageSquare />, 
            color: 'purple' 
          }
        ]);
        
        // Format and set upcoming classes data if available
        if (todayClasses && todayClasses.length > 0) {
          const formattedClasses = todayClasses.map(cls => ({
            id: cls.id,
            subject: cls.subjects?.name || 'Unknown Subject',
            class: cls.classes?.name || 'Unknown Class',
            time: formatTime(cls.start_time),
            duration: calculateDuration(cls.start_time, cls.end_time),
            room: cls.room || 'N/A'
          }));
          setUpcomingClasses(formattedClasses);
        }
        
        // Format and set pending assignments data if available
        if (pendingAssignmentsData && pendingAssignmentsData.length > 0) {
          const formattedAssignments = pendingAssignmentsData.map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            class: assignment.classes?.name || 'Unknown Class',
            dueDate: formatDueDate(assignment.due_date),
            submissions: assignment.submissions_count || '0/0'
          }));
          setPendingAssignments(formattedAssignments);
        }
        
        // Format and set recent grades data if available
        if (recentGradesData && recentGradesData.length > 0) {
          const formattedGrades = recentGradesData.map(grade => ({
            id: grade.id,
            title: grade.title || 'Untitled Assessment',
            class: grade.classes?.name || 'Unknown Class',
            avgScore: `${grade.average_score}%`,
            completed: grade.completed_count || '0/0'
          }));
          setRecentGrades(formattedGrades);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  // Helper functions
  const formatTime = (timeStr: string): string => {
    try {
      const date = new Date(`1970-01-01T${timeStr}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      const diff = end.getTime() - start.getTime();
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 60) {
        return `${minutes} mins`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} mins` : `${hours} hr`;
      }
    } catch (e) {
      return '1 hour';
    }
  };

  const formatDueDate = (dateStr: string): string => {
    try {
      const dueDate = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if due date is today
      if (dueDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      // Check if due date is tomorrow
      if (dueDate.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      }
      
      // Calculate days difference
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return `In ${diffDays} days`;
      } else {
        return dueDate.toLocaleDateString();
      }
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <DashboardContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <WelcomeSection>
        <WelcomeMessage>
          <h1>Welcome back, {user?.fullName || 'Teacher'}</h1>
          <p>Here's what's happening with your classes today</p>
        </WelcomeMessage>
        <HeaderControls>
          <TimePeriodSelector>
            <TimePeriodButton
              $isActive={timePeriod === 'today'}
              onClick={() => setTimePeriod('today')}
            >
              Today
            </TimePeriodButton>
            <TimePeriodButton
              $isActive={timePeriod === 'week'}
              onClick={() => setTimePeriod('week')}
            >
              This Week
            </TimePeriodButton>
            <TimePeriodButton
              $isActive={timePeriod === 'month'}
              onClick={() => setTimePeriod('month')}
            >
              This Month
            </TimePeriodButton>
          </TimePeriodSelector>
          
          {isLoading && (
            <RefreshingIndicator>
              <FiRefreshCw className="rotating" />
              Loading...
            </RefreshingIndicator>
          )}
        </HeaderControls>
      </WelcomeSection>

      {/* Stats Overview */}
      <StatsGrid>
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color as any}
              isLoading={isLoading && stat.id === 2} // Only show loading for student count
            />
          </motion.div>
        ))}
      </StatsGrid>

      {/* Student Count Highlight */}
      <StudentCountHighlight
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <StudentCountCard>
          <StudentIcon>
            <FiUsers size={24} />
          </StudentIcon>
          <StudentCountText>
            <StudentCountValue>{isLoading ? "Loading..." : studentCount}</StudentCountValue>
            <StudentCountLabel>Students in System</StudentCountLabel>
          </StudentCountText>
          <StudentCountInfo>
            Stay connected with your students! You can access detailed student information in the Students section.
          </StudentCountInfo>
        </StudentCountCard>
      </StudentCountHighlight>

      {/* Main Content Grid */}
      <DashboardGrid>
        {/* Today's Schedule */}
        <GridItem
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <SectionHeader>
            <SectionTitle>Today's Schedule</SectionTitle>
            <ViewAllButton as={Link} to="/teacher/schedule">View All <FiCalendar /></ViewAllButton>
          </SectionHeader>
          <ScheduleCard>
            {upcomingClasses.map((classItem) => (
              <ScheduleItem key={classItem.id}>
                <ScheduleTime>
                  <TimeIcon><FiClock /></TimeIcon>
                  <TimeText>{classItem.time}</TimeText>
                  <Duration>{classItem.duration}</Duration>
                </ScheduleTime>
                <ScheduleDetails>
                  <SubjectName>{classItem.subject}</SubjectName>
                  <ClassDetails>
                    Class {classItem.class} • {classItem.room}
                  </ClassDetails>
                </ScheduleDetails>
              </ScheduleItem>
            ))}
          </ScheduleCard>
        </GridItem>

        {/* Pending Assignments */}
        <GridItem
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <SectionHeader>
            <SectionTitle>Pending Assignments</SectionTitle>
            <ViewAllButton>View All <FiClipboard /></ViewAllButton>
          </SectionHeader>
          <AssignmentsCard>
            {pendingAssignments.map((assignment) => (
              <AssignmentItem key={assignment.id}>
                <div>
                  <AssignmentTitle>{assignment.title}</AssignmentTitle>
                  <AssignmentClass>Class {assignment.class}</AssignmentClass>
                </div>
                <AssignmentInfo>
                  <AssignmentDue>Due: {assignment.dueDate}</AssignmentDue>
                  <AssignmentSubmissions>Submissions: {assignment.submissions}</AssignmentSubmissions>
                </AssignmentInfo>
              </AssignmentItem>
            ))}
          </AssignmentsCard>
        </GridItem>

        {/* Recent Grades */}
        <GridItem
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <SectionHeader>
            <SectionTitle>Recent Grades</SectionTitle>
            <ViewAllButton>View All <FiCheckSquare /></ViewAllButton>
          </SectionHeader>
          <GradesCard>
            {recentGrades.map((grade) => (
              <GradeItem key={grade.id}>
                <div>
                  <GradeTitle>{grade.title}</GradeTitle>
                  <GradeClass>Class {grade.class}</GradeClass>
                </div>
                <GradeInfo>
                  <GradeScore>Avg. Score: {grade.avgScore}</GradeScore>
                  <GradeCompletion>Completed: {grade.completed}</GradeCompletion>
                </GradeInfo>
              </GradeItem>
            ))}
          </GradesCard>
        </GridItem>

        {/* Performance Overview */}
        <GridItem
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <SectionHeader>
            <SectionTitle>Class Performance</SectionTitle>
            <ViewAllButton>Details <FiBarChart2 /></ViewAllButton>
          </SectionHeader>
          <PerformanceCard>
            <PerformanceItem>
              <PerformanceLabel>Class 10-A</PerformanceLabel>
              <PerformanceBar>
                <PerformanceProgress $percentage={78} />
              </PerformanceBar>
              <PerformanceValue>78%</PerformanceValue>
            </PerformanceItem>
            <PerformanceItem>
              <PerformanceLabel>Class 11-B</PerformanceLabel>
              <PerformanceBar>
                <PerformanceProgress $percentage={82} />
              </PerformanceBar>
              <PerformanceValue>82%</PerformanceValue>
            </PerformanceItem>
            <PerformanceItem>
              <PerformanceLabel>Class 12-C</PerformanceLabel>
              <PerformanceBar>
                <PerformanceProgress $percentage={75} />
              </PerformanceBar>
              <PerformanceValue>75%</PerformanceValue>
            </PerformanceItem>
          </PerformanceCard>
        </GridItem>
      </DashboardGrid>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  padding: 1rem 0;
`;

const WelcomeSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const WelcomeMessage = styled.div`
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0;
    color: ${props => props.theme.colors.text.primary};
  }
  
  p {
    margin: 0.5rem 0 0;
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const TimePeriodSelector = styled.div`
  display: flex;
  background: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.25rem;
`;

interface TimePeriodButtonProps {
  $isActive: boolean;
}

const TimePeriodButton = styled.button<TimePeriodButtonProps>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${props => props.$isActive 
    ? props.theme.colors.background.primary 
    : 'transparent'
  };
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.$isActive 
    ? props.theme.colors.text.primary 
    : props.theme.colors.text.secondary
  };
  font-weight: ${props => props.$isActive ? '500' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isActive ? props.theme.shadows.sm : 'none'};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: ${props => props.theme.breakpoints.xl}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const GridItem = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

const ViewAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.primary[500]};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  
  svg {
    font-size: 1rem;
  }
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
`;

const ScheduleCard = styled.div`
  padding: 1rem 1.5rem;
`;

const ScheduleItem = styled.div`
  display: flex;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ScheduleTime = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  margin-right: 1rem;
`;

const TimeIcon = styled.div`
  color: ${props => props.theme.colors.primary[500]};
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const TimeText = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const Duration = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.tertiary};
`;

const ScheduleDetails = styled.div`
  flex: 1;
`;

const SubjectName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const ClassDetails = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const AssignmentsCard = styled.div`
  padding: 1rem 1.5rem;
`;

const AssignmentItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const AssignmentTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const AssignmentClass = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const AssignmentInfo = styled.div`
  text-align: right;
`;

const AssignmentDue = styled.div`
  color: ${props => props.theme.colors.warning[500]};
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const AssignmentSubmissions = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const GradesCard = styled.div`
  padding: 1rem 1.5rem;
`;

const GradeItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const GradeTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const GradeClass = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const GradeInfo = styled.div`
  text-align: right;
`;

const GradeScore = styled.div`
  color: ${props => props.theme.colors.success[500]};
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const GradeCompletion = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const PerformanceCard = styled.div`
  padding: 1.5rem;
`;

const PerformanceItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PerformanceLabel = styled.div`
  min-width: 80px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const PerformanceBar = styled.div`
  flex: 1;
  height: 8px;
  background-color: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.full};
  margin: 0 1rem;
  overflow: hidden;
`;

interface PerformanceProgressProps {
  $percentage: number;
}

const PerformanceProgress = styled.div<PerformanceProgressProps>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background-color: ${props => {
    if (props.$percentage >= 80) return props.theme.colors.success[500];
    if (props.$percentage >= 70) return props.theme.colors.warning[500];
    return props.theme.colors.danger[500];
  }};
  border-radius: ${props => props.theme.borderRadius.full};
`;

const PerformanceValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  min-width: 40px;
  text-align: right;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RefreshingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  
  .rotating {
    animation: rotate 1s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StudentCountHighlight = styled.div`
  margin-bottom: 2rem;
`;

const StudentCountCard = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: ${props => props.theme.shadows.sm};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StudentIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[100]};
  color: ${props => props.theme.colors.primary[600]};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StudentCountText = styled.div`
  display: flex;
  flex-direction: column;
`;

const StudentCountValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
`;

const StudentCountLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const StudentCountInfo = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.5;
  flex: 1;
  
  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }
`;

export default TeacherDashboard; 