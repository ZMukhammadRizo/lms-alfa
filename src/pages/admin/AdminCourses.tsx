import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, Button, Input, Dropdown, Checkbox, Pagination, Loader, Badge } from '../../components/ui';
import { AdminInput, EnhancedCheckbox, AdminDropdown } from '../../components/admin/StyledFormControls';
import { useThemeContext } from '../../App';
import { FaAngleLeft, FaAngleRight, FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import supabase from "../../config/supabaseClient";

// Mock course data
const mockCourses = [
  {
    id: 1,
    title: 'Introduction to Programming',
    category: 'Computer Science',
    instructor: 'John Doe',
    students: 156,
    status: 'Published',
    rating: 4.7,
    lastUpdated: '2023-05-01T14:30:00',
  },
  {
    id: 2,
    title: 'Advanced Web Development',
    category: 'Web Development',
    instructor: 'Jane Smith',
    students: 89,
    status: 'Published',
    rating: 4.5,
    lastUpdated: '2023-04-15T09:45:00',
  },
  {
    id: 3,
    title: 'UX Design Fundamentals',
    category: 'Design',
    instructor: 'Michael Johnson',
    students: 204,
    status: 'Published',
    rating: 4.8,
    lastUpdated: '2023-05-10T11:20:00',
  },
  {
    id: 4,
    title: 'Data Science Bootcamp',
    category: 'Data Science',
    instructor: 'Emily Williams',
    students: 118,
    status: 'Draft',
    rating: 0,
    lastUpdated: '2023-05-12T16:15:00',
  },
  {
    id: 5,
    title: 'Mobile App Development with React Native',
    category: 'Mobile Development',
    instructor: 'Robert Brown',
    students: 73,
    status: 'Published',
    rating: 4.3,
    lastUpdated: '2023-03-22T10:30:00',
  },
  {
    id: 6,
    title: 'Python for Data Analysis',
    category: 'Data Science',
    instructor: 'Sarah Davis',
    students: 142,
    status: 'Published',
    rating: 4.6,
    lastUpdated: '2023-04-28T13:45:00',
  },
  {
    id: 7,
    title: 'Graphic Design Masterclass',
    category: 'Design',
    instructor: 'James Wilson',
    students: 0,
    status: 'Unpublished',
    rating: 0,
    lastUpdated: '2023-05-08T15:20:00',
  },
  {
    id: 8,
    title: 'Machine Learning Fundamentals',
    category: 'Data Science',
    instructor: 'Linda Miller',
    students: 95,
    status: 'Published',
    rating: 4.4,
    lastUpdated: '2023-04-05T09:10:00',
  },
];

const AdminCourses: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<typeof mockCourses>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 5;
  const { isDarkMode } = useThemeContext();

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(mockCourses);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter courses based on search term and filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchTerm === '' ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === null || course.category === categoryFilter;
    const matchesStatus = statusFilter === null || course.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedCourses.length === currentCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(currentCourses.map((course) => course.id));
    }
  };

  const handleSelectCourse = (courseId: number) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return '#10b981';
      case 'Draft':
        return '#f59e0b';
      case 'Unpublished':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

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
      <PageContainer>
        <Header>
          <h1>Course Management</h1>
          <HeaderActions>
            <Button variant="primary" size="md">
              <i className="fas fa-plus"></i> Add New Course
            </Button>
          </HeaderActions>
        </Header>

        <FilterSection>
          <SearchContainer>
            <AdminInput
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<i className="fas fa-search"></i>}
            />
          </SearchContainer>
          <FiltersContainer>
            <AdminDropdown
              label="Category"
              value={categoryFilter || 'All Categories'}
              onChange={(value) => setCategoryFilter(value === 'All Categories' ? null : value)}
              options={[
                'All Categories',
                'Computer Science',
                'Web Development',
                'Design',
                'Data Science',
                'Mobile Development',
              ]}
            />
            <AdminDropdown
              label="Status"
              value={statusFilter || 'All Statuses'}
              onChange={(value) => setStatusFilter(value === 'All Statuses' ? null : value)}
              options={['All Statuses', 'Published', 'Unpublished', 'Draft']}
            />
          </FiltersContainer>
        </FilterSection>

        <ActionsBar>
          <div>
            {selectedCourses.length > 0 && (
              <>
                <span>{selectedCourses.length} courses selected</span>
                <Button variant="outline" size="sm">
                  <i className="fas fa-clone"></i> Duplicate
                </Button>
                <Button variant="danger" size="sm">
                  <i className="fas fa-trash-alt"></i> Delete
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" size="sm">
            <i className="fas fa-download"></i> Export
          </Button>
        </ActionsBar>

        <TableCard>
          <Table>
            <THead>
              <TR>
                <TH width="40px">
                  <EnhancedCheckbox
                    checked={selectedCourses.length === currentCourses.length && currentCourses.length > 0}
                    onChange={handleSelectAll}
                  />
                </TH>
                <TH>Course</TH>
                <TH>Category</TH>
                <TH>Instructor</TH>
                <TH>Students</TH>
                <TH>Status</TH>
                <TH>Rating</TH>
                <TH>Last Updated</TH>
                <TH width="80px">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {currentCourses.length > 0 ? (
                currentCourses.map((course) => (
                  <TR key={course.id}>
                    <TD>
                      <EnhancedCheckbox
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => handleSelectCourse(course.id)}
                      />
                    </TD>
                    <TD>
                      <CourseInfo>
                        <CourseTitle>{course.title}</CourseTitle>
                      </CourseInfo>
                    </TD>
                    <TD>
                      <CategoryBadge>{course.category}</CategoryBadge>
                    </TD>
                    <TD>{course.instructor}</TD>
                    <TD>{course.students}</TD>
                    <TD>
                      <StatusBadge $color={getStatusColor(course.status)}>
                        {course.status}
                      </StatusBadge>
                    </TD>
                    <TD>
                      <RatingDisplay>
                        {course.rating > 0 ? (
                          <>
                            <i className="fas fa-star"></i>
                            <span>{course.rating.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="no-rating">Not rated</span>
                        )}
                      </RatingDisplay>
                    </TD>
                    <TD>{formatDate(course.lastUpdated)}</TD>
                    <TD>
                      <ActionButtons>
                        <ActionButton aria-label="Edit course">
                          <i className="fas fa-edit"></i>
                        </ActionButton>
                        <ActionButton aria-label="Delete course">
                          <i className="fas fa-trash-alt"></i>
                        </ActionButton>
                      </ActionButtons>
                    </TD>
                  </TR>
                ))
              ) : (
                <TR>
                  <EmptyTD colSpan={9}>
                    <EmptyState>
                      <i className="fas fa-book"></i>
                      <p>No courses found matching your criteria</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter(null);
                          setStatusFilter(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    </EmptyState>
                  </EmptyTD>
                </TR>
              )}
            </TBody>
          </Table>
        </TableCard>

        {filteredCourses.length > 0 && (
          <PaginationContainer>
            <div>
              Showing {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} of{' '}
              {filteredCourses.length} courses
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </PaginationContainer>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

// Styled components
const PageContainer = styled.div`
  padding: 20px;
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

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 12px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  div {
    display: flex;
    align-items: center;
    gap: 12px;
    
    span {
      color: ${({ theme }) => theme.colors.textSecondary};
      margin-right: 8px;
    }
  }
`;

const TableCard = styled(Card)`
  overflow: auto;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
`;

const THead = styled.thead`
  background-color: ${({ theme }) => theme.colors.cardSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TBody = styled.tbody`
  & > tr:nth-child(even) {
    background-color: ${({ theme }) => 
      theme.isDark 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(0, 0, 0, 0.02)'
    };
  }
`;

const TR = styled.tr`
  &:hover {
    background-color: ${({ theme }) => 
      theme.isDark 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.04)'
    } !important;
  }
`;

const TH = styled.th<{ width?: string }>`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  width: ${({ width }) => width || 'auto'};
  white-space: nowrap;
`;

const TD = styled.td`
  padding: 16px;
  font-size: 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyTD = styled.td`
  padding: 48px 16px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: ${({ theme }) => theme.colors.textTertiary};
  
  i {
    font-size: 36px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 16px;
  }
`;

const CourseInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const CourseTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ theme }) => 
    theme.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'};
  color: ${({ theme }) => theme.colors.primary};
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ $color }) => $color + '20'};
  color: ${({ $color }) => $color};
`;

const RatingDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    color: #f59e0b;
  }
  
  .no-rating {
    color: ${({ theme }) => theme.colors.textTertiary};
    font-style: italic;
    font-size: 12px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.cardSecondary};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

export default AdminCourses; 