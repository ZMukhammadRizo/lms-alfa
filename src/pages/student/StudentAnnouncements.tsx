import React, { useState } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiFilter, FiSearch, FiInfo, FiEye } from 'react-icons/fi';
import { useAnnouncements } from '../../contexts/AnnouncementContext';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const StudentAnnouncements: React.FC = () => {
  const { announcements, markAsRead } = useAnnouncements();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter announcements for students only
  const studentAnnouncements = announcements.filter(announcement =>
    announcement.target === 'all' || announcement.target === 'student'
  );

  // Apply additional filters
  const filteredAnnouncements = studentAnnouncements
    .filter(announcement => {
      // Filter by read/unread
      if (filter === 'unread') {
        return !announcement.isRead;
      } else if (filter === 'important') {
        return announcement.important;
      }
      return true;
    })
    .filter(announcement => {
      // Filter by search term
      if (searchTerm) {
        return (
          announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Container>
      <Header>
        <div>
          <Title>Announcements</Title>
          <Description>View important announcements from administration</Description>
        </div>
      </Header>

      <ToolBar>
        <SearchBar>
          <FiSearch size={18} />
          <SearchInput
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>

        <FilterContainer>
          <FiFilter size={16} />
          <FilterSelect
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Announcements</option>
            <option value="unread">Unread</option>
            <option value="important">Important</option>
          </FilterSelect>
        </FilterContainer>
      </ToolBar>

      <AnnouncementsList>
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              $important={announcement.important}
              $unread={!announcement.isRead}
              onClick={() => markAsRead(announcement.id)}
            >
              <AnnouncementHeader>
                <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                <HeaderBadges>
                  {announcement.important && (
                    <ImportantBadge>
                      <FiAlertTriangle size={14} />
                      <span>Important</span>
                    </ImportantBadge>
                  )}
                  {!announcement.isRead && (
                    <UnreadBadge>
                      <FiEye size={14} />
                      <span>New</span>
                    </UnreadBadge>
                  )}
                </HeaderBadges>
              </AnnouncementHeader>

              <AnnouncementBody>
                {announcement.content}
              </AnnouncementBody>

              <AnnouncementMeta>
                <MetaInfo>
                  <span>Posted: {format(new Date(announcement.createdAt), 'MMM d, yyyy')}</span>
                  <Divider />
                  <span>By: {announcement.createdBy.name}</span>
                </MetaInfo>
              </AnnouncementMeta>
            </AnnouncementItem>
          ))
        ) : (
          <EmptyState>
            <FiInfo size={48} />
            <EmptyStateTitle>No announcements found</EmptyStateTitle>
            <EmptyStateDescription>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'There are no announcements for you at this time'}
            </EmptyStateDescription>
          </EmptyState>
        )}
      </AnnouncementsList>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary || '#334155'};
`;

const Description = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  margin: 8px 0 0 0;
`;

const ToolBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
  border-radius: 6px;
  padding: 0 12px;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  padding: 10px 0;
  flex: 1;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary || '#334155'};

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
  border-radius: 6px;
  padding: 0 12px;
`;

const FilterSelect = styled.select`
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary || '#334155'};
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
  }
`;

const AnnouncementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface AnnouncementItemProps {
  $important: boolean;
  $unread: boolean;
}

const AnnouncementItem = styled.div<AnnouncementItemProps>`
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};
  border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
  padding: 20px;
  cursor: pointer;

  ${props => props.$important && `
    border-left: 4px solid ${props.theme.colors.warning[500] || '#f59e0b'};
  `}

  ${props => props.$unread && `
    background-color: ${props.theme.colors.background.secondary || '#f8fafc'};
  `}

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const AnnouncementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const HeaderBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const AnnouncementTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary || '#334155'};
`;

const ImportantBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: ${props => props.theme.colors.warning[100] || '#fef3c7'};
  color: ${props => props.theme.colors.warning[700] || '#b45309'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const UnreadBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: ${props => props.theme.colors.primary[100] || '#dbeafe'};
  color: ${props => props.theme.colors.primary[700] || '#1d4ed8'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const AnnouncementBody = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  margin-bottom: 16px;
  white-space: pre-line;
`;

const AnnouncementMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`;

const Divider = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
  border-radius: 8px;
  color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`;

const EmptyStateTitle = styled.h3`
  margin: 16px 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary || '#334155'};
`;

const EmptyStateDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  max-width: 400px;
  margin: 0 auto;
`;

export default StudentAnnouncements;