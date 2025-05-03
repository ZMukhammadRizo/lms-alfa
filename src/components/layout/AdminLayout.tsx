import React, { ReactNode } from 'react';
import styled from 'styled-components';
import ThemeToggle from '../ThemeToggle';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <AdminLayoutContainer>
      <AdminSidebar>
        <SidebarLogo>LMS Admin</SidebarLogo>
        <nav>
          <SidebarLink href="/admin/dashboard">Dashboard</SidebarLink>
          <SidebarLink href="/admin/users">Users</SidebarLink>
          <SidebarLink href="/admin/courses">Courses</SidebarLink>
          <SidebarLink href="/admin/settings">Settings</SidebarLink>
        </nav>
      </AdminSidebar>
      <MainContent>
        <AdminHeader>
          <HeaderActions>
            <ThemeToggle />
            <UserMenu>Admin User</UserMenu>
          </HeaderActions>
        </AdminHeader>
        <ContentArea>{children}</ContentArea>
      </MainContent>
    </AdminLayoutContainer>
  );
};

const AdminLayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
`;

const AdminSidebar = styled.aside`
  width: 250px;
  background-color: ${({ theme }) => theme.isDark 
    ? theme.colors.background.tertiary 
    : theme.colors.primary[600]};
  color: ${({ theme }) => theme.colors.text.inverse};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.border.light};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const SidebarLogo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  padding: 0.5rem 0;
  color: ${({ theme }) => theme.colors.text.inverse};
  opacity: 0.9;
  
  &:hover {
    opacity: 1;
  }
`;

const SidebarLink = styled.a`
  display: block;
  padding: 0.75rem 1rem;
  color: ${({ theme }) => theme.colors.text.inverse};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  opacity: 0.8;
  
  &:hover {
    background-color: ${({ theme }) => theme.isDark 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)'};
    opacity: 1;
    transform: translateX(4px);
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background.primary};
`;

const AdminHeader = styled.header`
  height: 64px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserMenu = styled.div`
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.hover};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const ContentArea = styled.main`
  flex: 1;
  overflow: auto;
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background.primary};
`; 