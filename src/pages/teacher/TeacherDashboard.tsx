import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiBook, FiUsers, FiClipboard, 
  FiCalendar,  FiClock, } from 'react-icons/fi';
import StatCard from '../../components/admin/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchDashboardStats, 
  fetchTodaySchedule, 
  fetchPendingAssignments, 
  TeacherDashboardStats,
  UpcomingClass,
  PendingAssignment
} from '../../services/teacherDashboardService';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState([
    { id: 1, title: 'My Courses', value: 0, change: '+0', icon: <FiBook />, color: 'primary' },
    { id: 2, title: 'Students', value: 0, change: '+0', icon: <FiUsers />, color: 'green' },
    { id: 3, title: 'Assignments', value: 0, change: '+0', icon: <FiClipboard />, color: 'yellow' },
  ]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) return;
        
        const stats: TeacherDashboardStats = await fetchDashboardStats(user.id);
        const schedule: UpcomingClass[] = await fetchTodaySchedule(user.id);
        const assignments: PendingAssignment[] = await fetchPendingAssignments(user.id);
        
        setStudentCount(stats.studentsCount);
        
        setDashboardStats([
          { 
            id: 1, 
            title: 'My Courses', 
            value: stats.coursesCount, 
            change: '+0',
            icon: <FiBook />, 
            color: 'primary' 
          },
          { 
            id: 2, 
            title: 'Students', 
            value: stats.studentsCount, 
            change: '+0',
            icon: <FiUsers />, 
            color: 'green' 
          },
          { 
            id: 3, 
            title: 'Assignments', 
            value: stats.assignmentsCount, 
            change: '+0',
            icon: <FiClipboard />, 
            color: 'yellow' 
          },
        ]);
        
        setUpcomingClasses(schedule);
        setPendingAssignments(assignments);
        
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
              importantTextColor=""
              isLoading={isLoading && stat.id === 2}
            />
          </motion.div>
        ))}
      </StatsGrid>

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
            <ViewAllButton>View All <FiCalendar /></ViewAllButton>
          </SectionHeader>
          <ScheduleCard>
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((classItem) => (
                <ScheduleItem key={classItem.id}>
                  <ScheduleTime>
                    <TimeIcon><FiClock /></TimeIcon>
                    <TimeText>{classItem.time}</TimeText>
                    <Duration>{classItem.duration}</Duration>
                  </ScheduleTime>
                  <ScheduleDetails>
                    <SubjectName>{classItem.subject}</SubjectName>
                    <ClassDetails>
                      Class {classItem.className} • {classItem.room}
                    </ClassDetails>
                  </ScheduleDetails>
                </ScheduleItem>
              ))
            ) : (
              <NoDataMessage>
                {isLoading ? 'Loading schedule...' : 'No classes scheduled for today'}
              </NoDataMessage>
            )}
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
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map((assignment) => (
                <AssignmentItem key={assignment.id}>
                  <div>
                    <AssignmentTitle>{assignment.title}</AssignmentTitle>
                    <AssignmentClass>Class {assignment.className}</AssignmentClass>
                  </div>
                  <AssignmentInfo>
                    <AssignmentDue>Due: {assignment.dueDate}</AssignmentDue>
                    <AssignmentSubmissions>Submissions: {assignment.submissions}</AssignmentSubmissions>
                  </AssignmentInfo>
                </AssignmentItem>
              ))
            ) : (
              <NoDataMessage>
                {isLoading ? 'Loading assignments...' : 'No pending assignments'}
              </NoDataMessage>
            )}
          </AssignmentsCard>
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
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

const NoDataMessage = styled.div`
  padding: 30px 20px;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

export default TeacherDashboard; 