import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronUp, FiUser } from 'react-icons/fi';
import { useParent, useSelectedStudent } from '../../stores/useParentStore';

const SelectorContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
`;

const SelectorButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.main};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.theme.colors.text.primary};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
  
  ${props => props.$isOpen && `
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-color: transparent;
  `}
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: ${props => props.theme.colors.primary[700]};
`;

const StudentName = styled.div`
  font-weight: 500;
  margin-right: 8px;
`;

const StudentGrade = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const DropdownContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.main};
  border-top: none;
  border-bottom-left-radius: ${props => props.theme.borderRadius.md};
  border-bottom-right-radius: ${props => props.theme.borderRadius.md};
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const DropdownItem = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background-color: ${props => props.$isActive 
    ? props.theme.colors.background.hover 
    : props.theme.colors.background.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.theme.colors.text.primary};
  text-align: left;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
  
  &:last-child {
    border-bottom-left-radius: ${props => props.theme.borderRadius.md};
    border-bottom-right-radius: ${props => props.theme.borderRadius.md};
  }
`;

const NoStudentsMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

const StudentSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { linkedStudents, studentData, setSelectedStudent, fetchLinkedStudents } = useParent();
  const selectedStudentId = useSelectedStudent();

  // Get the currently selected student
  const selectedStudent = studentData[selectedStudentId || ''];

  // Fetch linked students on component mount
  useEffect(() => {
    fetchLinkedStudents();
  }, [fetchLinkedStudents]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudent(studentId);
    setIsOpen(false);
  };

  // Render a loading state or error message if no selected student
  if (!selectedStudent) {
    return (
      <SelectorContainer>
        <SelectorButton $isOpen={false} onClick={toggleDropdown}>
          <StudentInfo>
            <Avatar>
              <FiUser size={18} />
            </Avatar>
            <StudentName>Loading...</StudentName>
          </StudentInfo>
        </SelectorButton>
      </SelectorContainer>
    );
  }

  return (
    <SelectorContainer ref={dropdownRef}>
      <SelectorButton $isOpen={isOpen} onClick={toggleDropdown}>
        <StudentInfo>
          <Avatar>
            {selectedStudent.avatar ? (
              <img src={selectedStudent.avatar} alt={selectedStudent.name} />
            ) : (
              <FiUser size={18} />
            )}
          </Avatar>
          <div>
            <StudentName>{selectedStudent.name}</StudentName>
            <StudentGrade>{selectedStudent.grade}</StudentGrade>
          </div>
        </StudentInfo>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </SelectorButton>
      
      <DropdownContainer $isOpen={isOpen}>
        {linkedStudents.length === 0 ? (
          <NoStudentsMessage>No students linked to your account.</NoStudentsMessage>
        ) : (
          linkedStudents.map(relation => {
            const student = studentData[relation.studentId];
            if (!student) return null;
            
            return (
              <DropdownItem
                key={relation.studentId}
                $isActive={relation.studentId === selectedStudentId}
                onClick={() => handleSelectStudent(relation.studentId)}
              >
                <Avatar>
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} />
                  ) : (
                    <FiUser size={18} />
                  )}
                </Avatar>
                <div>
                  <StudentName>{student.name}</StudentName>
                  <StudentGrade>{student.grade}</StudentGrade>
                </div>
              </DropdownItem>
            );
          })
        )}
      </DropdownContainer>
    </SelectorContainer>
  );
};

export default StudentSelector; 