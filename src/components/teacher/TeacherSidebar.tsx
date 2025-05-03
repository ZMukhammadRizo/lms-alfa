import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiBook, FiCalendar, FiUsers, FiClipboard,
  FiSettings, FiChevronLeft, FiChevronRight,
  FiMenu, FiX, FiCheckSquare, FiMessageSquare, FiUser
} from 'react-icons/fi';
import LogoutButton from '../common/LogoutButton';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  onMobileToggle?: (isOpen: boolean) => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isCollapsed: boolean;
  onMobileClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, to, isCollapsed, onMobileClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleClick = () => {
    if (onMobileClick) {
      onMobileClick();
    }
  };

  return (
    <MenuItemContainer
      to={to}
      $isActive={isActive}
      $isCollapsed={isCollapsed}
      onClick={handleClick}
    >
      <IconWrapper>
        {icon}
      </IconWrapper>
      <AnimatePresence>
        {!isCollapsed && (
          <MenuLabel
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </MenuLabel>
        )}
      </AnimatePresence>
      {isActive && (
        <ActiveIndicator
          layoutId="activeIndicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </MenuItemContainer>
  );
};

const TeacherSidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, onMobileToggle }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  // Handle window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMobileToggle = () => {
    const newState = !isMobileOpen;
    setIsMobileOpen(newState);
    if (onMobileToggle) {
      onMobileToggle(newState);
    }
  };

  // Get user initials for profile display
  const getUserInitials = () => {
    if (!user || !user.username) return 'U';

    if (user.fullName) {
      const nameParts = user.fullName.split(' ');
      if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }

    return user.username.charAt(0).toUpperCase();
  };

  // Get full name display
  const getFullName = () => {
    return user?.fullName || user?.username || 'User';
  };

  // Get user role display
  const getUserRole = () => {
    return user?.role || 'User';
  };

  // Add scroll lock functionality
  useEffect(() => {
    if (isMobile) {
      if (isMobileOpen) {
        // Lock body scroll when mobile menu is open
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${window.scrollY}px`;
      } else {
        // Restore scroll when mobile menu is closed
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      // Cleanup scroll lock on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMobileOpen, isMobile]);

  // Update handleNavItemClick function
  const handleNavItemClick = () => {
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false);
      if (onMobileToggle) {
        onMobileToggle(false);
      }
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <MobileMenuButton 
          onClick={handleMobileToggle}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <FiX /> : <FiMenu />}
        </MobileMenuButton>
      )}

      <AnimatePresence mode="sync">
        {(isMobile ? isMobileOpen : true) && (
          <SidebarContainer
            $isCollapsed={isMobile ? false : isCollapsed}
            $isMobile={isMobile}
            as={motion.aside}
            initial={{ x: isMobile ? '-100%' : 0 }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <LogoContainer $isCollapsed={isMobile ? false : isCollapsed}>
              {isCollapsed && !isMobile ? (
                <SmallLogo>LMS</SmallLogo>
              ) : (
                <Logo>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Learning Management System
                  </motion.span>
                </Logo>
              )}

              {isMobile ? (
                <CloseButton onClick={handleMobileToggle}>
                  <FiX />
                </CloseButton>
              ) : (
                <ToggleButton onClick={toggleSidebar}>
                  {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </ToggleButton>
              )}
            </LogoContainer>

            <MenuContainer>
              <MenuSection>
                <MenuItem
                  icon={<FiHome />}
                  label="Dashboard"
                  to="/teacher/dashboard"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiBook />}
                  label="My Classes"
                  to="/teacher/classes"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiUsers />}
                  label="Students"
                  to="/teacher/students"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiClipboard />}
                  label="Assignments"
                  to="/teacher/assignments"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiCheckSquare />}
                  label="Grades"
                  to="/teacher/grades"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiCalendar />}
                  label="Schedule"
                  to="/teacher/schedule"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiMessageSquare />}
                  label="Messages"
                  to="/teacher/messages"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
              </MenuSection>

              <MenuSection>
                <AnimatePresence>
                  {(!isCollapsed || isMobile) && (
                    <SectionLabel
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      SYSTEM
                    </SectionLabel>
                  )}
                </AnimatePresence>

                <MenuItem
                  icon={<FiUser />}
                  label="Profile"
                  to="/teacher/profile"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
                <MenuItem
                  icon={<FiSettings />}
                  label="Settings"
                  to="/teacher/settings"
                  isCollapsed={isMobile ? false : isCollapsed}
                  onMobileClick={handleNavItemClick}
                />
              </MenuSection>
            </MenuContainer>

            <ProfileSection $isCollapsed={isMobile ? false : isCollapsed}>
              <ProfileImage>
                {getUserInitials()}
              </ProfileImage>
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <ProfileInfo
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProfileName>{getFullName()}</ProfileName>
                    <ProfileRole>Teacher</ProfileRole>
                  </ProfileInfo>
                )}
              </AnimatePresence>
              <SidebarLogoutButton
                variant="secondary"
                size="small"
                showText={false}
              />
            </ProfileSection>

            {isMobile && <MobileOverlay onClick={handleMobileToggle} />}
          </SidebarContainer>
        )}
      </AnimatePresence>

      {/* Background Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <Overlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleMobileToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
};

interface CollapsibleProps {
  $isCollapsed: boolean;
  $isMobile?: boolean;
}

const SidebarContainer = styled(motion.aside)<CollapsibleProps>`
  height: 100%;
  background: #FFFFFF;
  color: ${props => props.theme.colors.text.primary};
  box-shadow: ${props => props.theme.shadows.lg};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: ${props => props.theme.zIndices.modal};
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  -webkit-overflow-scrolling: touch;

  width: ${({ $isCollapsed, $isMobile }) => {
    if ($isMobile) return '85%';
    return $isCollapsed ? '80px' : '280px';
  }};
  max-width: ${({ $isMobile }) => $isMobile ? '360px' : 'none'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
    will-change: transform;
    border-radius: 0 16px 16px 0;
    border-right: 1px solid ${props => props.theme.colors.border.light};
  }
`;

const MobileOverlay = styled.div`
  display: none;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: ${props => props.theme.zIndices.overlay};
  touch-action: none;
  
  @supports (padding: max(0px)) {
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
  }
`;

const MobileMenuButton = styled.button`
  position: fixed;
  top: 15px;
  left: 15px;
  width: 46px;
  height: 46px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.theme.colors.border.light};
  cursor: pointer;
  font-size: 24px;
  z-index: ${props => props.theme.zIndices.sticky};
  box-shadow: ${props => props.theme.shadows.lg};
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  margin-top: env(safe-area-inset-top, 0);
  touch-action: manipulation;
  transition: all 0.2s ease;
  transform-origin: center;

  &:active {
    transform: scale(0.92);
    background: ${props => props.theme.colors.background.secondary};
  }

  &:hover {
    background: ${props => props.theme.colors.background.secondary};
    border-color: ${props => props.theme.colors.border.medium};
  }

  svg {
    width: 26px;
    height: 26px;
    transition: transform 0.3s ease;
  }

  @media (min-width: ${props => props.theme.breakpoints.lg}) {
    display: none;
  }

  @supports (-webkit-touch-callout: none) {
    /* iOS-specific padding */
    padding: 12px;
  }
`;

const LogoContainer = styled.div<CollapsibleProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => (props.$isCollapsed ? '0 0.5rem' : '0 1rem')};
  height: 60px;
  background: #FFFFFF;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    padding: 0 1rem;
  }
`;

const Logo = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary[600]};
  white-space: nowrap;
`;

const SmallLogo = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary[600]};
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background-color: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.primary[600]};
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};
  margin-left: 0.5rem;
  position: absolute;
  right: 10px;
  z-index: 10;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${props => props.theme.colors.primary[100]};
    color: ${props => props.theme.colors.primary[700]};
  }
`;

const CloseButton = styled(ToggleButton)`
  color: ${props => props.theme.colors.text.secondary};

  &:hover {
    color: ${props => props.theme.colors.accent.red};
  }
`;

const MenuContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing[4]} 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[4]};
  background: #FFFFFF;
  
  /* Improve scrolling on touch devices */
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding-bottom: env(safe-area-inset-bottom, 20px);
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
`;

const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[1]};
`;

const SectionLabel = styled(motion.div)`
  font-size: ${props => props.theme.spacing[3]};
  font-weight: 600;
  color: ${props => props.theme.colors.text.tertiary};
  padding: 0 ${props => props.theme.spacing[4]};
  margin-top: ${props => props.theme.spacing[5]};
  margin-bottom: ${props => props.theme.spacing[3]};
  letter-spacing: 0.5px;
`;

interface MenuItemContainerProps {
  $isActive: boolean;
  $isCollapsed: boolean;
}

const MenuItemContainer = styled(NavLink)<MenuItemContainerProps>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[4]};
  position: relative;
  text-decoration: none;
  color: ${props => props.$isActive
    ? props.theme.colors.primary[600]
    : props.theme.colors.text.secondary
  };
  font-weight: ${props => props.$isActive ? '600' : '400'};
  font-size: 1rem;
  transition: all 0.15s ease;
  background: transparent;

  &:hover {
    background-color: ${props => props.theme.colors.background.tertiary};
    color: ${props => props.$isActive
      ? props.theme.colors.primary[600]
      : props.theme.colors.text.primary
    };
  }

  ${({ $isCollapsed }) => $isCollapsed && css`
    justify-content: center;
    padding: ${props => props.theme.spacing[4]} 0;
  `}
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  min-width: 28px;
`;

const MenuLabel = styled(motion.span)`
  margin-left: ${props => props.theme.spacing[4]};
  white-space: nowrap;
  font-size: 1rem;
`;

const ActiveIndicator = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: ${props => props.theme.colors.primary[600]};
  border-radius: 0 ${props => props.theme.borderRadius.sm} ${props => props.theme.borderRadius.sm} 0;
`;

const ProfileSection = styled.div<CollapsibleProps>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing[4]};
  border-top: 1px solid ${props => props.theme.colors.border.light};
  gap: ${props => props.theme.spacing[3]};
  background: #FFFFFF;

  ${({ $isCollapsed }) => $isCollapsed && css`
    justify-content: center;
    padding: ${props => props.theme.spacing[3]} 0;
  `}
`;

const ProfileImage = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.primary[500]};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
`;

const ProfileInfo = styled(motion.div)`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const ProfileName = styled.div`
  font-weight: 600;
  font-size: ${props => props.theme.spacing[3.5]};
  color: ${props => props.theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProfileRole = styled.div`
  font-size: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.text.tertiary};
`;

const SidebarLogoutButton = styled(LogoutButton)`
  padding: 0.5rem;
  background: transparent;

  svg {
    color: ${props => props.theme.colors.text.secondary};
  }

  &:hover {
    svg {
      color: ${props => props.theme.colors.danger[500]};
    }
  }
`;

export default TeacherSidebar;