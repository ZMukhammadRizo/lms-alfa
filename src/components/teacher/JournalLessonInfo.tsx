import React, { useState } from 'react';
import styled from 'styled-components';

interface JournalLessonInfoProps {
  date: string;
  topic: string;
  homework: string;
  onUpdate: (date: string, topic: string, homework: string) => void;
}

const JournalLessonInfo: React.FC<JournalLessonInfoProps> = ({
  date,
  topic,
  homework,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTopic, setNewTopic] = useState(topic);
  const [newHomework, setNewHomework] = useState(homework);
  
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
  });
  
  const handleSave = () => {
    onUpdate(date, newTopic, newHomework);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setNewTopic(topic);
    setNewHomework(homework);
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <EditorContainer>
        <div>
          <DateHeader>
            {formattedDate}
          </DateHeader>
        </div>
        <InputGroup>
          <Label>Topic:</Label>
          <Input 
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Enter lesson topic"
          />
        </InputGroup>
        <InputGroup>
          <Label>Homework:</Label>
          <Input 
            value={newHomework}
            onChange={(e) => setNewHomework(e.target.value)}
            placeholder="Enter homework"
          />
        </InputGroup>
        <ButtonGroup>
          <SaveButton onClick={handleSave}>Save</SaveButton>
          <CancelButton onClick={handleCancel}>Cancel</CancelButton>
        </ButtonGroup>
      </EditorContainer>
    );
  }
  
  return (
    <Container onClick={() => setIsEditing(true)}>
      <div>
        <DateHeader>
          {formattedDate}
        </DateHeader>
      </div>
      <InfoSection>
        <InfoLabel>Topic:</InfoLabel>
        <InfoValue>{topic || 'Not set'}</InfoValue>
      </InfoSection>
      <InfoSection>
        <InfoLabel>Homework:</InfoLabel>
        <InfoValue>{homework || 'Not set'}</InfoValue>
      </InfoSection>
      <EditHint>Click to edit</EditHint>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.light};
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 350px;
  min-height: 160px;
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.sm};
    border-color: ${props => props.theme.colors.border.dark};
  }
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.primary[500]};
  max-width: 350px;
  min-height: 160px;
  box-shadow: ${props => props.theme.shadows.md};
`;

const DateHeader = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
  word-break: break-word;
`;

const EditHint = styled.div`
  margin-top: auto;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.tertiary};
  font-style: italic;
  text-align: right;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
`;

const Input = styled.input`
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 1px ${props => props.theme.colors.primary[500]};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.35rem 0.75rem;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SaveButton = styled(Button)`
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

export default JournalLessonInfo; 