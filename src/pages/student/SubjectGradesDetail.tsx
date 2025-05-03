import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { getSubjectGradeDetails, SubjectGradeDetails, AssignmentGradeDetail } from '../../services/gradesService'; // Import the service function and types

// Placeholder type - replace with actual detailed grade structure
// interface GradeDetail {
//   assignmentTitle: string;
//   score: number | string;
//   maxScore?: number;
//   dateGraded: string;
// }

const SubjectGradesDetail: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const [grades, setGrades] = useState<AssignmentGradeDetail[]>([]); // Use imported type
  const [subjectName, setSubjectName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!subjectId || !user?.id) {
        setError('Missing subject ID or user information.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching details for subject: ${subjectId}, user: ${user.id}`);
        
        const details: SubjectGradeDetails = await getSubjectGradeDetails(user.id, subjectId);
        
        setSubjectName(details.subjectName);
        setGrades(details.grades);

      } catch (err) {
        console.error('Error fetching subject grade details:', err);
        setError('Failed to load grade details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [subjectId, user?.id]);

  if (loading) {
    return <LoadingContainer>Loading grade details...</LoadingContainer>;
  }

  if (error) {
    return <ErrorContainer>Error: {error}</ErrorContainer>;
  }

  return (
    <DetailContainer>
      <Header>
        <h1>Grades for {subjectName}</h1>
        <p>Subject ID: {subjectId}</p>
      </Header>
      
      <GradesTable>
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Score</th>
            <th>Date Graded</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.assignmentId}>
              <td>{grade.assignmentTitle}</td>
              <td>
                {grade.score}
                {grade.maxScore && ` / ${grade.maxScore}`}
              </td>
              <td>{grade.gradedAt}</td>
            </tr>
          ))}
          {grades.length === 0 && (
             <tr>
               <td colSpan={3}>No grades recorded for this subject yet.</td>
             </tr> 
          )}
        </tbody>
      </GradesTable>
    </DetailContainer>
  );
};

// Basic Styled Components (add more styling as needed)
const LoadingContainer = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.colors.danger[500]};
  background-color: ${props => props.theme.colors.danger[50]};
  border: 1px solid ${props => props.theme.colors.danger[200]};
  border-radius: 8px;
`;

const DetailContainer = styled.div`
  padding: 1rem;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  padding-bottom: 1rem;

  h1 {
    margin: 0 0 0.25rem 0;
    color: ${props => props.theme.colors.text.primary};
  }
  p {
      margin: 0;
      font-size: 0.9rem;
      color: ${props => props.theme.colors.text.secondary};
  }
`;

const GradesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid ${props => props.theme.colors.border.light};
  }

  th {
    background-color: ${props => props.theme.colors.background.secondary};
    font-weight: 600;
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
  }

  td {
      color: ${props => props.theme.colors.text.primary};
      font-size: 0.95rem;
  }
  
  tbody tr:last-child td {
      border-bottom: none;
  }
  
  tbody tr td[colspan="3"] {
      text-align: center;
      padding: 2rem;
      color: ${props => props.theme.colors.text.secondary};
  }
`;

export default SubjectGradesDetail; 