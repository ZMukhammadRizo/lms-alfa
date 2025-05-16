import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiUserCheck } from 'react-icons/fi';

// Mock data
const GROUPS_BY_SUBJECT = {
  ielts: [
    { id: 'ielts-group-1', name: 'IELTS Group 1', studentsCount: 3, activeStudents: 2 },
    { id: 'ielts-group-2', name: 'IELTS Group 2', studentsCount: 2, activeStudents: 1 },
    { id: 'ielts-group-3', name: 'IELTS Group 3', studentsCount: 3, activeStudents: 3 },
  ],
  sat: [
    { id: 'sat-group-1', name: 'SAT Group 1', studentsCount: 3, activeStudents: 2 },
    { id: 'sat-group-2', name: 'SAT Group 2', studentsCount: 2, activeStudents: 2 },
  ],
  it: [
    { id: 'it-group-1', name: 'IT Group 1', studentsCount: 3, activeStudents: 2 },
    { id: 'it-group-2', name: 'IT Group 2', studentsCount: 2, activeStudents: 2 },
    { id: 'it-group-3', name: 'IT Group 3', studentsCount: 2, activeStudents: 1 },
    { id: 'it-group-4', name: 'IT Group 4', studentsCount: 3, activeStudents: 3 },
  ],
};

const SUBJECT_INFO = {
  ielts: { name: 'IELTS', color: '#4299E1' },
  sat: { name: 'SAT', color: '#805AD5' },
  it: { name: 'IT', color: '#38B2AC' },
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

const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

interface GroupCardProps {
  accentColor: string;
}

const GroupCard = styled.div<GroupCardProps>`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 8px;
    height: 100%;
    background-color: ${props => props.accentColor};
  }
`;

const GroupName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.theme.colors?.text || '#1A202C'};
`;

const GroupStats = styled.div`
  display: flex;
  align-items: center;
  margin-top: 16px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
  color: ${props => props.theme.colors?.text?.secondary || '#718096'};
  font-size: 0.875rem;
  
  svg {
    margin-right: 6px;
  }
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

const SubjectGroups: React.FC = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  const [groups, setGroups] = useState<any[]>([]);
  const [subjectInfo, setSubjectInfo] = useState<{ name: string; color: string }>({ name: '', color: '' });
  
  useEffect(() => {
    if (subjectId && GROUPS_BY_SUBJECT[subjectId as keyof typeof GROUPS_BY_SUBJECT]) {
      setGroups(GROUPS_BY_SUBJECT[subjectId as keyof typeof GROUPS_BY_SUBJECT]);
      setSubjectInfo(SUBJECT_INFO[subjectId as keyof typeof SUBJECT_INFO]);
    }
  }, [subjectId]);
  
  const handleBack = () => {
    navigate('/admin/morning-classes');
  };
  
  const handleGroupClick = (groupId: string) => {
    navigate(`/admin/morning-classes/${subjectId}/groups/${groupId}`);
  };
  
  return (
    <PageContainer>
      <BackButton onClick={handleBack}>
        <FiArrowLeft size={16} />
        Back to Subjects
      </BackButton>
      
      <PageHeader>
        <div>
          <PageTitle>{subjectInfo.name} Groups</PageTitle>
          <PageDescription>Select a group to view students</PageDescription>
        </div>
      </PageHeader>
      
      {groups.length > 0 ? (
        <GroupsGrid>
          {groups.map(group => (
            <GroupCard 
              key={group.id} 
              accentColor={subjectInfo.color}
              onClick={() => handleGroupClick(group.id)}
            >
              <GroupName>{group.name}</GroupName>
              <GroupStats>
                <StatItem>
                  <FiUsers size={16} />
                  {group.studentsCount} Students
                </StatItem>
                <StatItem>
                  <FiUserCheck size={16} />
                  {group.activeStudents} Active
                </StatItem>
              </GroupStats>
            </GroupCard>
          ))}
        </GroupsGrid>
      ) : (
        <EmptyState>
          <EmptyStateText>No groups found for this subject.</EmptyStateText>
        </EmptyState>
      )}
    </PageContainer>
  );
};

export default SubjectGroups; 