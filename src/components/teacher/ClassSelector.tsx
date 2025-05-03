import React, { useState } from 'react';
import styled from 'styled-components';
import { ClassData } from '../../pages/teacher/TeacherJournalPage';

interface ClassSelectorProps {
  classes: ClassData[];
  onClassSelect: (classData: ClassData) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  onClassSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Container>
      <Header>
        <Title>Select Class</Title>
        <SearchContainer>
          <SearchInput 
            type="text" 
            placeholder="Search classes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </Header>
      
      {filteredClasses.length === 0 ? (
        <EmptyState>
          <EmptyStateText>No classes found</EmptyStateText>
        </EmptyState>
      ) : (
        <ClassGrid>
          {filteredClasses.map(cls => (
            <ClassCard 
              key={cls.id} 
              onClick={() => onClassSelect(cls)}
            >
              <ClassName>{cls.name}</ClassName>
            </ClassCard>
          ))}
        </ClassGrid>
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
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
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

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  width: 100%;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const ClassCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
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

const ClassName = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
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

export default ClassSelector; 