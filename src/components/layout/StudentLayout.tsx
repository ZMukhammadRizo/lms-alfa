import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import BaseLayout from './BaseLayout';

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'My Courses', path: '/student/courses' },
    { label: 'Schedule', path: '/student/schedule' },
    { label: 'Assignments', path: '/student/assignments' },
    { label: 'Grades', path: '/student/grades' },
  ];

  return (
    <BaseLayout title={title} subtitle={subtitle} actions={actions}>
      <StudentContainer>
        <Navigation>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $isActive={location.pathname === item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </Navigation>
        <Content>{children}</Content>
      </StudentContainer>
    </BaseLayout>
  );
};

const StudentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  overflow-x: auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-wrap: nowrap;
    padding: 0.5rem;
    margin: 0 -1rem;
    border-radius: 0;
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  padding: 0.5rem 1rem;
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary.main : theme.colors.text.primary};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  white-space: nowrap;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.hover};
  }
  
  ${({ $isActive, theme }) =>
    $isActive &&
    `
    background-color: ${theme.colors.primary.light};
    font-weight: 500;
  `}
`;

const Content = styled.div`
  min-height: 400px;
`;

export default StudentLayout; 