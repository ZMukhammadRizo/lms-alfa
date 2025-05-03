import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FiSearch, FiChevronDown, FiChevronUp, FiFilter, FiCalendar, FiClock, FiFileText, FiMapPin, FiAlertCircle, FiCheckCircle, FiAward, FiBook } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

interface Test {
  id: string;
  title: string;
  subject: string;
  date: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'missed';
  type: 'quiz' | 'exam' | 'assignment';
  description?: string;
  score?: number;
  maxScore?: number;
  location?: string;
  instructions?: string;
}

const Tests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'missed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTests, setExpandedTests] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Mock data for tests
  const tests: Test[] = [
    {
      id: '1',
      title: 'Midterm Examination',
      subject: 'Mathematics',
      date: '2023-11-15T09:00:00',
      duration: 120,
      status: 'upcoming',
      type: 'exam',
      description: 'This exam covers chapters 1-5 from the textbook. Focus on calculus and linear algebra concepts.',
      maxScore: 100,
      location: 'Room 301',
      instructions: 'No calculators allowed. Bring two #2 pencils and an eraser.'
    },
    {
      id: '2',
      title: 'Weekly Quiz',
      subject: 'Physics',
      date: '2023-11-10T14:30:00',
      duration: 30,
      status: 'upcoming',
      type: 'quiz',
      description: 'Quiz on mechanics and thermodynamics concepts covered in the last two weeks.',
      maxScore: 20,
      location: 'Online',
      instructions: 'Open book quiz. You can use your notes and textbook.'
    },
    {
      id: '3',
      title: 'Final Project Submission',
      subject: 'Computer Science',
      date: '2023-12-05T23:59:00',
      duration: 0,
      status: 'upcoming',
      type: 'assignment',
      description: 'Submit your final project including source code and documentation.',
      maxScore: 50,
      instructions: 'Submit through the online portal as a single ZIP file. Include a README file.'
    },
    {
      id: '4',
      title: 'Literature Review',
      subject: 'English',
      date: '2023-10-25T10:00:00',
      duration: 90,
      status: 'completed',
      type: 'exam',
      description: 'Essay-based examination on 19th century American literature.',
      score: 88,
      maxScore: 100,
      location: 'Room 205'
    },
    {
      id: '5',
      title: 'Pop Quiz',
      subject: 'Chemistry',
      date: '2023-10-20T13:15:00',
      duration: 15,
      status: 'completed',
      type: 'quiz',
      description: 'Surprise quiz on chemical reactions and formulas.',
      score: 18,
      maxScore: 20,
      location: 'Lab 3'
    },
    {
      id: '6',
      title: 'Research Paper',
      subject: 'History',
      date: '2023-10-15T23:59:00',
      duration: 0,
      status: 'missed',
      type: 'assignment',
      description: 'Research paper on a historical event of your choice from the 20th century.',
      maxScore: 40,
      instructions: 'APA format, 8-10 pages double-spaced, minimum 5 academic sources.'
    }
  ];

  // Get unique subjects for filter dropdown
  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(tests.map(test => test.subject))];
    return ['all', ...uniqueSubjects];
  }, [tests]);

  // Handle expanding/collapsing test details
  const toggleTestExpansion = (id: string) => {
    setExpandedTests(prev => 
      prev.includes(id) ? prev.filter(testId => testId !== id) : [...prev, id]
    );
  };

  // Filter tests based on active tab, search term, and subject filter
  const filteredTests = useMemo(() => {
    return tests
      .filter(test => {
        // Filter by tab
        if (activeTab !== 'all' && test.status !== activeTab) return false;
        
        // Filter by search term
        if (searchTerm && !test.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !test.subject.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by subject
        if (subjectFilter !== 'all' && test.subject !== subjectFilter) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Sort by date (most recent first for completed, earliest first for upcoming)
        if (a.status === 'upcoming' && b.status === 'upcoming') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (a.status === 'completed' && b.status === 'completed') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return 0;
        }
      });
  }, [tests, activeTab, searchTerm, subjectFilter]);

  // Get counts for each tab
  const upcomingCount = tests.filter(test => test.status === 'upcoming').length;
  const completedCount = tests.filter(test => test.status === 'completed').length;
  const missedCount = tests.filter(test => test.status === 'missed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <FiClock />;
      case 'completed': return <FiCheckCircle />;
      case 'missed': return <FiAlertCircle />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <FiFileText />;
      case 'exam': return <FiBook />;
      case 'assignment': return <FiAward />;
      default: return <FiFileText />;
    }
  };

  const getSubjectColor = (subject: string): string => {
    const subjectColors: {[key: string]: string} = {
      'Mathematics': 'primary',
      'Physics': 'warning',
      'Computer Science': 'info',
      'English': 'success',
      'Chemistry': 'purple',
      'History': 'danger'
    };
    
    return subjectColors[subject] || 'primary';
  };

  return (
    <PageContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader>
        <HeaderContent>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <PageTitle>Tests & Assessments</PageTitle>
            <PageDescription>View and prepare for your upcoming tests and assessments</PageDescription>
          </motion.div>
        </HeaderContent>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <FilterContainer>
            <SearchContainer>
              <SearchIcon>
                <FiSearch />
              </SearchIcon>
              <SearchInput 
                type="text" 
                placeholder="Search tests..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            
            <FilterWrapper>
              <FilterIcon>
                <FiFilter />
              </FilterIcon>
              <Select 
                value={subjectFilter} 
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </Select>
            </FilterWrapper>
          </FilterContainer>
        </motion.div>
      </PageHeader>

      <TabsContainer>
        <TabButton 
          $isActive={activeTab === 'all'} 
          onClick={() => setActiveTab('all')}
        >
          All Tests
          <TabCount>{tests.length}</TabCount>
        </TabButton>
        <TabButton 
          $isActive={activeTab === 'upcoming'} 
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
          <TabCount>{upcomingCount}</TabCount>
        </TabButton>
        <TabButton 
          $isActive={activeTab === 'completed'} 
          onClick={() => setActiveTab('completed')}
        >
          Completed
          <TabCount>{completedCount}</TabCount>
        </TabButton>
        <TabButton 
          $isActive={activeTab === 'missed'} 
          onClick={() => setActiveTab('missed')}
        >
          Missed
          <TabCount>{missedCount}</TabCount>
        </TabButton>
      </TabsContainer>

      <ResultCount>
        Showing {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'}
      </ResultCount>

      <TestsGrid>
        <AnimatePresence>
          {filteredTests.map((test, index) => (
            <TestCard 
              key={test.id}
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
            >
              <TestHeader>
                <TestType $type={test.type}>
                  {test.type.charAt(0).toUpperCase() + test.type.slice(1)}
                </TestType>
                <StatusBadge status={test.status}>
                  {getStatusIcon(test.status)}
                  <span>
                    {test.status === 'upcoming' ? 'Upcoming' : 
                     test.status === 'completed' ? 'Completed' : 'Missed'}
                  </span>
                </StatusBadge>
              </TestHeader>
              
              <TestTitle>{test.title}</TestTitle>
              
              <SubjectBadge $color={getSubjectColor(test.subject)}>
                {getTypeIcon(test.type)}
                <span>{test.subject}</span>
              </SubjectBadge>
              
              <TestMetaInfo>
                <MetaItem>
                  <FiCalendar size={14} />
                  <span>{format(parseISO(test.date), 'MMM d, yyyy • h:mm a')}</span>
                </MetaItem>
                {test.duration > 0 && (
                  <MetaItem>
                    <FiClock size={14} />
                    <span>{test.duration} minutes</span>
                  </MetaItem>
                )}
                {test.location && (
                  <MetaItem>
                    <FiMapPin size={14} />
                    <span>{test.location}</span>
                  </MetaItem>
                )}
              </TestMetaInfo>
              
              {test.status === 'completed' && test.score !== undefined && (
                <ScoreSection>
                  <ScoreLabel>Your Score</ScoreLabel>
                  <ScoreDisplay $score={test.score / (test.maxScore || 1) * 100}>
                    {test.score}/{test.maxScore}
                  </ScoreDisplay>
                  <ScoreBar>
                    <ScoreFill $score={test.score / (test.maxScore || 1) * 100} />
                  </ScoreBar>
                </ScoreSection>
              )}
              
              <ExpandButton
                type="button"
                onClick={() => toggleTestExpansion(test.id)}
                $isExpanded={expandedTests.includes(test.id)}
              >
                {expandedTests.includes(test.id) ? 'Hide Details' : 'Show Details'}
                {expandedTests.includes(test.id) ? <FiChevronUp /> : <FiChevronDown />}
              </ExpandButton>
              
              <AnimatePresence>
                {expandedTests.includes(test.id) && (
                  <TestDetails
                    as={motion.div}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {test.description && (
                      <DetailSection>
                        <DetailTitle>Description</DetailTitle>
                        <DetailContent>{test.description}</DetailContent>
                      </DetailSection>
                    )}
                    
                    {test.instructions && (
                      <DetailSection>
                        <DetailTitle>Instructions</DetailTitle>
                        <DetailContent>{test.instructions}</DetailContent>
                      </DetailSection>
                    )}
                    
                    {test.status === 'upcoming' && (
                      <ActionButton
                        as={motion.button}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {test.type === 'quiz' || test.type === 'exam' ? 'Prepare Now' : 'Submit Assignment'}
                      </ActionButton>
                    )}
                  </TestDetails>
                )}
              </AnimatePresence>
            </TestCard>
          ))}
        </AnimatePresence>
      </TestsGrid>
      
      {filteredTests.length === 0 && (
        <EmptyState>
          <EmptyIcon>
            <FiFileText size={48} />
          </EmptyIcon>
          <EmptyTitle>No tests found</EmptyTitle>
          <EmptyDescription>
            {searchTerm 
              ? `No tests match your search "${searchTerm}"`
              : `No ${activeTab !== 'all' ? activeTab : ''} tests available`
            }
          </EmptyDescription>
        </EmptyState>
      )}
    </PageContainer>
  );
};

interface TabButtonProps {
  $isActive: boolean;
}

interface StatusBadgeProps {
  status: string;
}

interface TestTypeProps {
  $type: string;
}

interface ScoreProps {
  $score: number;
}

interface SubjectProps {
  $color: string;
}

interface ExpandButtonProps {
  $isExpanded: boolean;
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
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

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 280px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.tertiary};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 36px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
`;

const FilterWrapper = styled.div`
  position: relative;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 100%;
  }
`;

const FilterIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.tertiary};
  z-index: 1;
  pointer-events: none;
`;

const Select = styled.select`
  appearance: none;
  width: 180px;
  padding: 10px 10px 10px 36px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 100%;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    overflow-x: auto;
    padding-bottom: 8px;
    width: 100%;
    
    &::-webkit-scrollbar {
      height: 3px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${props => props.theme.colors.background.light};
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${props => props.theme.colors.primary[200]};
      border-radius: 4px;
    }
  }
`;

const TabButton = styled.button<TabButtonProps>`
  background-color: ${props => props.$isActive ? props.theme.colors.primary[500] : 'transparent'};
  color: ${props => props.$isActive ? 'white' : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.border.light};
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: ${props => {
      if (props.$isActive) {
        return props.theme.colors.primary[600];
      }
      return props.theme.colors.background.hover;
    }};
  }
`;

const TabCount = styled.span`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
`;

const ResultCount = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: -8px;
`;

const TestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const TestCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border.light};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

const TestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TestType = styled.div<TestTypeProps>`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  
  ${props => {
    switch(props.$type) {
      case 'quiz':
        return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `;
      case 'exam':
        return `
          background-color: ${props.theme.colors.warning[50]};
          color: ${props.theme.colors.warning[500]};
        `;
      case 'assignment':
        return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `;
      default:
        return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `;
    }
  }}
`;

const StatusBadge = styled.div<StatusBadgeProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  
  ${props => {
    switch(props.status) {
      case 'upcoming':
        return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `;
      case 'completed':
        return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `;
      case 'missed':
        return `
          background-color: ${props.theme.colors.danger[50]};
          color: ${props.theme.colors.danger[500]};
        `;
      default:
        return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `;
    }
  }}
`;

const TestTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const SubjectBadge = styled.div<SubjectProps>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 4px;
  margin-top: -8px;
  
  ${props => {
    switch(props.$color) {
      case 'primary':
        return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `;
      case 'warning':
        return `
          background-color: ${props.theme.colors.warning[50]};
          color: ${props.theme.colors.warning[500]};
        `;
      case 'success':
        return `
          background-color: ${props.theme.colors.success[50]};
          color: ${props.theme.colors.success[500]};
        `;
      case 'danger':
        return `
          background-color: ${props.theme.colors.danger[50]};
          color: ${props.theme.colors.danger[500]};
        `;
      case 'purple':
        return `
          background-color: #f3e8ff;
          color: #7c3aed;
        `;
      case 'info':
        return `
          background-color: #e0f7ff;
          color: #0ea5e9;
        `;
      default:
        return `
          background-color: ${props.theme.colors.primary[50]};
          color: ${props.theme.colors.primary[500]};
        `;
    }
  }}
`;

const TestMetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ScoreSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const ScoreLabel = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
  width: 80px;
`;

const ScoreDisplay = styled.div<ScoreProps>`
  font-size: 14px;
  font-weight: 600;
  min-width: 60px;
  
  ${props => {
    if (props.$score >= 90) {
      return `color: ${props.theme.colors.success[500]};`;
    } else if (props.$score >= 75) {
      return `color: ${props.theme.colors.primary[500]};`;
    } else if (props.$score >= 60) {
      return `color: ${props.theme.colors.warning[500]};`;
    } else {
      return `color: ${props.theme.colors.danger[500]};`;
    }
  }}
`;

const ScoreBar = styled.div`
  flex: 1;
  height: 6px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
`;

const ScoreFill = styled.div<ScoreProps>`
  height: 100%;
  width: ${props => props.$score}%;
  
  ${props => {
    if (props.$score >= 90) {
      return `background-color: ${props.theme.colors.success[500]};`;
    } else if (props.$score >= 75) {
      return `background-color: ${props.theme.colors.primary[500]};`;
    } else if (props.$score >= 60) {
      return `background-color: ${props.theme.colors.warning[500]};`;
    } else {
      return `background-color: ${props.theme.colors.danger[500]};`;
    }
  }}
  
  border-radius: 3px;
  transition: width 1s ease-in-out;
`;

const ExpandButton = styled.button<ExpandButtonProps>`
  background-color: transparent;
  color: ${props => props.theme.colors.primary[500]};
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  transition: all 0.2s ease;
  margin-top: -8px;
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
    text-decoration: underline;
  }
  
  svg {
    transition: transform 0.2s ease;
    transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const TestDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  padding-top: 16px;
  margin-top: 8px;
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const DetailContent = styled.p`
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
  line-height: 1.5;
`;

const ActionButton = styled.button`
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.background.light};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 8px;
`;

const EmptyDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
  max-width: 400px;
`;

export default Tests; 