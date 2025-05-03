import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiBell, FiCheck, FiCheckCircle, FiChevronRight, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAnnouncements, Announcement } from '../../contexts/AnnouncementContext';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { announcements, unreadCount, markAsRead, markAllAsRead } = useAnnouncements();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const userRole = user?.role?.toLowerCase() || 'student';
  const basePath = `/${userRole}`;

  // Filter announcements based on user role
  const filteredAnnouncements = announcements.filter(
    announcement => announcement.target === 'all' || announcement.target === userRole
  );
  
  // Sort by date (newest first) and limit to 5 most recent
  const recentAnnouncements = [...filteredAnnouncements]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format the date
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <BellContainer ref={dropdownRef}>
      <BellIconButton onClick={() => setIsOpen(!isOpen)}>
        <FiBell size={20} />
        {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
      </BellIconButton>

      <AnimatePresence>
        {isOpen && (
          <NotificationsDropdown
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <NotificationsHeader>
              <NotificationsTitle>Notifications</NotificationsTitle>
              {unreadCount > 0 && (
                <MarkAllReadButton onClick={markAllAsRead}>
                  <FiCheckCircle size={14} />
                  <span>Mark all as read</span>
                </MarkAllReadButton>
              )}
            </NotificationsHeader>

            <NotificationsList>
              {recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((announcement) => (
                  <NotificationItem 
                    key={announcement.id} 
                    $unread={!announcement.isRead}
                    $important={announcement.important}
                  >
                    <NotificationContent onClick={() => markAsRead(announcement.id)}>
                      <NotificationTitle>{announcement.title}</NotificationTitle>
                      <NotificationMessage>{announcement.content.substring(0, 80)}...</NotificationMessage>
                      <NotificationMeta>
                        <NotificationTime>{formatDate(announcement.createdAt)}</NotificationTime>
                        {announcement.important && <ImportantTag>Important</ImportantTag>}
                      </NotificationMeta>
                    </NotificationContent>
                    {!announcement.isRead && (
                      <MarkReadButton onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(announcement.id);
                      }}>
                        <FiCheck size={16} />
                      </MarkReadButton>
                    )}
                  </NotificationItem>
                ))
              ) : (
                <EmptyNotifications>No notifications</EmptyNotifications>
              )}
            </NotificationsList>

            <ViewAllButton to={`${basePath}/announcements`}>
              <span>View all announcements</span>
              <FiChevronRight size={16} />
            </ViewAllButton>
          </NotificationsDropdown>
        )}
      </AnimatePresence>
    </BellContainer>
  );
};

const BellContainer = styled.div`
  position: relative;
`;

const BellIconButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background.tertiary || '#f1f5f9'};
    color: ${props => props.theme.colors.text.primary || '#334155'};
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: ${props => props.theme.colors.danger[500] || '#ef4444'};
  color: white;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const NotificationsDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background-color: ${props => props.theme.colors.background.primary || 'white'};
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
  border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
`;

const NotificationsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
`;

const NotificationsTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary || '#334155'};
`;

const MarkAllReadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: none;
  border: none;
  border-radius: 4px;
  color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary[50] || '#eff6ff'};
  }
`;

const NotificationsList = styled.div`
  max-height: 360px;
  overflow-y: auto;
`;

interface NotificationItemProps {
  $unread: boolean;
  $important: boolean;
}

const NotificationItem = styled.div<NotificationItemProps>`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
  background-color: ${props => props.$unread ? props.theme.colors.background.secondary || '#f8fafc' : 'transparent'};
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  
  ${props => props.$important && `
    border-left: 3px solid ${props.theme.colors.warning[500] || '#f59e0b'};
  `}

  &:hover {
    background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
  }
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.h4`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary || '#334155'};
`;

const NotificationMessage = styled.p`
  margin: 0 0 8px 0;
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  line-height: 1.5;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NotificationTime = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`;

const ImportantTag = styled.span`
  padding: 2px 6px;
  background-color: ${props => props.theme.colors.warning[100] || '#fef3c7'};
  color: ${props => props.theme.colors.warning[700] || '#b45309'};
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
`;

const MarkReadButton = styled.button`
  margin-left: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.background.tertiary || '#f1f5f9'};
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary[100] || '#dbeafe'};
    color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
  }
`;

const ViewAllButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: ${props => props.theme.colors.background.tertiary || '#f1f5f9'};
  color: ${props => props.theme.colors.text.primary || '#334155'};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
  }
`;

const EmptyNotifications = styled.div`
  padding: 32px 20px;
  text-align: center;
  color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
  font-size: 14px;
`;

export default NotificationBell; 