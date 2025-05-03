import React from 'react';
import styled from 'styled-components';
import { FiClock, FiMapPin } from 'react-icons/fi';

interface SubjectScheduleCardProps {
  title: string;
  time: string;
  location: string;
  subjectColor?: string;
  className?: string;
}

const SubjectScheduleCard: React.FC<SubjectScheduleCardProps> = ({
  title,
  time,
  location,
  subjectColor = '#06B6D4', // Default cyan color
  className,
}) => {
  return (
    <CardContainer className={className}>
      <ColorAccent style={{ backgroundColor: subjectColor }} />
      <CardContent>
        <CardTitle>{title}</CardTitle>
        <CardDetail>
          <FiClock size={14} />
          <span>{time}</span>
        </CardDetail>
        <CardDetail>
          <FiMapPin size={14} />
          <span>{location}</span>
        </CardDetail>
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled.div`
  position: relative;
  padding: 12px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: visible;
`;

const ColorAccent = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
`;

const CardContent = styled.div`
  padding-left: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const CardDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6B7280;
`;

export default SubjectScheduleCard; 