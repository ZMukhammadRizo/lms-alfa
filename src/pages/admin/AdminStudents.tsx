import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, Button, Input, Dropdown, Checkbox, Pagination, Loader, Badge } from '../../components/ui';
import { AdminInput, EnhancedCheckbox, AdminDropdown } from '../../components/admin/StyledFormControls';
import { useThemeContext } from '../../App';
import { FaAngleLeft, FaAngleRight, FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import supabase from "../../config/supabaseClient";

// Mock student data
const mockStudents = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    enrolledCourses: 3,
    completedCourses: 1,
    lastActive: '2023-05-15T10:30:00',
    status: 'Active',
    location: 'New York, USA',
    joinDate: '2023-01-10T08:15:00',
  },
  {
    id: 2,
    name: 'Samantha Williams',
    email: 'sam.williams@example.com',
    enrolledCourses: 5,
    completedCourses: 4,
    lastActive: '2023-05-14T16:45:00',
    status: 'Active',
    location: 'London, UK',
    joinDate: '2022-11-23T14:20:00',
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    enrolledCourses: 2,
    completedCourses: 0,
    lastActive: '2023-05-10T09:15:00',
    status: 'Active',
    location: 'Toronto, Canada',
    joinDate: '2023-02-05T11:30:00',
  },
  {
    id: 4,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    enrolledCourses: 1,
    completedCourses: 0,
    lastActive: '2023-04-28T13:20:00',
    status: 'Inactive',
    location: 'Barcelona, Spain',
    joinDate: '2023-03-15T10:10:00',
  },
  {
    id: 5,
    name: 'David Kim',
    email: 'david.kim@example.com',
    enrolledCourses: 4,
    completedCourses: 2,
    lastActive: '2023-05-15T08:50:00',
    status: 'Active',
    location: 'Seoul, South Korea',
    joinDate: '2022-10-18T09:45:00',
  },
  {
    id: 6,
    name: 'Sarah Patel',
    email: 'sarah.patel@example.com',
    enrolledCourses: 6,
    completedCourses: 5,
    lastActive: '2023-05-12T15:30:00',
    status: 'Active',
    location: 'Mumbai, India',
    joinDate: '2022-09-30T12:15:00',
  },
  {
    id: 7,
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    enrolledCourses: 0,
    completedCourses: 0,
    lastActive: '2023-03-10T11:20:00',
    status: 'Dormant',
    location: 'Sydney, Australia',
    joinDate: '2023-02-28T08:30:00',
  },
  {
    id: 8,
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    enrolledCourses: 2,
    completedCourses: 1,
    lastActive: '2023-05-08T14:40:00',
    status: 'Active',
    location: 'Mexico City, Mexico',
    joinDate: '2023-01-15T10:55:00',
  },
];

const AdminStudents: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<typeof mockStudents>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;
  const { isDarkMode } = useThemeContext();

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudents(mockStudents);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter students based on search term and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchTerm === '' ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === null || student.status === statusFilter;
    const matchesLocation =
      locationFilter === null || student.location.includes(locationFilter);

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedStudents.length === currentStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(currentStudents.map((student) => student.id));
    }
  };

  const handleSelectStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
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
      case 'Active':
        return '#10b981';
      case 'Inactive':
        return '#f59e0b';
      case 'Dormant':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Get unique locations for filter dropdown
  const uniqueLocations = Array.from(new Set(students.map((student) => {
    const [city, country] = student.location.split(', ');
    return country;
  })));

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
          <h1>Student Management</h1>
          <HeaderActions>
            <Button variant="primary" size="md">
              <i className="fas fa-plus"></i> Add New Student
            </Button>
          </HeaderActions>
        </Header>

        <FilterSection>
          <SearchContainer>
            <AdminInput
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<i className="fas fa-search"></i>}
            />
          </SearchContainer>
          <FiltersContainer>
            <AdminDropdown
              label="Status"
              value={statusFilter || 'All Statuses'}
              onChange={(value) => setStatusFilter(value === 'All Statuses' ? null : value)}
              options={['All Statuses', 'Active', 'Inactive', 'Dormant']}
            />
            <AdminDropdown
              label="Location"
              value={locationFilter || 'All Locations'}
              onChange={(value) => setLocationFilter(value === 'All Locations' ? null : value)}
              options={['All Locations', ...uniqueLocations]}
            />
          </FiltersContainer>
        </FilterSection>

        <ActionsBar>
          <div>
            {selectedStudents.length > 0 && (
              <>
                <span>{selectedStudents.length} students selected</span>
                <Button variant="outline" size="sm">
                  <i className="fas fa-envelope"></i> Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-graduation-cap"></i> Enroll in Course
                </Button>
                <Button variant="danger" size="sm">
                  <i className="fas fa-user-minus"></i> Suspend
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
                    checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                    onChange={handleSelectAll}
                  />
                </TH>
                <TH>Student</TH>
                <TH>Enrolled Courses</TH>
                <TH>Progress</TH>
                <TH>Last Active</TH>
                <TH>Status</TH>
                <TH>Location</TH>
                <TH>Join Date</TH>
                <TH width="80px">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {currentStudents.length > 0 ? (
                currentStudents.map((student) => (
                  <TR key={student.id}>
                    <TD>
                      <EnhancedCheckbox
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                      />
                    </TD>
                    <TD>
                      <StudentInfo>
                        <StudentName>{student.name}</StudentName>
                        <StudentEmail>{student.email}</StudentEmail>
                      </StudentInfo>
                    </TD>
                    <TD>{student.enrolledCourses}</TD>
                    <TD>
                      <ProgressDisplay>
                        <ProgressBar>
                          <ProgressFill 
                            $percentage={
                              student.enrolledCourses > 0
                                ? (student.completedCourses / student.enrolledCourses) * 100
                                : 0
                            }
                          />
                        </ProgressBar>
                        <ProgressText>
                          {student.enrolledCourses > 0
                            ? `${Math.round((student.completedCourses / student.enrolledCourses) * 100)}%`
                            : '0%'}
                        </ProgressText>
                      </ProgressDisplay>
                    </TD>
                    <TD>{formatDate(student.lastActive)}</TD>
                    <TD>
                      <StatusBadge status={student.status}>
                        {student.status}
                      </StatusBadge>
                    </TD>
                    <TD>{student.location}</TD>
                    <TD>{formatDate(student.joinDate)}</TD>
                    <TD>
                      <ActionButtons>
                        <ActionButton aria-label="View student details">
                          <i className="fas fa-eye"></i>
                        </ActionButton>
                        <ActionButton aria-label="Edit student">
                          <i className="fas fa-edit"></i>
                        </ActionButton>
                      </ActionButtons>
                    </TD>
                  </TR>
                ))
              ) : (
                <TR>
                  <EmptyTD colSpan={9}>
                    <EmptyState>
                      <i className="fas fa-user-graduate"></i>
                      <p>No students found matching your criteria</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter(null);
                          setLocationFilter(null);
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

        {filteredStudents.length > 0 && (
          <PaginationContainer>
            <div>
              Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
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
  padding: 15px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  border-bottom: 1px solid ${({ theme }) => 
    theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
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
  padding: 50px 20px;
  text-align: center;
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    color: ${({ theme }) => 
      theme.isDark ? theme.colors.primary : theme.colors.textSecondary};
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.colors.text};
  }
  
  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
    max-width: 400px;
  }
`;

const StudentInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StudentName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const StudentEmail = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ProgressDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.div`
  height: 8px;
  width: 100px;
  background-color: ${({ theme }) => 
    theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${({ $percentage }) => `${$percentage}%`};
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
`;

const ProgressText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 36px;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ status, theme }) => {
    if (status === 'active') return theme.isDark ? 'rgba(46, 213, 115, 0.2)' : 'rgba(46, 213, 115, 0.1)';
    if (status === 'inactive') return theme.isDark ? 'rgba(223, 71, 89, 0.2)' : 'rgba(223, 71, 89, 0.1)';
    return theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  }};
  color: ${({ status, theme }) => {
    if (status === 'active') return '#2ed573';
    if (status === 'inactive') return '#df4759';
    return theme.colors.textSecondary;
  }};
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
    color: ${({ theme }) => theme.isDark ? theme.colors.primary : theme.colors.text};
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

export default AdminStudents; 