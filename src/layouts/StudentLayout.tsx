import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/admin/Header';
import Footer from '../components/admin/Footer';
import StudentSidebar from '../components/student/StudentSidebar';

const StudentLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMobileToggle = (isOpen: boolean) => {
    setMobileSidebarOpen(isOpen);
  };

  return (
    <StudentLayoutContainer>
      <StudentSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        onMobileToggle={handleMobileToggle}
      />
      <MainContent $isCollapsed={isSidebarCollapsed} $isMobileOpen={isMobileSidebarOpen}>
        <Header />
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
        <Footer />
      </MainContent>
    </StudentLayoutContainer>
  );
};

const StudentLayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.colors.background.primary};
`;

interface MainContentProps {
  $isCollapsed: boolean;
  $isMobileOpen: boolean;
}

const MainContent = styled.div<MainContentProps>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  transition: margin-left ${props => props.theme.transition.normal} ease, 
              filter ${props => props.theme.transition.normal},
              opacity ${props => props.theme.transition.normal};
  z-index: ${props => props.theme.zIndices.base};
  position: relative;
  margin-left: ${({ $isCollapsed }) => ($isCollapsed ? '80px' : '280px')};
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    margin-left: 0;
    filter: ${({ $isMobileOpen }) => $isMobileOpen ? 'blur(4px)' : 'none'};
    opacity: ${({ $isMobileOpen }) => $isMobileOpen ? 0.7 : 1};
    pointer-events: ${({ $isMobileOpen }) => $isMobileOpen ? 'none' : 'auto'};
  }
`;

const ContentWrapper = styled.main`
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background.secondary};
`;

export default StudentLayout; 