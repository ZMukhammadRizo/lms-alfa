import React from 'react';
import styled from 'styled-components';
import { SubjectScheduleCard } from './index';

const SubjectScheduleCardDemo: React.FC = () => {
  return (
    <DemoContainer>
      <h2>Subject Schedule Card Demo</h2>
      <CardGrid>
        <SubjectScheduleCard 
          title="Physics Principles"
          time="9:00 AM - 10:00 AM"
          location="Lab 201"
          subjectColor="#06B6D4"
        />
        
        <SubjectScheduleCard 
          title="Algebra Fundamentals"
          time="11:00 AM - 12:00 PM"
          location="Room 101"
          subjectColor="#4F46E5"
        />
        
        <SubjectScheduleCard 
          title="Chemistry Lab"
          time="1:00 PM - 2:30 PM"
          location="Lab 202"
          subjectColor="#10B981"
        />
      </CardGrid>
    </DemoContainer>
  );
};

const DemoContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  
  h2 {
    margin-bottom: 20px;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

export default SubjectScheduleCardDemo; 