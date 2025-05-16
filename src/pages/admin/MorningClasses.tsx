import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiBook, FiCode } from 'react-icons/fi';

// Subject data
const SUBJECTS = [
  { id: 'ielts', name: 'IELTS', icon: <FiBook size={24} />, color: '#4299E1' },
  { id: 'sat', name: 'SAT', icon: <FiBook size={24} />, color: '#805AD5' },
  { id: 'it', name: 'IT', icon: <FiCode size={24} />, color: '#38B2AC' },
];

// Styled Components
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
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

const SubjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

interface SubjectCardProps {
  bgColor: string;
}

const SubjectCard = styled.div<SubjectCardProps>`
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
    background-color: ${props => props.bgColor};
  }
`;

const SubjectIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background-color: ${props => props.theme.colors?.background?.secondary || '#F7FAFC'};
  color: ${props => props.theme.colors?.primary?.[500] || '#3182CE'};
`;

const SubjectName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.colors?.text || '#1A202C'};
`;

const SubjectStats = styled.div`
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

const MorningClasses: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSubjectClick = (subjectId: string) => {
    navigate(`/admin/morning-classes/${subjectId}`);
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Morning Classes</PageTitle>
          <PageDescription>Select a subject to view available groups</PageDescription>
        </div>
      </PageHeader>
      
      <SubjectsGrid>
        {SUBJECTS.map(subject => (
          <SubjectCard 
            key={subject.id} 
            bgColor={subject.color}
            onClick={() => handleSubjectClick(subject.id)}
          >
            <SubjectIcon>{subject.icon}</SubjectIcon>
            <SubjectName>{subject.name}</SubjectName>
            <SubjectStats>
              <StatItem>
                <FiUsers size={16} />
                {subject.id === 'ielts' ? '3 Groups' : subject.id === 'sat' ? '2 Groups' : '4 Groups'}
              </StatItem>
            </SubjectStats>
          </SubjectCard>
        ))}
      </SubjectsGrid>
    </PageContainer>
  );
};

export default MorningClasses; 