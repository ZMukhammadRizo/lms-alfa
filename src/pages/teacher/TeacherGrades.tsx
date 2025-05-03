import React from 'react';
import { Navigate } from 'react-router-dom';

const TeacherGrades: React.FC = () => {
  // Redirect to the modular grades interface
  return <Navigate to="/teacher/grades/levels" replace />;
};

export default TeacherGrades; 