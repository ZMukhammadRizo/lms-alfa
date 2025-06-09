import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Users, UserCheck, UserX, Clock, BookOpen, Loader, AlertCircle } from 'react-feather';
import { supabase } from '../../lib/supabaseClient';

interface ClassAttendanceData {
  classId: string;
  className: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface AttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    transform: translate(-50%, -60%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled components
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.lg};
  border: 1px solid ${props => props.theme.colors.border.light};
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  animation: ${slideIn} 0.3s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing[6]};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing[2]};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.secondary};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background.light};
    color: ${props => props.theme.colors.text.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  padding: ${props => props.theme.spacing[6]};
  max-height: 60vh;
  overflow-y: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing[8]};
  gap: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.text.secondary};
`;

const LoadingSpinner = styled.div`
  animation: ${spin} 1s linear infinite;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing[8]};
  gap: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.danger[500]};
  text-align: center;
`;

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 0.875rem;
`;

const NoDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing[8]};
  gap: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`;

const ClassCard = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[5]};
  margin-bottom: ${props => props.theme.spacing[4]};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${props => props.theme.shadows.sm};
    border-color: ${props => props.theme.colors.primary[300]};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ClassHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[4]};
  gap: ${props => props.theme.spacing[3]};
`;

const ClassName = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
`;

const TotalStudents = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  background-color: ${props => props.theme.colors.primary[50]};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.primary[700]};
`;

const AttendanceStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing[3]};
`;

const StatItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.$color}15;
  border: 1px solid ${props => props.$color}30;
`;

const StatIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.$color};
  color: white;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatText = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 2px;
`;

const StatValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[500]}, ${props => props.theme.colors.primary[600]});
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[5]};
  margin-bottom: ${props => props.theme.spacing[6]};
  color: white;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing[3]} 0;
  font-size: 1.125rem;
  font-weight: 600;
`;

const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: ${props => props.theme.spacing[4]};
`;

const SummaryStat = styled.div`
  text-align: center;
`;

const SummaryStatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing[1]};
`;

const SummaryStatLabel = styled.div`
  font-size: 0.875rem;
  opacity: 0.9;
`;

const AttendanceReportModal: React.FC<AttendanceReportModalProps> = ({ isOpen, onClose }) => {
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceData();
    }
  }, [isOpen]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch attendance data with class information
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('daily_attendance')
        .select(`
          class_id,
          status,
          classes!inner(id, classname)
        `)
        .eq('noted_for', today);

      if (attendanceError) {
        throw new Error(attendanceError.message);
      }

      // Fetch all students grouped by class to get total counts
      const { data: allStudents, error: studentsError } = await supabase
        .from('classstudents')
        .select(`
          classid,
          classes!inner(id, classname)
        `);

      if (studentsError) {
        throw new Error(studentsError.message);
      }

      // Process the data to group by class
      const classMap = new Map<string, ClassAttendanceData>();

      // Initialize classes with total student counts
      allStudents?.forEach((student: any) => {
        const classId = student.classid;
        const className = student.classes?.classname || 'Unknown Class';
        
        if (!classMap.has(classId)) {
          classMap.set(classId, {
            classId,
            className,
            totalStudents: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          });
        }
        
        const classData = classMap.get(classId)!;
        classData.totalStudents++;
      });

      // Add attendance counts
      attendanceRecords?.forEach((record: any) => {
        const classId = record.class_id;
        const status = record.status || 'absent';
        const className = record.classes?.classname || 'Unknown Class';

        if (!classMap.has(classId)) {
          classMap.set(classId, {
            classId,
            className,
            totalStudents: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          });
        }

        const classData = classMap.get(classId)!;
        
        switch (status.toLowerCase()) {
          case 'present':
            classData.present++;
            break;
          case 'absent':
            classData.absent++;
            break;
          case 'late':
            classData.late++;
            break;
          case 'excused':
            classData.excused++;
            break;
          default:
            classData.absent++;
            break;
        }
      });

      // Convert map to array and sort by class name
      const classAttendanceData = Array.from(classMap.values())
        .filter(classData => classData.totalStudents > 0)
        .sort((a, b) => a.className.localeCompare(b.className));

      setAttendanceData(classAttendanceData);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate totals for summary
  const totals = attendanceData.reduce(
    (acc, classData) => ({
      totalStudents: acc.totalStudents + classData.totalStudents,
      present: acc.present + classData.present,
      absent: acc.absent + classData.absent,
      late: acc.late + classData.late,
      excused: acc.excused + classData.excused,
    }),
    { totalStudents: 0, present: 0, absent: 0, late: 0, excused: 0 }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <UserCheck />;
      case 'absent':
        return <UserX />;
      case 'late':
        return <Clock />;
      case 'excused':
        return <BookOpen />;
      default:
        return <Users />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#10b981'; // Green
      case 'absent':
        return '#ef4444'; // Red
      case 'late':
        return '#f59e0b'; // Orange
      case 'excused':
        return '#6366f1'; // Indigo
      default:
        return '#6b7280'; // Gray
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>
            <Users size={24} />
            Daily Attendance Report
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading && (
            <LoadingContainer>
              <LoadingSpinner>
                <Loader size={24} />
              </LoadingSpinner>
              <span>Loading attendance data...</span>
            </LoadingContainer>
          )}

          {error && (
            <ErrorContainer>
              <AlertCircle size={32} />
              <ErrorMessage>
                Failed to load attendance data
                <br />
                {error}
              </ErrorMessage>
            </ErrorContainer>
          )}

          {!loading && !error && attendanceData.length === 0 && (
            <NoDataContainer>
              <AlertCircle size={32} />
              <span>No attendance data found for today</span>
            </NoDataContainer>
          )}

          {!loading && !error && attendanceData.length > 0 && (
            <>
              {/* Summary Card */}
              <SummaryCard>
                <SummaryTitle>Overall Summary</SummaryTitle>
                <SummaryStats>
                  <SummaryStat>
                    <SummaryStatValue>{totals.totalStudents}</SummaryStatValue>
                    <SummaryStatLabel>Total Students</SummaryStatLabel>
                  </SummaryStat>
                  <SummaryStat>
                    <SummaryStatValue>{totals.present}</SummaryStatValue>
                    <SummaryStatLabel>Present</SummaryStatLabel>
                  </SummaryStat>
                  <SummaryStat>
                    <SummaryStatValue>{totals.absent}</SummaryStatValue>
                    <SummaryStatLabel>Absent</SummaryStatLabel>
                  </SummaryStat>
                  <SummaryStat>
                    <SummaryStatValue>{totals.late}</SummaryStatValue>
                    <SummaryStatLabel>Late</SummaryStatLabel>
                  </SummaryStat>
                  <SummaryStat>
                    <SummaryStatValue>{totals.excused}</SummaryStatValue>
                    <SummaryStatLabel>Excused</SummaryStatLabel>
                  </SummaryStat>
                </SummaryStats>
              </SummaryCard>

              {/* Class-wise breakdown */}
              {attendanceData.map((classData) => (
                <ClassCard key={classData.classId}>
                  <ClassHeader>
                    <ClassName>
                      <BookOpen size={20} />
                      {classData.className}
                    </ClassName>
                    <TotalStudents>
                      <Users size={16} />
                      {classData.totalStudents} Students
                    </TotalStudents>
                  </ClassHeader>

                  <AttendanceStats>
                    <StatItem $color={getStatusColor('present')}>
                      <StatIcon $color={getStatusColor('present')}>
                        {getStatusIcon('present')}
                      </StatIcon>
                      <StatText>
                        <StatLabel>Present</StatLabel>
                        <StatValue>{classData.present}</StatValue>
                      </StatText>
                    </StatItem>

                    <StatItem $color={getStatusColor('absent')}>
                      <StatIcon $color={getStatusColor('absent')}>
                        {getStatusIcon('absent')}
                      </StatIcon>
                      <StatText>
                        <StatLabel>Absent</StatLabel>
                        <StatValue>{classData.absent}</StatValue>
                      </StatText>
                    </StatItem>

                    <StatItem $color={getStatusColor('late')}>
                      <StatIcon $color={getStatusColor('late')}>
                        {getStatusIcon('late')}
                      </StatIcon>
                      <StatText>
                        <StatLabel>Late</StatLabel>
                        <StatValue>{classData.late}</StatValue>
                      </StatText>
                    </StatItem>

                    <StatItem $color={getStatusColor('excused')}>
                      <StatIcon $color={getStatusColor('excused')}>
                        {getStatusIcon('excused')}
                      </StatIcon>
                      <StatText>
                        <StatLabel>Excused</StatLabel>
                        <StatValue>{classData.excused}</StatValue>
                      </StatText>
                    </StatItem>
                  </AttendanceStats>
                </ClassCard>
              ))}
            </>
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default AttendanceReportModal; 