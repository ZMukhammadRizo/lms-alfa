import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import supabase from '../config/supabaseClient';

// Improve the helper function to extract grade from subject code
const getGradeFromSubjectCode = (code: string): string | null => {
  // Normalize the code to uppercase and remove spaces
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  
  // Pattern 1: Direct grade at the end (e.g., MATH10, BIO11, CHEM12)
  const directGradeMatch = normalizedCode.match(/(\d{1,2})$/);
  if (directGradeMatch) {
    const grade = parseInt(directGradeMatch[1]);
    // Validate it's a reasonable grade (1-12)
    if (grade >= 1 && grade <= 12) {
      return grade.toString();
    }
  }
  
  // Pattern 2: Grade with a separator at the end or in the middle
  // Examples: MATH-10, PHYS_10, BIO.10, CHEM-10A
  const separatorMatch = normalizedCode.match(/[-_.:](\d{1,2})(?:[A-Z])?$/);
  if (separatorMatch) {
    const grade = parseInt(separatorMatch[1]);
    if (grade >= 1 && grade <= 12) {
      return grade.toString();
    }
  }
  
  // Pattern 3: Grade as a prefix like 10MATH
  const prefixMatch = normalizedCode.match(/^(\d{1,2})[A-Z]/);
  if (prefixMatch) {
    const grade = parseInt(prefixMatch[1]);
    if (grade >= 1 && grade <= 12) {
      return grade.toString();
    }
  }
  
  // Pattern 4: Grade embedded in the code with clear boundaries
  // Be careful with this one to avoid false positives
  const boundaryMatches = [
    // Grade at the end followed by a non-digit (e.g., MATH10A)
    normalizedCode.match(/(\d{1,2})[A-Z]$/),
    // Grade as part of a clear grade identifier (like G10, GR10, GRADE10)
    normalizedCode.match(/G(?:R(?:ADE)?)?(\d{1,2})/i)
  ];
  
  for (const match of boundaryMatches) {
    if (match) {
      const grade = parseInt(match[1]);
      if (grade >= 1 && grade <= 12) {
        return grade.toString();
      }
    }
  }
  
  return null;
};

// Modal styles
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  
  &:hover {
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const InfoPanel = styled.div`
  display: flex;
  gap: 16px;
  background-color: #f0f9ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  border-left: 4px solid #3b82f6;
`;

const InfoText = styled.div`
  flex: 1;
`;

const InfoTitle = styled.p`
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
`;

const InfoDescription = styled.p`
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }
  
  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 8px 16px;
  background-color: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  
  &:hover {
    background-color: #2563eb;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// New styled components for checkboxes
const SubjectsContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
`;

const SubjectItem = styled.div<{ $disabled?: boolean }>`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background-color: ${props => props.$disabled ? '#f9fafb' : 'white'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
  
  &:last-child {
    border-bottom: none;
  }
`;

const CheckboxContainer = styled.div`
  margin-right: 12px;
`;

const SubjectDetails = styled.div`
  flex: 1;
`;

const SubjectName = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
`;

const SubjectCode = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  background-color: #fef3c7;
  color: #92400e;
  margin-left: 12px;
`;

// Add this styled component for the grade indicator 
const GradeIndicator = styled.span`
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background-color: #e0f2fe;
  color: #0369a1;
  margin-left: 6px;
`;

// Create a new styled component for search input
const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  padding-left: 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' /%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 10px center;
  background-size: 18px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }
`;

const SubjectsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
`;

// Update the interface for multi-select functionality
interface AssignSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (grade: string, subjectIds: string[]) => Promise<boolean>;
}

const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

interface SubjectType {
  id: string;
  name: string;
  code: string;
  color: string;
  isAssigned?: boolean;
}

const AssignSubjectModal: React.FC<AssignSubjectModalProps> = ({
  isOpen,
  onClose,
  onAssign
}) => {
  const [gradeForSubject, setGradeForSubject] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSubjects, setAllSubjects] = useState<SubjectType[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectType[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Fetch subjects when modal opens
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*');
        
        if (error) {
          console.error('Error fetching subjects:', error);
          toast.error('Failed to load subjects');
          return;
        }
        
        const formattedSubjects = data.map(subject => ({
          id: subject.id,
          name: subject.name || subject.subjectname || `Subject ${subject.id}`,
          code: subject.code || '',
          color: subject.color || generateRandomColor(),
          isAssigned: false
        }));
        
        setAllSubjects(formattedSubjects);
        setFilteredSubjects(formattedSubjects);
      } catch (error) {
        console.error('Error in fetchSubjects:', error);
        toast.error('Failed to load subjects');
      }
    };

    fetchSubjects();
    
    // Reset state when modal opens
    setGradeForSubject('');
    setSelectedSubjects([]);
    
  }, [isOpen]);
  
  // Fetch class sections when grade changes
  useEffect(() => {
    const fetchClassSections = async () => {
      if (!gradeForSubject) {
        setClassSections([]);
        return;
      }
      
      try {
        // Fetch class sections for the selected grade
        const pattern = `${gradeForSubject}%`;
        const { data: sections, error: sectionsError } = await supabase
          .from('classes')
          .select('*')
          .like('classname', pattern);
        
        if (sectionsError) {
          console.error('Error fetching class sections:', sectionsError);
          return;
        }
        
        if (!sections || sections.length === 0) {
          console.warn(`No class sections found for Grade ${gradeForSubject}`);
          return;
        }
        
        setClassSections(sections);
        
        // Now check which subjects are already assigned to these sections
        await checkAssignedSubjects(sections);
        
      } catch (error) {
        console.error('Error fetching class sections:', error);
      }
    };
    
    fetchClassSections();
  }, [gradeForSubject]);
  
  // Check which subjects are already assigned to the selected grade's sections
  const checkAssignedSubjects = async (sections: any[]) => {
    if (!sections || sections.length === 0) return;
    
    try {
      // Get all class IDs
      const classIds = sections.map(section => section.id);
      
      // Fetch all existing assignments for these classes
      const { data: assignments, error } = await supabase
        .from('classsubjects')
        .select('*')
        .in('classid', classIds);
      
      if (error) {
        console.error('Error fetching assignments:', error);
        return;
      }
      
      if (!assignments || assignments.length === 0) {
        // No assignments, all subjects are unassigned
        return;
      }
      
      // Mark subjects that are already assigned
      const assignedSubjectIds = [...new Set(assignments.map(a => a.subjectid))];
      
      // Update filtered subjects to mark which ones are already assigned
      const updatedSubjects = filteredSubjects.map(subject => ({
        ...subject,
        isAssigned: assignedSubjectIds.includes(subject.id)
      }));
      
      setFilteredSubjects(updatedSubjects);
      
    } catch (error) {
      console.error('Error checking assigned subjects:', error);
    }
  };
  
  // Filter subjects when grade changes
  useEffect(() => {
    if (!gradeForSubject) {
      // If no grade selected, show all subjects
      setFilteredSubjects(allSubjects);
      return;
    }
    
    // Filter subjects that match the selected grade
    const subjectsForGrade = allSubjects.filter(subject => {
      // Get grade from subject code
      const subjectGrade = getGradeFromSubjectCode(subject.code);
      
      // Only include subjects that have a definite grade match
      return subjectGrade === gradeForSubject;
    });
    
    // Update filtered subjects
    setFilteredSubjects(subjectsForGrade);
    
    // Clear subject selection when grade changes
    setSelectedSubjects([]);
    
    // Also clear search term
    setSearchTerm('');
    
  }, [gradeForSubject, allSubjects]);
  
  // Add a new effect for search filtering
  useEffect(() => {
    if (!searchTerm.trim()) return;
    
    const searchResults = filteredSubjects.filter(subject => 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSubjects(searchResults);
  }, [searchTerm]);
  
  // Handle grade selection
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grade = e.target.value;
    setGradeForSubject(grade);
  };
  
  // Handle subject checkbox toggle
  const handleSubjectToggle = (subjectId: string, isAssigned: boolean) => {
    if (isAssigned) return; // If already assigned, do nothing
    
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If search is cleared, reset to original filtered list
    if (!value.trim()) {
      // Re-filter based on selected grade
      const subjectsForGrade = allSubjects.filter(subject => {
        const subjectGrade = getGradeFromSubjectCode(subject.code);
        return subjectGrade === gradeForSubject;
      });
      setFilteredSubjects(subjectsForGrade);
    }
  };
  
  const handleSubmit = async () => {
    if (!gradeForSubject || selectedSubjects.length === 0) {
      toast.error('Please select a grade and at least one subject');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await onAssign(gradeForSubject, selectedSubjects);
      if (success) {
        // Reset form and close modal
        setGradeForSubject('');
        setSelectedSubjects([]);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          maxWidth: '95%',
          padding: 0,
          borderRadius: '8px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
      contentLabel="Assign Subject to Grade"
    >
      <ModalHeader>
        <ModalTitle>Assign Subject to Grade</ModalTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </ModalHeader>
      
      <ModalBody>
        <InfoPanel>
          <InfoText>
            <InfoTitle>What does this do?</InfoTitle>
            <InfoDescription>
              This feature automatically assigns subjects to all sections of the selected grade.
              Select multiple subjects to assign them at once to sections like 10A, 10B, 10C, etc.
            </InfoDescription>
          </InfoText>
        </InfoPanel>
        
        <FormGroup>
          <Label htmlFor="gradeSelection">Grade <Required>*</Required></Label>
          <Select
            id="gradeSelection"
            value={gradeForSubject}
            onChange={handleGradeChange}
            disabled={isSubmitting}
          >
            <option value="">Select grade</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label>
            Subjects for Grade {gradeForSubject} <Required>*</Required>
            {gradeForSubject && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Only showing subjects created specifically for Grade {gradeForSubject}
              </div>
            )}
          </Label>
          {gradeForSubject ? (
            <>
              <SearchInput 
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isSubmitting}
              />
              
              {filteredSubjects.length > 0 ? (
                <>
                  <SubjectsContainer>
                    <SubjectsHeader>
                      <span>{filteredSubjects.length} subject(s) available</span>
                      <span>{selectedSubjects.length} selected</span>
                    </SubjectsHeader>
                    {filteredSubjects.map((subject) => (
                      <SubjectItem 
                        key={subject.id} 
                        $disabled={subject.isAssigned}
                      >
                        <CheckboxContainer>
                          <input 
                            type="checkbox" 
                            id={`subject-${subject.id}`}
                            checked={selectedSubjects.includes(subject.id) || false}
                            onChange={() => handleSubjectToggle(subject.id, subject.isAssigned || false)}
                            disabled={subject.isAssigned || isSubmitting}
                          />
                        </CheckboxContainer>
                        <SubjectDetails>
                          <SubjectName>
                            {subject.name}
                            <GradeIndicator>Grade {getGradeFromSubjectCode(subject.code)}</GradeIndicator>
                          </SubjectName>
                          <SubjectCode>{subject.code}</SubjectCode>
                        </SubjectDetails>
                        {subject.isAssigned && (
                          <StatusBadge>Already Assigned</StatusBadge>
                        )}
                      </SubjectItem>
                    ))}
                  </SubjectsContainer>
                </>
              ) : (
                <div style={{ padding: '16px', color: '#ef4444', fontSize: '14px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                  {searchTerm ? 
                    `No subjects found matching "${searchTerm}"` :
                    `No subjects found for Grade ${gradeForSubject}. Please create subjects with codes ending in ${gradeForSubject} first.`
                  }
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '16px', color: '#6b7280', fontSize: '14px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              Please select a grade first
            </div>
          )}
        </FormGroup>
      </ModalBody>
      
      <ModalFooter>
        <CancelButton
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </CancelButton>
        <SubmitButton
          onClick={handleSubmit}
          disabled={isSubmitting || !gradeForSubject || selectedSubjects.length === 0}
        >
          {isSubmitting ? 'Assigning...' : `Assign ${selectedSubjects.length} Subject(s)`}
        </SubmitButton>
      </ModalFooter>
    </Modal>
  );
};

export default AssignSubjectModal; 