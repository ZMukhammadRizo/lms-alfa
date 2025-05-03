import React, { useState } from 'react';
import styled from 'styled-components';
import { SubjectData } from '../../pages/teacher/TeacherJournalPage';

interface SubjectSelectorProps {
  subjects: SubjectData[];
  className: string;
  onSubjectSelect: (subjectData: SubjectData) => void;
  onBackClick: () => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  className,
  onSubjectSelect,
  onBackClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Container>
      <Header>
        <TitleArea>
          <BackButton onClick={onBackClick}>
            <BackIcon>←</BackIcon>
            <span>Back to Classes</span>
          </BackButton>
          <Title>Subjects for {className}</Title>
        </TitleArea>
        <SearchContainer>
          <SearchInput 
            type="text" 
            placeholder="Search subjects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </Header>
      
      {filteredSubjects.length === 0 ? (
        <EmptyState>
          <EmptyStateText>No subjects found</EmptyStateText>
        </EmptyState>
      ) : (
        <SubjectsContainer>
          {filteredSubjects.map(subject => (
            <SubjectCard 
              key={subject.id} 
              onClick={() => onSubjectSelect(subject)}
            >
              <SubjectName>{subject.name}</SubjectName>
              <ViewJournalText>View Journal</ViewJournalText>
            </SubjectCard>
          ))}
        </SubjectsContainer>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[500]};
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
`;

const BackIcon = styled.span`
  font-size: 1rem;
`;

const SearchContainer = styled.div`
  width: 300px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const SubjectsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  width: 100%;
`;

const SubjectCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.light};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary[500]};
  }
`;

const SubjectName = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const ViewJournalText = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.primary[500]};
  font-weight: 500;
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
  width: 100%;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px dashed ${props => props.theme.colors.border.light};
`;

const EmptyStateText = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.text.tertiary};
  margin: 0;
`;

export default SubjectSelector; 