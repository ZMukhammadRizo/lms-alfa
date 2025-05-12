import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';

// Mock data
const STUDENTS_BY_GROUP = {
  'ielts-group-1': [
    { id: 1, fullName: 'John Smith', email: 'john.smith@example.com', status: 'Active' },
    { id: 2, fullName: 'Emily Johnson', email: 'emily.j@example.com', status: 'Active' },
    { id: 3, fullName: 'Michael Brown', email: 'michael.b@example.com', status: 'Inactive' },
  ],
  'ielts-group-2': [
    { id: 4, fullName: 'Sarah Williams', email: 'sarah.w@example.com', status: 'Active' },
    { id: 5, fullName: 'Daniel Jones', email: 'daniel.j@example.com', status: 'Inactive' },
  ],
  'ielts-group-3': [
    { id: 6, fullName: 'Jessica Miller', email: 'jessica.m@example.com', status: 'Active' },
    { id: 7, fullName: 'James Davis', email: 'james.d@example.com', status: 'Active' },
    { id: 8, fullName: 'Emma Wilson', email: 'emma.w@example.com', status: 'Active' },
  ],
  'sat-group-1': [
    { id: 9, fullName: 'David Taylor', email: 'david.t@example.com', status: 'Active' },
    { id: 10, fullName: 'Olivia Anderson', email: 'olivia.a@example.com', status: 'Active' },
    { id: 11, fullName: 'William Thomas', email: 'william.t@example.com', status: 'Inactive' },
  ],
  'sat-group-2': [
    { id: 12, fullName: 'Sophia Jackson', email: 'sophia.j@example.com', status: 'Active' },
    { id: 13, fullName: 'Benjamin White', email: 'benjamin.w@example.com', status: 'Active' },
  ],
  'it-group-1': [
    { id: 14, fullName: 'Isabella Harris', email: 'isabella.h@example.com', status: 'Active' },
    { id: 15, fullName: 'Mason Martin', email: 'mason.m@example.com', status: 'Inactive' },
    { id: 16, fullName: 'Ava Thompson', email: 'ava.t@example.com', status: 'Active' },
  ],
  'it-group-2': [
    { id: 17, fullName: 'Lucas Garcia', email: 'lucas.g@example.com', status: 'Active' },
    { id: 18, fullName: 'Mia Robinson', email: 'mia.r@example.com', status: 'Active' },
  ],
  'it-group-3': [
    { id: 19, fullName: 'Ethan Lewis', email: 'ethan.l@example.com', status: 'Active' },
    { id: 20, fullName: 'Amelia Walker', email: 'amelia.w@example.com', status: 'Inactive' },
  ],
  'it-group-4': [
    { id: 21, fullName: 'Alexander Hall', email: 'alexander.h@example.com', status: 'Active' },
    { id: 22, fullName: 'Charlotte Young', email: 'charlotte.y@example.com', status: 'Active' },
    { id: 23, fullName: 'Logan Allen', email: 'logan.a@example.com', status: 'Active' },
  ],
};

const GROUP_INFO = {
  'ielts-group-1': { name: 'IELTS Group 1', subject: 'IELTS', color: '#4299E1' },
  'ielts-group-2': { name: 'IELTS Group 2', subject: 'IELTS', color: '#4299E1' },
  'ielts-group-3': { name: 'IELTS Group 3', subject: 'IELTS', color: '#4299E1' },
  'sat-group-1': { name: 'SAT Group 1', subject: 'SAT', color: '#805AD5' },
  'sat-group-2': { name: 'SAT Group 2', subject: 'SAT', color: '#805AD5' },
  'it-group-1': { name: 'IT Group 1', subject: 'IT', color: '#38B2AC' },
  'it-group-2': { name: 'IT Group 2', subject: 'IT', color: '#38B2AC' },
  'it-group-3': { name: 'IT Group 3', subject: 'IT', color: '#38B2AC' },
  'it-group-4': { name: 'IT Group 4', subject: 'IT', color: '#38B2AC' },
};

// Styled Components
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${props => props.theme.colors?.primary?.[500] || '#3182CE'};
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0;
  margin-bottom: 16px;
  cursor: pointer;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    color: ${props => props.theme.colors?.primary?.[600] || '#2B6CB0'};
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PageTitleArea = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors?.text || '#1A202C'};
`;

const PageDescription = styled.p`
  color: ${props => props.theme.colors?.text?.secondary || '#718096'};
  margin-top: 8px;
  font-size: 1rem;
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 320px;
  width: 100%;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors?.border?.light || '#E2E8F0'};
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors?.primary?.[500] || '#3182CE'};
    box-shadow: 0 0 0 2px ${props => `${props.theme.colors?.primary?.[500] || '#3182CE'}33`};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors?.text?.tertiary || '#A0AEC0'};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors?.text?.tertiary || '#A0AEC0'};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.thead`
  background-color: ${props => props.theme.colors?.background?.secondary || '#F7FAFC'};
  
  th {
    padding: 16px;
    text-align: left;
    font-weight: 500;
    color: ${props => props.theme.colors?.text || '#1A202C'};
    border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#E2E8F0'};
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${props => props.theme.colors?.border?.light || '#E2E8F0'};
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: ${props => props.theme.colors?.background?.tertiary || '#EDF2F7'};
    }
  }
  
  td {
    padding: 16px;
    color: ${props => props.theme.colors?.text || '#1A202C'};
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 10px;
  font-size: 0.75rem;
  border-radius: 50px;
  background-color: ${props => props.status === 'Active' ? 
    `${props.theme.colors?.success?.[500] || '#38A169'}20` : 
    `${props.theme.colors?.danger?.[500] || '#E53E3E'}20`};
  color: ${props => props.status === 'Active' ? 
    props.theme.colors?.success?.[500] || '#38A169' : 
    props.theme.colors?.danger?.[500] || '#E53E3E'};
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const EmptyStateText = styled.p`
  color: ${props => props.theme.colors?.text?.secondary || '#718096'};
  font-size: 1rem;
  margin-top: 16px;
`;

const GroupStudents: React.FC = () => {
  const navigate = useNavigate();
  const { subjectId, groupId } = useParams<{ subjectId: string; groupId: string }>();
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<{ name: string; subject: string; color: string }>({ name: '', subject: '', color: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (groupId && STUDENTS_BY_GROUP[groupId as keyof typeof STUDENTS_BY_GROUP]) {
      const groupStudents = STUDENTS_BY_GROUP[groupId as keyof typeof STUDENTS_BY_GROUP];
      setStudents(groupStudents);
      setFilteredStudents(groupStudents);
      
      if (GROUP_INFO[groupId as keyof typeof GROUP_INFO]) {
        setGroupInfo(GROUP_INFO[groupId as keyof typeof GROUP_INFO]);
      }
    }
  }, [groupId]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);
  
  const handleBack = () => {
    navigate(`/admin/morning-classes/${subjectId}`);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <PageContainer>
      <BackButton onClick={handleBack}>
        <FiArrowLeft size={16} />
        Back to Groups
      </BackButton>
      
      <PageHeader>
        <PageTitleArea>
          <PageTitle>{groupInfo.name}</PageTitle>
          <PageDescription>{groupInfo.subject} - Students</PageDescription>
        </PageTitleArea>
        
        <SearchContainer>
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={handleSearch}
          />
        </SearchContainer>
      </PageHeader>
      
      {filteredStudents.length > 0 ? (
        <Table>
          <TableHeader>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredStudents.map(student => (
              <tr key={student.id}>
                <td>{student.fullName}</td>
                <td>{student.email}</td>
                <td>
                  <StatusBadge status={student.status}>
                    {student.status}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState>
          <EmptyStateText>No students found in this group.</EmptyStateText>
        </EmptyState>
      )}
    </PageContainer>
  );
};

export default GroupStudents; 