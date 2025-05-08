import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import Timetables from '../admin/Timetables';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

const TeacherSchedule: React.FC = () => {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Set the teacher ID once the user context is loaded
    if (user?.id) {
      console.log("Teacher ID for schedule:", user.id);
      setTeacherId(user.id);
    } else {
      console.log("No teacher ID available from user context");
    }
  }, [user]);

  return (
    <Container>
      {/* Pass the teacher ID to Timetables component to filter only their classes */}
      {/* Set readOnly to true to prevent teachers from adding, editing, or deleting lessons */}
      <Timetables loggedInTeacherId={teacherId} readOnly={true} />
    </Container>
  );
};

export default TeacherSchedule; 