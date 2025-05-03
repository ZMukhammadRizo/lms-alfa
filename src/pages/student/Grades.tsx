import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiBook, FiUser, FiSearch, FiCheck, FiX, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentGrades, SubjectGrade, getQuarters, getMockGrades, debugCheckTables } from '../../services/gradesService';
import { testGradesDBSetup } from '../../utils/dbTester';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};


// Helper function to get color based on score

// Add style for No Grade text (defined before use)

const Grades: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectGrade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Debug: Check database tables
        await debugCheckTables();

        const quartersData = await getQuarters();
        setQuarters(quartersData);

        if (user?.id) {
          // Fetch grades data
          const gradesData = await getStudentGrades(user.id);
          
          if (gradesData && gradesData.length > 0) {
            console.log('✅ Successfully loaded grades data:', gradesData.length, 'subjects');
            setSubjects(gradesData);
          } else {
            console.warn('⚠️ No grades data returned from service. Using mock data for demo');
            // Use mock data for demonstration
            const mockData = getMockGrades();
            setSubjects(mockData);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching grade data:', error);
        toast.error('Failed to load grades data. Using example data instead.');
        
        // Use mock data for demonstration
        const mockData = getMockGrades();
        setSubjects(mockData);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter(subject => 
    subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate overall grade average

  // Get quarter name from ID

  // Run database diagnostic
  const runDiagnostic = async () => {
    if (!user?.id) {
      toast.error('You need to be logged in to run diagnostics');
      return;
    }
    
    setDiagLoading(true);
    try {
      const results = await testGradesDBSetup(user.id);
      setDiagnosticResults(results);
      
      if (results.success) {
        toast.success('Database setup verified successfully!');
      } else {
        toast.error(`Database issues found: ${results.message}`);
      }
    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast.error('Failed to run diagnostics');
    } finally {
      setDiagLoading(false);
    }
  };
  

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <p>Loading grades...</p>
      </LoadingContainer>
    );
  }

  return (
    <GradesContainer>
      <PageHeader>
        <HeaderContent>
          <PageTitle>My Grades</PageTitle>
          <PageDescription>View your academic progress and attendance</PageDescription>
        </HeaderContent>
       
      </PageHeader>

      {diagnosticMode && (
        <DiagnosticsPanel>
          <DiagnosticsHeader>
            <h3>Database Diagnostics</h3>
            <RefreshButton onClick={runDiagnostic} disabled={diagLoading}>
              <FiRefreshCw size={16} className={diagLoading ? 'spin' : ''} />
            </RefreshButton>
          </DiagnosticsHeader>
          
          {diagnosticResults ? (
            <>
              <DiagnosticsSection>
                <h4>Tables Status:</h4>
                <TableGrid>
                  {Object.entries(diagnosticResults.tables).map(([table, exists]) => (
                    <TableStatus key={table} $exists={exists as boolean}>
                      {exists ? <FiCheck size={16} /> : <FiX size={16} />}
                      <span>{table}</span>
                    </TableStatus>
                  ))}
                </TableGrid>
              </DiagnosticsSection>
              
              {diagnosticResults.userData && (
                <DiagnosticsSection>
                  <h4>User Data:</h4>
                  <div>
                    <p><strong>Classes:</strong> {diagnosticResults.userData.classes?.length || 0}</p>
                    <p><strong>Subjects:</strong> {diagnosticResults.userData.subjects?.length || 0}</p>
                  </div>
                </DiagnosticsSection>
              )}
              
              <DiagnosticMessage $success={diagnosticResults.success}>
                {diagnosticResults.message}
              </DiagnosticMessage>
            </>
          ) : (
            <p>No diagnostic information available. Run the check to verify your database setup.</p>
          )}
        </DiagnosticsPanel>
      )}

      <FilterSection>
        <SearchBar>
          <SearchIcon>
            <FiSearch size={18} />
          </SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search subjects or teachers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        

      </FilterSection>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <SubjectsGrid>
          {filteredSubjects.map(subject => (
            <motion.div key={subject.id} variants={cardVariants} layout>
              <SubjectCard 
                $color={subject.color}
                onClick={() => navigate(`/student/grades/${subject.id}`)}
                as={motion.div}
                whileHover={{ y: -4 }}
              >
                <SubjectHeader>
                  <SubjectIcon $color={subject.color}>
                    <FiBook size={20} />
                  </SubjectIcon>
                  <SubjectInfo>
                    <SubjectName>{subject.subjectName}</SubjectName>
                    <TeacherName>
                      <FiUser size={14} />
                      <span>{subject.teacherName}</span>
                    </TeacherName>
                  </SubjectInfo>
                </SubjectHeader>

                
                <ViewMoreButton onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/grades/${subject.id}`);
                }}>
                  <span>View Full Details</span>
                  <FiChevronRight size={16} />
                </ViewMoreButton>
              </SubjectCard>
            </motion.div>
          ))}
        </SubjectsGrid>
      </motion.div>
      
      {filteredSubjects.length === 0 && (
        <NoSubjectsMessage>
          <FiBook size={40} />
          <h3>No subjects found</h3>
          <p>You don't have any subjects assigned yet or your search didn't match any subjects</p>
        </NoSubjectsMessage>
      )}
    </GradesContainer>
  );
};

// Styled components
const GradesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 40px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const PageDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 4px 0 0 0;
`;



interface ScoreProps {
  $score: number;
}




const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: ${props => props.theme.shadows.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  padding: 0 12px;
  width: 100%;
  max-width: 320px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    max-width: 100%;
  }
`;

const SearchIcon = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  margin-right: 8px;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  height: 40px;
  width: 100%;
  color: ${props => props.theme.colors.text.primary};
  outline: none;
  font-size: 14px;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const QuarterDropdown = styled.div`
  position: relative;
  display: inline-block;
`;



interface SelectedProps {
  $isSelected: boolean;
}


const SubjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

interface SubjectCardProps {
  $color?: string;
}

const SubjectCard = styled.div<SubjectCardProps>`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-left: 4px solid ${props => props.$color || props.theme.colors.primary};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.shadows.sm};
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const SubjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

interface ColorProps {
  $color?: string;
}

const SubjectIcon = styled.div<ColorProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: ${props => `${props.$color}20` || props.theme.colors.primary[100]};
  color: ${props => props.$color || props.theme.colors.primary};
`;

const SubjectInfo = styled.div`
  flex: 1;
`;

const SubjectName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const TeacherName = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
`;








interface PercentageProps {
  $percentage: number;
}












interface ColorLabelProps {
  $color: string;
}



const NoSubjectsMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  
  h3 {
    margin: 16px 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.colors.text.primary};
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  
  p {
    margin: 16px 0 0 0;
    font-size: 14px;
  }
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// New styled components for diagnostics

const DiagnosticsPanel = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const DiagnosticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const DiagnosticsSection = styled.div`
  margin-bottom: 16px;
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
  }
`;

const TableGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
`;

interface TableStatusProps {
  $exists: boolean;
}

const TableStatus = styled.div<TableStatusProps>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: ${props => props.$exists ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)'};
  border-radius: 6px;
  color: ${props => props.$exists ? '#48bb78' : '#f56565'};
  font-size: 13px;
  
  span {
    color: ${props => props.theme.colors.text.primary};
  }
`;

interface DiagnosticMessageProps {
  $success: boolean;
}

const DiagnosticMessage = styled.div<DiagnosticMessageProps>`
  padding: 12px;
  background-color: ${props => props.$success ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)'};
  border-left: 3px solid ${props => props.$success ? '#48bb78' : '#f56565'};
  border-radius: 4px;
  color: ${props => props.theme.colors.text.primary};
  font-size: 14px;
`;



const ViewMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  margin-top: 12px;
  background-color: ${props => props.theme.colors.background.secondary};
  color: #3f51b5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(63, 81, 181, 0.08);
  }
`;

export default Grades; 