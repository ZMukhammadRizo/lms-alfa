import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ExternalLink, Loader, AlertCircle } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import AttendanceReportModal from './AttendanceReportModal';

interface AttendanceData {
  status: string;
  count: number;
  color: string;
}

interface AttendanceOverviewProps {
  className?: string;
}

// Animation keyframes
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled components
const CardContainer = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[6]};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border.light};
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
  }

  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing[4]};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing[6]};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing[3]};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[1]};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const DateDisplay = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
`;

const FullReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  background: transparent;
  border: 1px solid ${props => props.theme.colors.primary[500]};
  color: ${props => props.theme.colors.primary[500]};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary[500]};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ChartContainer = styled.div`
  height: 280px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing[4]};

  @media (max-width: 768px) {
    height: 220px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
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
  height: 300px;
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
  height: 300px;
  gap: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${props => props.theme.spacing[4]};
  margin-top: ${props => props.theme.spacing[4]};

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing[3]};
  }
`;

const StatItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isTotal'
})<{ color: string; isTotal?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[2]};
  background-color: ${props => props.isTotal 
    ? props.theme.colors.background.light 
    : `${props.color}10`
  };
  border: 1px solid ${props => props.isTotal 
    ? props.theme.colors.border.light 
    : `${props.color}30`
  };
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing[1]};
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
`;

const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const CenterText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
`;

const CenterValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing[1]};
`;

const CenterLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
`;

// Custom label component for the pie chart
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null; // Don't show labels for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Function to translate attendance status
const getTranslatedStatus = (status: string, t: any): string => {
  const statusMap: Record<string, string> = {
    present: t('attendance.present'),
    absent: t('attendance.absent'),
    late: t('attendance.late'),
    excused: t('attendance.excused'),
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ className }) => {
  const { t } = useTranslation();
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      const { data, error: supabaseError } = await supabase
        .from('daily_attendance')
        .select('status')
        .eq('noted_for', today);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Count statuses
      const statusCounts: Record<string, number> = {};
      
      if (data && data.length > 0) {
        data.forEach((record) => {
          const status = record.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
      }

      // Define colors for each status
      const statusColors: Record<string, string> = {
        present: '#10b981', // Green
        absent: '#ef4444', // Red  
        late: '#f59e0b', // Amber/Orange
        excused: '#6366f1', // Indigo
        unknown: '#6b7280', // Gray
      };

      // Convert to chart data format
      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status,
        count,
        color: statusColors[status] || statusColors.unknown,
      }));

      setAttendanceData(chartData);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleFullReportClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const totalStudents = attendanceData.reduce((sum, item) => sum + item.count, 0);

  // Format today's date based on selected language
  const formatDate = (date: Date) => {
    const locale = {
      'en': 'en-US',
      'uz': 'uz-UZ', 
      'ru': 'ru-RU'
    }[t('language.code')] || 'en-US';
    
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const today = new Date();
  const formattedDate = formatDate(today);

  if (loading) {
    return (
      <CardContainer className={className}>
        <Header>
          <HeaderLeft>
            <Title>{t('dashboard.attendanceOverview')}</Title>
            <DateDisplay>{formattedDate}</DateDisplay>
          </HeaderLeft>
          <FullReportButton disabled>
            <span>{t('dashboard.fullReport')}</span>
            <ExternalLink />
          </FullReportButton>
        </Header>
        <LoadingContainer>
          <LoadingSpinner>
            <Loader size={24} />
          </LoadingSpinner>
          <span>{t('common.loading')}</span>
        </LoadingContainer>
      </CardContainer>
    );
  }

  if (error) {
    return (
      <CardContainer className={className}>
        <Header>
          <HeaderLeft>
            <Title>{t('dashboard.attendanceOverview')}</Title>
            <DateDisplay>{formattedDate}</DateDisplay>
          </HeaderLeft>
          <FullReportButton onClick={handleFullReportClick}>
            <span>{t('dashboard.fullReport')}</span>
            <ExternalLink />
          </FullReportButton>
        </Header>
        <ErrorContainer>
          <AlertCircle size={32} />
          <ErrorMessage>
            {t('errors.loadingFailed')}
            <br />
            {error}
          </ErrorMessage>
        </ErrorContainer>
      </CardContainer>
    );
  }

  if (attendanceData.length === 0) {
    return (
      <CardContainer className={className}>
        <Header>
          <HeaderLeft>
            <Title>{t('dashboard.attendanceOverview')}</Title>
            <DateDisplay>{formattedDate}</DateDisplay>
          </HeaderLeft>
          <FullReportButton onClick={handleFullReportClick}>
            <span>{t('dashboard.fullReport')}</span>
            <ExternalLink />
          </FullReportButton>
        </Header>
        <NoDataContainer>
          <AlertCircle size={32} />
          <span>{t('errors.noDataAvailable')}</span>
        </NoDataContainer>
      </CardContainer>
    );
  }

  return (
    <>
      <CardContainer className={className}>
        <Header>
          <HeaderLeft>
            <Title>{t('dashboard.attendanceOverview')}</Title>
            <DateDisplay>{formattedDate}</DateDisplay>
          </HeaderLeft>
          <FullReportButton onClick={handleFullReportClick}>
            <span>{t('dashboard.fullReport')}</span>
            <ExternalLink />
          </FullReportButton>
        </Header>
        
        <ChartContainer>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={45}
                  fill="#8884d8"
                  dataKey="count"
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <CenterText>
              <CenterValue>{totalStudents}</CenterValue>
              <CenterLabel>{t('dashboard.students')}</CenterLabel>
            </CenterText>
          </ChartWrapper>
        </ChartContainer>

        <StatsContainer>
          {attendanceData.map((item) => (
            <StatItem key={item.status} color={item.color}>
              <StatIcon color={item.color} />
              <StatLabel>{getTranslatedStatus(item.status, t)}</StatLabel>
              <StatValue>{item.count}</StatValue>
            </StatItem>
          ))}
          <StatItem color="#64748b" isTotal>
            <StatIcon color="#64748b" />
            <StatLabel>{t('attendance.total')}</StatLabel>
            <StatValue>{totalStudents}</StatValue>
          </StatItem>
        </StatsContainer>
      </CardContainer>

      <AttendanceReportModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default AttendanceOverview; 