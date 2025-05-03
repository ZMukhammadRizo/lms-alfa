import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiGrid, FiList, FiPlus, FiCalendar, FiClock, FiUsers, FiBook, FiEdit, FiTrash2, FiMoreHorizontal, FiChevronRight, FiUserCheck, FiLayers, FiX, FiMail, FiPhone, FiInfo, FiCheckCircle, FiChevronDown, FiFilter, FiArrowLeft, FiMapPin, FiDownload, FiEye, FiEdit2 } from 'react-icons/fi';
import { Class } from '../../types/Class';

// Mock data for students
const mockStudents = [
  {
    id: "s1",
    name: "Emma Johnson",
    email: "emma.j@example.com",
    phone: "+1 (555) 123-4567",
    grade: "10",
    section: "A",
    attendance: 95,
    performance: 88,
    subjects: ["Mathematics", "English", "Science"]
  },
  {
    id: "s2",
    name: "Ryan Smith",
    email: "ryan.s@example.com",
    phone: "+1 (555) 234-5678",
    grade: "10", 
    section: "B",
    attendance: 92,
    performance: 78,
    subjects: ["Mathematics", "History", "Physics"]
  },
  {
    id: "s3",
    name: "Sophia Williams",
    email: "sophia.w@example.com",
    phone: "+1 (555) 345-6789",
    grade: "11",
    section: "A",
    attendance: 98,
    performance: 95,
    subjects: ["Chemistry", "English", "Computer Science"]
  },
  {
    id: "s4",
    name: "Daniel Brown",
    email: "daniel.b@example.com",
    phone: "+1 (555) 456-7890",
    grade: "11",
    section: "B",
    attendance: 85,
    performance: 82,
    subjects: ["Physics", "Mathematics", "Geography"]
  },
  {
    id: "s5",
    name: "Olivia Davis",
    email: "olivia.d@example.com",
    phone: "+1 (555) 567-8901",
    grade: "12",
    section: "A",
    attendance: 96,
    performance: 91,
    subjects: ["Biology", "Chemistry", "Literature"]
  },
  {
    id: "s6",
    name: "Liam Miller",
    email: "liam.m@example.com",
    phone: "+1 (555) 678-9012",
    grade: "12",
    section: "B",
    attendance: 88,
    performance: 84,
    subjects: ["History", "Economics", "Mathematics"]
  }
];

// Mock data for grade levels
const mockGradeLevels = [
  {
    level: "10",
    students: 24,
    sections: 3,
    averagePerformance: 83
  },
  {
    level: "11",
    students: 18,
    sections: 3,
    averagePerformance: 77
  },
  {
    level: "12",
    students: 16,
    sections: 3,
    averagePerformance: 82
  }
];

// Mock data for sections
const mockSections = {
  "10": [
    {
      id: "10A",
      name: "10-A",
      room: "Room 101",
      students: 3,
      teacher: "John Smith",
      performance: 80
    },
    {
      id: "10B",
      name: "10-B",
      room: "Room 102",
      students: 1,
      teacher: "Jane Doe",
      performance: 88
    },
    {
      id: "10C",
      name: "10-C",
      room: "Room 103",
      students: 0,
      teacher: "David Thomas",
      performance: 78
    }
  ],
  "11": [
    {
      id: "11A",
      name: "11-A",
      room: "Room 201",
      students: 5,
      teacher: "Michael Brown",
      performance: 85
    },
    {
      id: "11B",
      name: "11-B",
      room: "Room 202",
      students: 4,
      teacher: "Sarah Johnson",
      performance: 79
    }
  ],
  "12": [
    {
      id: "12A",
      name: "12-A",
      room: "Room 301",
      students: 6,
      teacher: "Robert Wilson",
      performance: 90
    },
    {
      id: "12B",
      name: "12-B",
      room: "Room 302",
      students: 4,
      teacher: "Emily Davis",
      performance: 84
    }
  ]
};

// Mock data for development
const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Advanced Mathematics',
    subject: 'Mathematics',
    teacher: 'John Smith',
    schedule: 'Mon, Wed, Fri',
    time: '09:00 - 10:30',
    room: 'A101',
    students: 28,
    status: 'active',
    color: '#4F46E5'
  },
  {
    id: '2',
    name: 'Physics Fundamentals',
    subject: 'Physics',
    teacher: 'Emily Davis',
    schedule: 'Tue, Thu',
    time: '11:00 - 12:30',
    room: 'B202',
    students: 24,
    status: 'active',
    color: '#10B981'
  },
  {
    id: '3',
    name: 'World Literature',
    subject: 'English',
    teacher: 'Sarah Wilson',
    schedule: 'Mon, Wed',
    time: '13:00 - 14:30',
    room: 'C303',
    students: 22,
    status: 'active',
    color: '#F59E0B'
  },
  {
    id: '4',
    name: 'Ancient History',
    subject: 'History',
    teacher: 'Michael Brown',
    schedule: 'Tue, Thu',
    time: '09:00 - 10:30',
    room: 'D404',
    students: 26,
    status: 'active',
    color: '#EC4899'
  },
  {
    id: '5',
    name: 'Programming 101',
    subject: 'Computer Science',
    teacher: 'Robert Johnson',
    schedule: 'Wed, Fri',
    time: '15:00 - 16:30',
    room: 'Lab 101',
    students: 20,
    status: 'active',
    color: '#8B5CF6'
  },
  {
    id: '6',
    name: 'Biology Lab',
    subject: 'Biology',
    teacher: 'Jennifer Lee',
    schedule: 'Mon, Thu',
    time: '14:00 - 15:30',
    room: 'Lab 202',
    students: 18,
    status: 'inactive',
    color: '#06B6D4'
  },
  {
    id: '7',
    name: 'Chemistry 101',
    subject: 'Chemistry',
    teacher: 'David Miller',
    schedule: 'Tue, Fri',
    time: '10:00 - 11:30',
    room: 'Lab 303',
    students: 22,
    status: 'active',
    color: '#F97316'
  },
  {
    id: '8',
    name: 'Economics Basics',
    subject: 'Economics',
    teacher: 'Sophia Chen',
    schedule: 'Mon, Wed',
    time: '11:00 - 12:30',
    room: 'E505',
    students: 30,
    status: 'active',
    color: '#0EA5E9'
  }
];

// Add mock data for student courses
const mockStudentCourses = {
  "s1": ["Algebra Fundamentals", "Geometry"],
  "s2": ["Algebra Fundamentals"],
  "s3": ["Physics", "Chemistry"],
  "s4": ["Physics", "Geography"],
  "s5": ["Biology", "Chemistry"],
  "s6": ["History", "Economics"]
};

// Pre-define styled components to avoid reference errors
const ViewStudentsButton = styled.div`
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.primary[500]};
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  pointer-events: none;
  
  svg {
    font-size: 16px;
  }
`;

const ViewSectionsButton = styled.div`
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.warning[500]};
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  pointer-events: none;
  
  svg {
    font-size: 16px;
  }
`;

const Classes: React.FC = () => {
  // State for search, filters, and view mode
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState<string | null>(null);
  
  // State for showing grade levels
  const [showGradeLevels, setShowGradeLevels] = useState(false);
  const [gradeSearchTerm, setGradeSearchTerm] = useState('');
  
  // State for showing sections
  const [showSections, setShowSections] = useState(false);
  const [selectedGradeForSections, setSelectedGradeForSections] = useState<string | null>(null);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  
  // State for student modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Filter classes based on search term and filters
  const filteredClasses = mockClasses.filter(cls => {
    const matchesSearch = 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject ? cls.subject === filterSubject : true;
    const matchesStatus = filterStatus ? cls.status === filterStatus : true;
    
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Filter grade levels based on search term
  const filteredGradeLevels = mockGradeLevels.filter(grade => {
    return grade.level.toLowerCase().includes(gradeSearchTerm.toLowerCase());
  });

  // Filter sections based on search term
  const filteredSections = selectedGradeForSections ? 
    mockSections[selectedGradeForSections].filter(section => 
      section.name.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
      section.teacher.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
      section.room.toLowerCase().includes(sectionSearchTerm.toLowerCase())
    ) : [];

  // Get unique subjects for filter
  const subjects = Array.from(new Set(mockClasses.map(cls => cls.subject)));

  // Filter students based on selected grade and section
  const filteredStudents = mockStudents.filter(student => {
    const matchesGrade = selectedGrade ? student.grade === selectedGrade : true;
    const matchesSection = selectedSection ? student.section === selectedSection : true;
    return matchesGrade && matchesSection;
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle grade search input change
  const handleGradeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGradeSearchTerm(e.target.value);
  };

  // Handle section search input change
  const handleSectionSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSectionSearchTerm(e.target.value);
  };

  // Handle subject filter change
  const handleSubjectFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSubject(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  };

  // Toggle view mode
  // const toggleViewMode = () => {
  //   setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  // };

  // Toggle actions menu
  const toggleActionsMenu = (classId: string) => {
    if (isActionsMenuOpen === classId) {
      setIsActionsMenuOpen(null);
    } else {
      setIsActionsMenuOpen(classId);
    }
  };

  // Handle edit class
  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls);
    console.log('Edit class:', cls);
    // Implement edit class functionality here
  };

  // Handle delete class
  const handleDeleteClass = (classId: string) => {
    console.log(`Delete class with ID: ${classId}`);
    // Implement delete functionality here
  };

  // Handle subject click to show grade levels
  const handleSubjectClick = () => {
    setShowGradeLevels(true);
  };

  // Handle back to classes view
  const handleBackToClasses = () => {
    setShowGradeLevels(false);
  };

  // Handle view sections click
  const handleViewSections = (grade: string) => {
    setSelectedGradeForSections(grade);
    setShowSections(true);
    setShowGradeLevels(false);
  };

  // Handle back to grade levels
  const handleBackToGradeLevels = () => {
    setShowSections(false);
    setShowGradeLevels(true);
  };

  // Handle view students click
  const handleViewStudents = (grade: string, section: string | null = null) => {
    setSelectedGrade(grade);
    setSelectedSection(section);
    setShowStudentModal(true);
  };

  // Handle section selection
  const handleSectionSelect = (section: string) => {
    setSelectedSection(section);
  };

  // Close all action menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsActionsMenuOpen(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <ClassesContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <HeaderSection>
        <div>
          {showSections ? (
            <>
              <PageTitleWithBack>
                <BackButton onClick={handleBackToGradeLevels}>
                  <FiArrowLeft />
                  Back to Grade Levels
                </BackButton>
                <PageTitle>Grade {selectedGradeForSections} Sections</PageTitle>
              </PageTitleWithBack>
              <PageDescription>{mockSections[selectedGradeForSections!].length} sections in Grade {selectedGradeForSections}</PageDescription>
            </>
          ) : showGradeLevels ? (
            <>
              <PageTitleWithBack>
                <BackButton onClick={handleBackToClasses}>
                  <FiChevronRight style={{ transform: 'rotate(180deg)' }} />
                  Back
                </BackButton>
                <PageTitle>Grade Levels</PageTitle>
              </PageTitleWithBack>
              <PageDescription>View and manage student grade levels</PageDescription>
            </>
          ) : (
            <>
              <PageTitle>Class Management</PageTitle>
              <PageDescription>Organize and manage your academic classes</PageDescription>
            </>
          )}
        </div>

        {showSections && (
          <ExportDataButton>
            <FiDownload />
            <span>Export Data</span>
          </ExportDataButton>
        )}

        {!showGradeLevels && !showSections && (
          <AddClassButton
            as={motion.button}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiPlus />
            <span>Add New Class</span>
          </AddClassButton>
        )}
      </HeaderSection>

      {showSections ? (
        <SectionsComponent 
          sections={filteredSections} 
          searchTerm={sectionSearchTerm} 
          grade={selectedGradeForSections!}
          onSearchChange={handleSectionSearchChange}
          onViewStudents={handleViewStudents}
        />
      ) : showGradeLevels ? (
        <GradeLevelsComponent 
          gradeLevels={filteredGradeLevels} 
          searchTerm={gradeSearchTerm} 
          onSearchChange={handleGradeSearchChange}
          onViewSections={handleViewSections}
        />
      ) : (
        <>
          <FiltersContainer>
            <SearchAndFilters>
              <SearchContainer>
                <FiSearch />
                <SearchInput
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </SearchContainer>

              <FilterDropdown>
                <select value={filterSubject} onChange={handleSubjectFilterChange}>
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </FilterDropdown>

              <FilterDropdown>
                <select value={filterStatus} onChange={handleStatusFilterChange}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FilterDropdown>
            </SearchAndFilters>

            <ViewToggle>
              <ViewButton
                $isActive={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
              </ViewButton>
              <ViewButton
                $isActive={viewMode === 'list'}
                onClick={() => setViewMode('list')}
              >
                <FiList />
              </ViewButton>
            </ViewToggle>
          </FiltersContainer>

          {viewMode === 'grid' ? (
            // Grid View
            <ClassGrid>
              {filteredClasses.map(cls => (
                <ClassCard key={cls.id} $color={cls.color}>
                  <CardHeader>
                    <ClassStatus $status={cls.status}>
                      {cls.status === 'active' ? 'Active' : 'Inactive'}
                    </ClassStatus>
                    <CardActions onClick={(e) => {
                      e.stopPropagation();
                      toggleActionsMenu(cls.id);
                    }}>
                      <FiMoreHorizontal />
                      <AnimatePresence>
                        {isActionsMenuOpen === cls.id && (
                          <ActionsMenu
                            as={motion.div}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionButton onClick={() => handleEditClass(cls)}>
                              <FiEdit />
                              <span>Edit</span>
                            </ActionButton>
                            <ActionButton onClick={() => handleDeleteClass(cls.id)}>
                              <FiTrash2 />
                              <span>Delete</span>
                            </ActionButton>
                          </ActionsMenu>
                        )}
                      </AnimatePresence>
                    </CardActions>
                  </CardHeader>

                  <ClassName>{cls.name}</ClassName>
                  <ClassSubject>
                    <SubjectBox onClick={handleSubjectClick}>
                      <span>{cls.subject}</span>
                    </SubjectBox>
                  </ClassSubject>

                  <TeacherInfo>
                    <span>{cls.teacher}</span>
                  </TeacherInfo>

                  <ClassDetails>
                    <DetailItem>
                      <DetailIcon>
                        <FiCalendar />
                      </DetailIcon>
                      <span>{cls.schedule}</span>
                    </DetailItem>
                    <DetailItem>
                      <DetailIcon>
                        <FiClock />
                      </DetailIcon>
                      <span>{cls.time}</span>
                    </DetailItem>
                    <DetailItem>
                      <DetailIcon>
                        <FiUsers />
                      </DetailIcon>
                      <span>{cls.students} students</span>
                    </DetailItem>
                  </ClassDetails>
                </ClassCard>
              ))}
            </ClassGrid>
          ) : (
            // List View
            <ClassTable>
              <TableHeader>
                <ListHeaderCell width="25%" onClick={handleSubjectClick}>Class Name</ListHeaderCell>
                <ListHeaderCell width="15%" onClick={handleSubjectClick}>Subject</ListHeaderCell>
                <ListHeaderCell width="15%">Teacher</ListHeaderCell>
                <ListHeaderCell width="15%">Schedule</ListHeaderCell>
                <ListHeaderCell width="10%">Students</ListHeaderCell>
                <ListHeaderCell width="10%">Status</ListHeaderCell>
                <ListHeaderCell width="10%">Actions</ListHeaderCell>
              </TableHeader>
              <TableBody>
                {filteredClasses.map(cls => (
                  <ClassTableRow key={cls.id}>
                    <ClassNameCell $color={cls.color}>{cls.name}</ClassNameCell>
                    <TableCell>
                      <SubjectBox onClick={handleSubjectClick}>
                        <span>{cls.subject}</span>
                      </SubjectBox>
                    </TableCell>
                    <TableCell>{cls.teacher}</TableCell>
                    <TableCell>{cls.schedule}<br />{cls.time}</TableCell>
                    <TableCell>{cls.students}</TableCell>
                    <TableCell>
                      <StatusBadge $status={cls.status}>
                        {cls.status === 'active' ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <ActionIconsContainer>
                        <ActionIcon onClick={() => handleEditClass(cls)}>
                          <FiEdit />
                        </ActionIcon>
                        <ActionIcon onClick={() => handleDeleteClass(cls.id)}>
                          <FiTrash2 />
                        </ActionIcon>
                      </ActionIconsContainer>
                    </TableCell>
                  </ClassTableRow>
                ))}
              </TableBody>
            </ClassTable>
          )}
        </>
      )}

      {/* Student Info Modal */}
      <AnimatePresence>
        {showStudentModal && (
          <ModalOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStudentModal(false)}
          >
            <ModalContent
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <div>
                  <ModalTitle>
                    {selectedSection ? `${selectedGrade}-${selectedSection} Students` : `Grade ${selectedGrade} Students`} 
                  </ModalTitle>
                  <ModalSubtitle>
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} in {selectedSection ? `${selectedGrade}-${selectedSection}` : `Grade ${selectedGrade}`}
                  </ModalSubtitle>
                </div>
                <ExportDataButton>
                  <FiDownload />
                  <span>Export Data</span>
                </ExportDataButton>
                <ModalClose onClick={() => setShowStudentModal(false)}>
                  <FiX />
                </ModalClose>
              </ModalHeader>

              <StudentSearchContainer>
                <SearchBox>
                  <FiSearch />
                  <input type="text" placeholder="Search students..." />
                </SearchBox>
                
                <FilterButtons>
                  <FilterButton>
                    <FiFilter />
                    <span>Filter</span>
                    <FiChevronDown />
                  </FilterButton>
                  
                  <FilterButton>
                    <span>Course Filter</span>
                    <FiChevronDown />
                  </FilterButton>
                </FilterButtons>
              </StudentSearchContainer>

              {filteredStudents.length > 0 ? (
                <StudentsTable>
                  <TableHead>
                    <tr>
                      <TableHeaderCell width="25%">Student</TableHeaderCell>
                      <TableHeaderCell width="10%">Grade</TableHeaderCell>
                      <TableHeaderCell width="20%">Courses</TableHeaderCell>
                      <TableHeaderCell width="10%">Attendance</TableHeaderCell>
                      <TableHeaderCell width="15%">Performance</TableHeaderCell>
                      <TableHeaderCell width="10%">Status</TableHeaderCell>
                      <TableHeaderCell width="10%">Actions</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id}>
                        <StudentCell>
                          <StudentInfoAvatar>
                            {student.name.charAt(0)}
                          </StudentInfoAvatar>
                          <StudentNameInfo>
                            <StudentNameRow>{student.name}</StudentNameRow>
                            <StudentEmailRow>{student.email}</StudentEmailRow>
                          </StudentNameInfo>
                        </StudentCell>
                        <TableCell>{`${student.grade}-${student.section}`}</TableCell>
                        <CourseCell>
                          {mockStudentCourses[student.id]?.map((course, index) => (
                            <CoursePill key={index}>
                              {course}
                            </CoursePill>
                          ))}
                        </CourseCell>
                        <AttendanceCell $value={student.attendance}>
                          {student.attendance}%
                        </AttendanceCell>
                        <TableCell>
                          <PerformanceBarContainer>
                            <PerformanceBarInTable 
                              $value={student.performance}
                              $color={
                                student.performance >= 85 ? '#10B981' : 
                                student.performance >= 70 ? '#F59E0B' : '#EF4444'
                              }
                            />
                            <PerformanceText>{student.performance}%</PerformanceText>
                          </PerformanceBarContainer>
                        </TableCell>
                        <StatusCell>
                          <StatusBadge $isActive={true}>
                            <FiCheckCircle />
                            <span>Active</span>
                          </StatusBadge>
                        </StatusCell>
                        <ActionsCell>
                          <ActionIcon title="View Details">
                            <FiEye />
                          </ActionIcon>
                          <ActionIcon title="Edit Student">
                            <FiEdit2 />
                          </ActionIcon>
                          <ActionIcon title="Email Student">
                            <FiMail />
                          </ActionIcon>
                        </ActionsCell>
                      </tr>
                    ))}
                  </tbody>
                </StudentsTable>
              ) : (
                <EmptyState>
                  <EmptyStateText>No students found.</EmptyStateText>
                </EmptyState>
              )}
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </ClassesContainer>
  );
};

// Sections Component
interface SectionsProps {
  sections: Array<{
    id: string;
    name: string;
    room: string;
    students: number;
    teacher: string;
    performance: number;
  }>;
  searchTerm: string;
  grade: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewStudents: (grade: string, section: string | null) => void;
}

const SectionsComponent: React.FC<SectionsProps> = ({ 
  sections, 
  searchTerm, 
  grade,
  onSearchChange,
  onViewStudents 
}) => {
  return (
    <>
      <FiltersContainer>
        <SearchAndFilters>
          <SearchContainer>
            <FiSearch />
            <SearchInput
              type="text"
              placeholder="Search sections..."
              value={searchTerm}
              onChange={onSearchChange}
            />
          </SearchContainer>
        </SearchAndFilters>
      </FiltersContainer>

      <SectionsGrid>
        {sections.map((section, index) => (
          <SectionCard 
            key={section.id}
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onViewStudents(grade, section.name.split('-')[1])}
          >
            <SectionLabel>{section.name}</SectionLabel>
            
            <SectionDetail>
              <SectionIcon>
                <FiMapPin />
              </SectionIcon>
              <span>{section.room}</span>
            </SectionDetail>
            
            <SectionRow>
              <SectionIconLabel>
                <FiUsers />
                <span>Students</span>
              </SectionIconLabel>
              <SectionValue>{section.students}</SectionValue>
            </SectionRow>
            
            <SectionRow>
              <SectionIconLabel>
                <FiUserCheck />
                <span>Teacher</span>
              </SectionIconLabel>
              <SectionValue>{section.teacher}</SectionValue>
            </SectionRow>
            
            <SectionPerformance>
              <SectionPerformanceLabel>Section Performance</SectionPerformanceLabel>
              <SectionPerformanceValue>{section.performance}%</SectionPerformanceValue>
              <SectionPerformanceBar>
                <SectionPerformanceFill 
                  $percentage={section.performance} 
                  $color={
                    section.performance >= 85 ? '#10B981' : 
                    section.performance >= 70 ? '#F59E0B' : '#EF4444'
                  } 
                />
              </SectionPerformanceBar>
            </SectionPerformance>
            
            <ViewStudentsButton>
              <span>View Students</span>
              <FiChevronRight />
            </ViewStudentsButton>
          </SectionCard>
        ))}
      </SectionsGrid>
    </>
  );
};

// GradeLevels Component
interface GradeLevelsProps {
  gradeLevels: typeof mockGradeLevels;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewSections: (grade: string) => void;
}

const GradeLevelsComponent: React.FC<GradeLevelsProps> = ({ 
  gradeLevels, 
  searchTerm, 
  onSearchChange,
  onViewSections
}) => {
  return (
    <>
      <FiltersContainer>
        <SearchAndFilters>
          <SearchContainer>
            <FiSearch />
            <SearchInput
              type="text"
              placeholder="Search grade levels..."
              value={searchTerm}
              onChange={onSearchChange}
            />
          </SearchContainer>
        </SearchAndFilters>
      </FiltersContainer>

      <GradeLevelsGrid>
        {gradeLevels.map((grade, index) => (
          <GradeLevelCard 
            key={grade.level}
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onViewSections(grade.level)}
          >
            <GradeLevelHeader>
              <GradeIcon>
                <FiBook />
              </GradeIcon>
              <GradeTitle>Grade {grade.level}</GradeTitle>
            </GradeLevelHeader>

            <GradeStats>
              <GradeStatItem>
                <GradeStatIcon>
                  <FiUsers />
                </GradeStatIcon>
                <GradeStatLabel>Students</GradeStatLabel>
                <GradeStatValue>{grade.students}</GradeStatValue>
              </GradeStatItem>

              <GradeStatItem>
                <GradeStatIcon>
                  <FiLayers />
                </GradeStatIcon>
                <GradeStatLabel>Sections</GradeStatLabel>
                <GradeStatValue>{grade.sections}</GradeStatValue>
              </GradeStatItem>
            </GradeStats>

            <GradePerformance>
              <GradePerformanceLabel>Average Performance</GradePerformanceLabel>
              <GradePerformanceValue>{grade.averagePerformance}%</GradePerformanceValue>
              <GradePerformanceBar>
                <GradePerformanceFill $percentage={grade.averagePerformance} />
              </GradePerformanceBar>
            </GradePerformance>

            <ViewSectionsButton>
              <span>View Sections</span>
              <FiChevronRight />
            </ViewSectionsButton>
          </GradeLevelCard>
        ))}
      </GradeLevelsGrid>
    </>
  );
};

// Modal styling
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  position: sticky;
  top: 0;
  background-color: ${props => props.theme.colors.background.primary};
  z-index: 10;
  
  > div:first-child {
    flex: 1;
  }
  
  > button:last-child {
    margin-left: 16px;
  }
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.primary[500]};
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 4px 0 0 0;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const SectionSelector = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
  margin-right: 16px;
`;

const SectionOptions = styled.div`
  display: flex;
  gap: 8px;
`;

interface SectionOptionProps {
  $isActive: boolean;
}

const SectionOption = styled.button<SectionOptionProps>`
  background-color: ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.background.primary};
  color: ${props => props.$isActive ? 'white' : props.theme.colors.text.primary};
  border: 1px solid ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.border.light};
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.background.light};
  }
`;

const StudentsList = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StudentCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StudentInfo = styled.div`
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "name contact"
      "performance performance"
      "subjects subjects"
      "actions actions";
  }
`;

const StudentNameSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  grid-area: name;
`;

const StudentAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[500]}, ${props => props.theme.colors.primary[700]});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const StudentName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const StudentSection = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.theme.colors.primary[400]};
  }
`;

const StudentContact = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  grid-area: contact;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  padding: 16px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  
  svg {
    color: ${props => props.theme.colors.primary[500]};
    font-size: 18px;
    background-color: ${props => props.theme.colors.primary[50]};
    padding: 8px;
    border-radius: 50%;
  }
`;

const StudentPerformance = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  grid-area: performance;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 12px;
  padding: 20px;
`;

const PerformanceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PerformanceLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const PerformanceValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
`;

interface PerformanceBarProps {
  $percentage: number;
  $type: 'attendance' | 'performance';
}

const PerformanceBar = styled.div`
  width: 100%;
  height: 10px;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const PerformanceFill = styled.div<PerformanceBarProps>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: ${props => {
    if (props.$type === 'attendance') {
      return `linear-gradient(90deg, ${props.theme.colors.success[400]}, ${props.theme.colors.success[600]})`;
    } else {
      return props.$percentage >= 85 
        ? `linear-gradient(90deg, ${props.theme.colors.success[400]}, ${props.theme.colors.success[600]})` 
        : props.$percentage >= 70 
          ? `linear-gradient(90deg, ${props.theme.colors.warning[400]}, ${props.theme.colors.warning[600]})` 
          : `linear-gradient(90deg, ${props.theme.colors.error[400]}, ${props.theme.colors.error[600]})`;
    }
  }};
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: width 0.5s ease;
`;

const StudentSubjects = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  grid-area: subjects;
`;

const SubjectPill = styled.div`
  background-color: ${props => props.theme.colors.background.light};
  color: ${props => props.theme.colors.text.secondary};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid ${props => props.theme.colors.border.light};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[50]};
    color: ${props => props.theme.colors.primary[600]};
    border-color: ${props => props.theme.colors.primary[200]};
  }
`;

const StudentActions = styled.div`
  display: flex;
  gap: 12px;
  grid-area: actions;
  justify-content: flex-end;
  margin-top: 8px;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  padding-top: 20px;
`;

interface ActionButtonProps {
  $isPrimary: boolean;
}

const ActionButton = styled.button<ActionButtonProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${props => props.$isPrimary ? '10px 20px' : '9px 18px'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isPrimary 
    ? `linear-gradient(135deg, ${props.theme.colors.primary[500]}, ${props.theme.colors.primary[600]})` 
    : props.theme.colors.background.light};
  color: ${props => props.$isPrimary ? 'white' : props.theme.colors.text.primary};
  border: 1px solid ${props => props.$isPrimary ? props.theme.colors.primary[500] : props.theme.colors.border.light};
  box-shadow: ${props => props.$isPrimary 
    ? '0 4px 10px rgba(79, 70, 229, 0.2)' 
    : '0 2px 4px rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    background-color: ${props => props.$isPrimary 
      ? props.theme.colors.primary[600] 
      : props.theme.colors.background.secondary};
    transform: translateY(-2px);
    box-shadow: ${props => props.$isPrimary 
      ? '0 6px 15px rgba(79, 70, 229, 0.25)' 
      : '0 4px 6px rgba(0, 0, 0, 0.08)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    font-size: 16px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  border: 1px dashed ${props => props.theme.colors.border.light};
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`;

// Styled Components
const ClassesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const PageDescription = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 4px 0 0 0;
`;

const AddClassButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[600]}, ${props => props.theme.colors.primary[700]});
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  svg {
    font-size: 18px;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
`;

const SearchAndFilters = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  min-width: 300px;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    min-width: unset;
    width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.neutral[300]};
  background-color: ${props => props.theme.colors.background.primary};
  font-size: 15px;
  color: ${props => props.theme.colors.text.primary};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const FilterDropdown = styled.div`
  position: relative;
  min-width: 150px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    min-width: unset;
    width: 100%;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    align-self: flex-end;
  }
`;

interface ViewButtonProps {
  $isActive: boolean;
}

const ViewButton = styled.button<ViewButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid ${props => props.$isActive 
    ? props.theme.colors.primary[500] 
    : props.theme.colors.neutral[300]};
  background-color: ${props => props.$isActive 
    ? props.theme.colors.primary[50] 
    : props.theme.colors.background.primary};
  color: ${props => props.$isActive 
    ? props.theme.colors.primary[600] 
    : props.theme.colors.text.secondary};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$isActive 
      ? props.theme.colors.primary[100] 
      : props.theme.colors.background.secondary};
  }
  
  svg {
    font-size: 20px;
  }
`;

const ClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

interface ClassCardProps {
  $color: string;
}

const ClassCard = styled.div<ClassCardProps>`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background-color: ${props => props.theme.colors.background.primary};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
`;

const CardHeader = styled.div<ClassCardProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: ${props => props.$color || props.theme.colors.primary[600]};
  color: white;
  position: relative;
`;

const ClassStatus = styled.div<ClassCardProps>`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$status === 'active' 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(107, 114, 128, 0.1)'};
  color: ${props => props.$status === 'active' 
    ? 'rgb(16, 185, 129)' 
    : 'rgb(107, 114, 128)'};
`;

const CardActions = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  svg {
    font-size: 20px;
  }
`;

const ActionsMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  width: 150px;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  margin-top: 8px;
`;

const ClassName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ClassSubject = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: fit-content;
`;

const SubjectBox = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[50]}, ${props => props.theme.colors.primary[100]});
  color: ${props => props.theme.colors.primary[700]};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.theme.colors.primary[200]};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: linear-gradient(135deg, ${props => props.theme.colors.primary[100]}, ${props => props.theme.colors.primary[200]});
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const TeacherInfo = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ClassDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
  flex-grow: 1;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.text.primary};
  font-size: 14px;
  
  svg {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 16px;
  }
`;

const DetailIcon = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 16px;
`;

const ClassTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: ${props => props.theme.colors.background.secondary};
`;

const TableBody = styled.tbody`
  background-color: ${props => props.theme.colors.background.primary};
`;

const ClassTableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${props => props.theme.colors.background.secondary};
  }
`;

const TableCell = styled.td`
  padding: 15px;
  text-align: left;
  vertical-align: middle;
  font-size: 14px;
  color: #4B5563;
  border-bottom: 1px solid #E5E7EB;
  
  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 12px;
  }
`;

const ActionIconsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionIcon = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
`;

// Define the correct props interface for StatusBadge
interface StatusBadgeProps {
  $isActive: boolean;
}

// Fix the StatusBadge component
const StatusBadge = styled.div<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$isActive 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(107, 114, 128, 0.1)'
  };
  color: ${props => props.$isActive 
    ? '#10B981' 
    : '#6B7280'
  };
  
  svg {
    font-size: 12px;
  }
`;

const GradeLevelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 16px;
`;

const GradeLevelCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.warning[300]};
    
    > div:last-child {
      background-color: ${props => props.theme.colors.warning[50]};
      color: ${props => props.theme.colors.warning[600]};
    }
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  
  &:hover::after {
    box-shadow: 0 0 0 2px ${props => props.theme.colors.warning[300]};
  }
`;

const GradeLevelHeader = styled.div`
  background-color: ${props => props.theme.colors.warning[500]};
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const GradeIcon = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const GradeTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const GradeStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
`;

const GradeStatItem = styled.div`
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
`;

const GradeStatIcon = styled.div`
  color: ${props => props.theme.colors.primary[500]};
  font-size: 20px;
`;

const GradeStatLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const GradeStatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const GradePerformance = styled.div`
  padding: 0 20px 20px;
`;

const GradePerformanceLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const GradePerformanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

interface PerformanceBarProps {
  $percentage: number;
}

const GradePerformanceBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
`;

const GradePerformanceFill = styled.div<PerformanceBarProps>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background-color: ${props => props.theme.colors.warning[500]};
  border-radius: 3px;
`;

const PageTitleWithBack = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.theme.colors.primary[500]};
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
  
  svg {
    font-size: 16px;
  }
`;

// Section view styling
const SectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 16px;
`;

const SectionCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.primary[300]};
    
    > div:last-child {
      background-color: ${props => props.theme.colors.primary[50]};
      color: ${props => props.theme.colors.primary[600]};
    }
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  
  &:hover::after {
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[300]};
  }
`;

const SectionDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  padding: 12px 20px;
  background-color: ${props => props.theme.colors.background.secondary};
`;

const SectionIcon = styled.div`
  color: ${props => props.theme.colors.primary[500]};
  display: flex;
  align-items: center;
`;

const SectionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const SectionIconLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  
  svg {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const SectionValue = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const SectionPerformance = styled.div`
  padding: 14px 20px;
`;

const SectionPerformanceLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const SectionPerformanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

interface SectionPerformanceBarProps {
  $percentage: number;
  $color: string;
}

const SectionPerformanceBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
`;

const SectionPerformanceFill = styled.div<SectionPerformanceBarProps>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background-color: ${props => props.$color};
  border-radius: 3px;
`;

const ExportDataButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  }
  
  svg {
    font-size: 16px;
    color: ${props => props.theme.colors.primary[500]};
  }
`;

// Add the new styled components for the table view
const StudentSearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  padding: 0 16px;
  flex: 1;
  min-width: 0;
  
  svg {
    color: ${props => props.theme.colors.text.secondary};
    margin-right: 8px;
  }
  
  input {
    border: none;
    background: none;
    height: 40px;
    width: 100%;
    font-size: 14px;
    color: ${props => props.theme.colors.text.primary};
    outline: none;
    
    &::placeholder {
      color: ${props => props.theme.colors.text.tertiary};
    }
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
  
  svg {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 14px;
  }
`;

const StudentsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: ${props => props.theme.colors.background.secondary};
  position: sticky;
  top: 0;
  z-index: 10;
`;

interface TableHeaderCellProps {
  width?: string;
}

const TableHeaderCell = styled.th<TableHeaderCellProps>`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  width: ${props => props.width || 'auto'};
`;

interface TableRowProps {
  $isHighlighted: boolean;
}

const TableRow = styled.tr<TableRowProps>`
  background-color: ${props => props.$isHighlighted ? props.theme.colors.background.secondary : props.theme.colors.background.primary};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.light};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border.light};
  }
`;

const TableCell = styled.td`
  padding: 15px;
  text-align: left;
  vertical-align: middle;
  font-size: 14px;
  color: #4B5563;
  border-bottom: 1px solid #E5E7EB;
  
  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 12px;
  }
`;

const ActionIconsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionIcon = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary};
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
`;

const StatusBadge = styled.div<ClassCardProps>`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$status === 'active' 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(107, 114, 128, 0.1)'};
  color: ${props => props.$status === 'active' 
    ? 'rgb(16, 185, 129)' 
    : 'rgb(107, 114, 128)'};
`;

const GradeLevelsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 16px;
`;

const GradeLevelCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.warning[300]};
    
    > div:last-child {
      background-color: ${props => props.theme.colors.warning[50]};
      color: ${props => props.theme.colors.warning[600]};
    }
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  
  &:hover::after {
    box-shadow: 0 0 0 2px ${props => props.theme.colors.warning[300]};
  }
`;

const GradeLevelHeader = styled.div`
  background-color: ${props => props.theme.colors.warning[500]};
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const GradeIcon = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const GradeTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const GradeStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
`;

const GradeStatItem = styled.div`
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
`;

const GradeStatIcon = styled.div`
  color: ${props => props.theme.colors.primary[500]};
  font-size: 20px;
`;

const GradeStatLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const GradeStatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const GradePerformance = styled.div`
  padding: 0 20px 20px;
`;

const GradePerformanceLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const GradePerformanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

interface PerformanceBarProps {
  $percentage: number;
}

const GradePerformanceBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
`;

const GradePerformanceFill = styled.div<PerformanceBarProps>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background-color: ${props => props.theme.colors.warning[500]};
  border-radius: 3px;
`;

const PageTitleWithBack = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.theme.colors.primary[500]};
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
  
  svg {
    font-size: 16px;
  }
`;

// Section view styling
const SectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 16px;
`;

const SectionCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.primary[300]};
    
    > div:last-child {
      background-color: ${props => props.theme.colors.primary[50]};
      color: ${props => props.theme.colors.primary[600]};
    }
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  
  &:hover::after {
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[300]};
  }
`;

const SectionDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  padding: 12px 20px;
  background-color: ${props => props.theme.colors.background.secondary};
`;

const SectionIcon = styled.div`
  color: ${props => props.theme.colors.primary[500]};
  display: flex;
  align-items: center;
`;

const SectionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
`;

const SectionIconLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  
  svg {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const SectionValue = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const SectionPerformance = styled.div`
  padding: 14px 20px;
`;

const SectionPerformanceLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const SectionPerformanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

interface SectionPerformanceBarProps {
  $percentage: number;
  $color: string;
}

const SectionPerformanceBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
`;

const SectionPerformanceFill = styled.div<SectionPerformanceBarProps>`
  height: 100%;
  width: ${props => props.$percentage}%;
  background-color: ${props => props.$color};
  border-radius: 3px;
`;

const ExportDataButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  }
  
  svg {
    font-size: 16px;
    color: ${props => props.theme.colors.primary[500]};
  }
`;

// Add the new styled components for the student table view with unique names
const StudentModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  position: sticky;
  top: 0;
  background-color: ${props => props.theme.colors.background.primary};
  z-index: 10;
  
  > div:first-child {
    flex: 1;
  }
  
  > button:last-child {
    margin-left: 16px;
  }
`;

const StudentModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.primary[500]};
`;

const StudentModalSubtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 4px 0 0 0;
`;

const StudentModalClose = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const StudentExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  }
  
  svg {
    font-size: 16px;
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const StudentSearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StudentSearchBox = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  padding: 0 16px;
  flex: 1;
  min-width: 0;
  
  svg {
    color: ${props => props.theme.colors.text.secondary};
    margin-right: 8px;
  }
  
  input {
    border: none;
    background: none;
    height: 40px;
    width: 100%;
    font-size: 14px;
    color: ${props => props.theme.colors.text.primary};
    outline: none;
    
    &::placeholder {
      color: ${props => props.theme.colors.text.tertiary};
    }
  }
`;

const StudentFilterButtons = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const StudentFilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
  
  svg {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 14px;
  }
`;

const StudentsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const StudentsTableHead = styled.thead`
  background-color: ${props => props.theme.colors.background.secondary};
  position: sticky;
  top: 0;
  z-index: 10;
`;

interface StudentsTableHeaderCellProps {
  width?: string;
}

const StudentsTableHeaderCell = styled.th<StudentsTableHeaderCellProps>`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  width: ${props => props.width || 'auto'};
`;

const StudentsTableBody = styled.tbody`
  background-color: ${props => props.theme.colors.background.primary};
`;

interface StudentsTableRowProps {
  $isHighlighted: boolean;
}

const StudentsTableRow = styled.tr<StudentsTableRowProps>`
  background-color: ${props => props.$isHighlighted ? props.theme.colors.background.secondary : props.theme.colors.background.primary};
  
  &:hover {
    background-color: ${props => props.theme.colors.background.light};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border.light};
  }
`;

const StudentCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 12px;
`;

interface StudentTableAvatarProps {
  small?: boolean;
}

const StudentTableAvatar = styled.div<StudentTableAvatarProps>`
  width: ${props => props.small ? '36px' : '48px'};
  height: ${props => props.small ? '36px' : '48px'};
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[500]}, ${props => props.theme.colors.primary[700]});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.small ? '14px' : '18px'};
  font-weight: 600;
  flex-shrink: 0;
`;

const StudentNameInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StudentNameRow = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const StudentEmailRow = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
`;

const StudentCourseCell = styled(TableCell)`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const StudentCoursePill = styled.div`
  background-color: ${props => props.theme.colors.primary[50]};
  color: ${props => props.theme.colors.primary[700]};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

interface StudentAttendanceCellProps {
  $value: number;
}

const StudentAttendanceCell = styled(TableCell)<StudentAttendanceCellProps>`
  color: ${props => {
    return props.$value >= 90 
      ? props.theme.colors.success[600]
      : props.$value >= 75
        ? props.theme.colors.warning[600]
        : props.theme.colors.error[600];
  }};
  font-weight: 600;
`;

const StudentPerformanceBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface StudentPerformanceBarProps {
  $value: number;
  $color: string;
}

const StudentPerformanceBar = styled.div<StudentPerformanceBarProps>`
  height: 6px;
  width: 100px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => `${props.$value}%`};
    background-color: ${props => props.$color};
    border-radius: 3px;
  }
`;

const StudentPerformanceText = styled.span`
  font-weight: 600;
  white-space: nowrap;
`;

const StudentStatusCell = styled(TableCell)`
  text-align: center;
`;

interface StudentStatusBadgeProps {
  $isActive: boolean;
}

const StudentStatusBadge = styled.div<StudentStatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$isActive 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(107, 114, 128, 0.1)'
  };
  color: ${props => props.$isActive 
    ? '#10B981' 
    : '#6B7280'
  };
  
  svg {
    font-size: 12px;
  }
`;

const StudentActionsCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
`;

const StudentActionIcon = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.background.secondary};
    color: ${props => props.theme.colors.primary[600]};
  }
`;

const StudentInfoAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[500]}, ${props => props.theme.colors.primary[700]});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const CourseCell = styled(TableCell)`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const CoursePill = styled.div`
  background-color: ${props => props.theme.colors.primary[50]};
  color: ${props => props.theme.colors.primary[700]};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

const PerformanceBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PerformanceBarInTable = styled.div<PerformanceBarProps>`
  height: 6px;
  width: 100px;
  background-color: ${props => props.theme.colors.background.light};
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => `${props.$value}%`};
    background-color: ${props => props.$color};
    border-radius: 3px;
  }
`;

const PerformanceText = styled.span`
  font-weight: 600;
  white-space: nowrap;
`;

const StatusCell = styled(TableCell)`
  text-align: center;
`;

const StatusBadge = styled.div<ClassCardProps>`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$status === 'active' 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(107, 114, 128, 0.1)'};
  color: ${props => props.$status === 'active' 
    ? 'rgb(16, 185, 129)' 
    : 'rgb(107, 114, 128)'};
`;

const ActionsCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
`;

export default Classes; 