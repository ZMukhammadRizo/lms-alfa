import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, Button,  Loader } from '../../components/ui';
import { useThemeContext } from '../../App';

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useThemeContext();

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Mock data for charts
  const enrollmentData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Students',
        data: [65, 78, 90, 110, 102, 120, 135, 150, 148, 160, 175, 190],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Course Enrollments',
        data: [120, 135, 160, 180, 190, 210, 240, 255, 270, 285, 300, 320],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
    ],
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 42000],
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const courseDistributionData = {
    labels: ['Technology', 'Business', 'Health', 'Arts', 'Science', 'Language', 'Other'],
    datasets: [
      {
        data: [35, 20, 15, 10, 10, 5, 5],
        backgroundColor: [
          '#3b82f6', // blue
          '#10b981', // green
          '#f59e0b', // yellow
          '#ef4444', // red
          '#8b5cf6', // purple
          '#ec4899', // pink
          '#6b7280', // gray
        ],
      },
    ],
  };

  // Mock statistics

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'new_course',
      title: 'Advanced JavaScript Programming',
      user: 'John Smith',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'enrollment',
      title: 'User Experience Design',
      user: 'Emma Johnson',
      time: '3 hours ago',
    },
    {
      id: 3,
      type: 'completion',
      title: 'Digital Marketing Fundamentals',
      user: 'Michael Wang',
      time: '5 hours ago',
    },
    {
      id: 4,
      type: 'review',
      title: 'Introduction to Machine Learning',
      user: 'Sarah Miller',
      time: '8 hours ago',
    },
    {
      id: 5,
      type: 'new_course',
      title: 'Mobile App Development with React Native',
      user: 'David Thompson',
      time: '12 hours ago',
    },
  ];

  // Mock top courses
  const topCourses = [
    {
      id: 1,
      title: 'Complete Web Development Bootcamp',
      students: 2845,
      rating: 4.8,
      instructor: 'Jessica Parker',
      category: 'Technology',
    },
    {
      id: 2,
      title: 'Financial Management for Beginners',
      students: 2156,
      rating: 4.7,
      instructor: 'Robert Johnson',
      category: 'Business',
    },
    {
      id: 3,
      title: 'Modern UI/UX Design Principles',
      students: 1987,
      rating: 4.9,
      instructor: 'Amanda Chen',
      category: 'Technology',
    },
    {
      id: 4,
      title: 'Introduction to Data Science',
      students: 1850,
      rating: 4.6,
      instructor: 'Daniel Wilson',
      category: 'Science',
    },
    {
      id: 5,
      title: 'Digital Marketing Mastery',
      students: 1742,
      rating: 4.7,
      instructor: 'Emily Rodriguez',
      category: 'Business',
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <LoaderContainer>
          <Loader size={50} />
        </LoaderContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <DashboardContainer>
        <Header>
          <h1>Dashboard</h1>
          <HeaderActions>
            <Button variant="outline" size="sm">
              <i className="fas fa-download"></i> Export Report
            </Button>
            <Button variant="primary" size="sm">
              <i className="fas fa-sync-alt"></i> Refresh Data
            </Button>
          </HeaderActions>
        </Header>
        <StatisticsGrid>
          {[
            { title: 'Total Students', value: '24,521', change: '12%', isPositive: true, color: '#4CAF50', icon: 'user-graduate' },
            { title: 'Active Courses', value: '842', change: '7%', isPositive: true, color: '#2196F3', icon: 'book-open' },
            { title: 'Revenue', value: '$253,890', change: '5%', isPositive: true, color: '#FF9800', icon: 'dollar-sign' },
            { title: 'Completion Rate', value: '78%', change: '3%', isPositive: false, color: '#F44336', icon: 'chart-line' }
          ].map((stat, index) => (
            <StatCard key={index}>
              <StatIconContainer $color={stat.color}>
                <i className={`fas fa-${stat.icon}`}></i>
              </StatIconContainer>
              <StatContent>
                <StatTitle>{stat.title}</StatTitle>
                <StatValue>{stat.value}</StatValue>
                <StatChange $isPositive={stat.isPositive}>
                  <i className={`fas fa-arrow-${stat.isPositive ? 'up' : 'down'}`}></i> {stat.change}
                </StatChange>
              </StatContent>
            </StatCard>
          ))}
        </StatisticsGrid>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <ActivityList>
            {recentActivities.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIcon $type={activity.type}>
                  <i className={getActivityIcon(activity.type)}></i>
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityMeta>
                    <span>{activity.user}</span>
                    <ActivityTime>{activity.time}</ActivityTime>
                  </ActivityMeta>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Students</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <CourseInfo>
                        <CourseTitle>{course.title}</CourseTitle>
                        <CourseSubtitle>
                          <span>{course.instructor}</span>
                          <CategoryBadge>{course.category}</CategoryBadge>
                        </CourseSubtitle>
                      </CourseInfo>
                    </td>
                    <td>{course.students.toLocaleString()}</td>
                    <td>
                      <RatingContainer>
                        <i className="fas fa-star"></i>
                        <span>{course.rating}</span>
                      </RatingContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </Card>
      </BottomGrid>
    </DashboardContainer>
  </AdminLayout>
);
};

// Helper function for activity icons
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'new_course':
      return 'fas fa-plus-circle';
    case 'enrollment':
      return 'fas fa-user-plus';
    case 'completion':
      return 'fas fa-certificate';
    case 'review':
      return 'fas fa-star';
    default:
      return 'fas fa-bell';
  }
};

// Styled components
const DashboardContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h1 {
    margin: 0;
    font-size: 28px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(Card)`
  display: flex;
  padding: 20px;
  height: 120px;
`;

const StatIconContainer = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: ${({ $color }) => $color + '15'};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 20px;
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StatTitle = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const StatChange = styled.div<{ $isPositive: boolean }>`
  font-size: 12px;
  color: ${({ $isPositive }) => ($isPositive ? '#10b981' : '#ef4444')};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </div>
    </CardHeader>
    {children}
  </Card>
);

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const CardSubtitle = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 4px;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActivityItem = styled.div`
  display: flex;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div<{ $type: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-size: 14px;
  
  ${({ $type }) => {
    switch ($type) {
      case 'new_course':
        return `
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        `;
      case 'enrollment':
        return `
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
        `;
      case 'completion':
        return `
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        `;
      case 'review':
        return `
          background-color: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        `;
      default:
        return `
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        `;
    }
  }}
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const ActivityMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ActivityTime = styled.span`
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    padding: 12px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  td {
    padding: 14px 20px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  tr:last-child td {
    border-bottom: none;
  }
`;

const CourseInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const CourseTitle = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const CourseSubtitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CategoryBadge = styled.span`
  background-color: ${({ theme }) => 
    theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text};
  
  i {
    color: #f59e0b;
  }
`;

export default AdminDashboard; 