import React, { useState } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle, FiFilter, FiSearch, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnnouncements } from '../../contexts/AnnouncementContext';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Announcement {
	id?: string
	title: string
	content: string
	isImportant: boolean
	targetAudience: string
	created_by: string
	created_at: string
	photo_url?: string
	video_url?: string
  [key: string]: any
}

// Component to create or edit an announcement
const AnnouncementForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialData?: Omit<Announcement,  'createdAt'> | null;
}> = ({ isOpen, onClose, initialData }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Omit<Announcement, 'createdAt'>>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    created_by: user?.id || '',
    isImportant: initialData?.isImportant || false,
    targetAudience: initialData?.targetAudience || 'all',
    created_at: initialData?.created_at || new Date().toISOString()
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // if (initialData && initialData.id) {
    //   updateAnnouncement(initialData.id as string, formData);
    // } else {
    //   createAnnouncement(formData);
    // }

    // onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <ModalHeader>
              <h2>{initialData ? 'Edit Announcement' : 'Create Announcement'}</h2>
              <CloseButton onClick={onClose}>
                <FiX size={24} />
              </CloseButton>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Announcement title"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Announcement content"
                  rows={6}
                  required
                />
              </FormGroup>

              <FormRow>
                <FormGroup style={{ flex: 1 }}>
                  <Label htmlFor="target">Target Audience</Label>
                  <Select
                    id="target"
                    name="target"
                    value={formData.targetAudience}
                    onChange={handleChange}
                  >
                    <option value="all">All Users</option>
                    <option value="admin">Administrators Only</option>
                    <option value="teacher">Teachers Only</option>
                    <option value="student">Students Only</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <CheckboxLabel>
                    <Checkbox
                      type="checkbox"
                      name="isImportant"
                      checked={formData.isImportant}
                      onChange={handleCheckboxChange}
                    />
                    <span>Mark as Important</span>
                  </CheckboxLabel>
                </FormGroup>
              </FormRow>

              <ButtonGroup>
                <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
                <SubmitButton type="submit">
                  {initialData ? 'Update' : 'Publish'} Announcement
                </SubmitButton>
              </ButtonGroup>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

// Main component
const AdminAnnouncements: React.FC = () => {

  const { announcements, deleteAnnouncement, markAsRead } = useAnnouncements();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle editing an announcement
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  // Handle deleting an announcement
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(id);
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements
    .filter(announcement => {
      // Filter by target audience
      if (filter !== 'all') {
        return announcement.targetAudience === filter;
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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Container>
      <Header>
        <div>
          <Title>Announcements</Title>
          <Description>Create and manage announcements for all users</Description>
        </div>
        <CreateButton onClick={() => {
          setSelectedAnnouncement(null);
          setIsFormOpen(true);
        }}>
          <FiPlus size={18} />
          <span>New Announcement</span>
        </CreateButton>
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
            <option value="all">All Audiences</option>
            <option value="admin">Administrators</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </FilterSelect>
        </FilterContainer>
      </ToolBar>

      <AnnouncementsList>
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              $important={announcement.isImportant}
            >
              {announcement.photo_url && (
                <AnnouncementImageWrapper>
                  <AnnouncementImage 
                    src={announcement.photo_url} 
                    alt={announcement.title} 
                  />
                </AnnouncementImageWrapper>
              )}
              <AnnouncementContent onClick={() => markAsRead(announcement.id)}>
                <AnnouncementHeader>
                  <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                  {announcement.isImportant && (
                    <ImportantBadge>
                      <FiAlertTriangle size={14} />
                      <span>Important</span>
                    </ImportantBadge>
                  )}
                </AnnouncementHeader>

                <AnnouncementBody>
                  {announcement.content}
                </AnnouncementBody>

                <AnnouncementMeta>
                  <MetaInfo>
                    <span>Posted: {format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                    <Divider />
                    <AudienceBadge $audience={announcement.targetAudience}>
                      {announcement.targetAudience === 'all' ? 'All Users' :
                       announcement.targetAudience === 'admin' ? 'Administrators' :
                       announcement.targetAudience === 'teacher' ? 'Teachers' : 'Students'}
                    </AudienceBadge>
                  </MetaInfo>

                  <ActionButtons>
                    <ActionButton onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(announcement);
                    }} title="Edit">
                      <FiEdit2 size={16} />
                    </ActionButton>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(announcement.id);
                      }}
                      title="Delete"
                      $danger
                    >
                      <FiTrash2 size={16} />
                    </ActionButton>
                  </ActionButtons>
                </AnnouncementMeta>
              </AnnouncementContent>
            </AnnouncementItem>
          ))
        ) : (
          <EmptyState>
            <FiInfo size={48} />
            <EmptyStateTitle>No announcements found</EmptyStateTitle>
            <EmptyStateDescription>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Create your first announcement by clicking the "New Announcement" button'}
            </EmptyStateDescription>
          </EmptyState>
        )}
      </AnnouncementsList>

      <AnnouncementForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedAnnouncement}
      />
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

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary[600] || '#2563eb'};
  }
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
}

// Updated AnnouncementItem styling for a more modern look with Telegram-style
const AnnouncementItem = styled.div<AnnouncementItemProps>`
  position: relative;
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 24px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 180px;
    background: linear-gradient(135deg, #33a9e1 0%, #2b8eda 100%);
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 45px;
    right: -30px;
    width: 120px;
    height: 120px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='.667' x2='.417' y1='.167' y2='.75'%3E%3Cstop offset='0' stop-color='%23fff' stop-opacity='.2'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='.1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23a)' d='M116.85 174.35c-6.86 0-6.23-2.59-8.42-9.06l-21.04-69.22 131.41-78.19c12.67-7.63-2.73-11.93-2.73-11.93l-178.18 68.76s-10.25 3.38-9.43 9.76c.83 6.38 9.13 9.35 9.13 9.35l44.31 14.18 102.45-64.59c4.83-3.47 10.38-.55 6.31 2.22L99.67 115.44l-3.14 43.28c4.37 0 6.32-1.99 6.32-1.99l15.19-14.7 44.34 32.86s7.47 4.24 12.47-1.55c.1-.13 7.17-63.12 7.17-63.12L124.69 173.1c-2.66 1.79-5.51 1.82-7.84 1.25'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: contain;
    opacity: 0.25;
    z-index: 0;
  }

  ${props => props.$important && `
    &::before {
      background: linear-gradient(135deg, #ff7043 0%, #f4511e 100%);
    }
  `}

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
  }
`;

const AnnouncementImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 180px;
  z-index: 1;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, 
      rgba(0,0,0,0.4) 0%, 
      rgba(0,0,0,0.2) 50%, 
      rgba(0,0,0,0) 100%);
    z-index: 1;
  }
`;

const AnnouncementImage = styled.img`
  width: 100%;
  height: 20px;
  object-fit: cover;
  transition: transform 0.6s ease;
  transform-origin: center;

  ${AnnouncementItem}:hover & {
    transform: scale(1.05);
  }
`;

const AnnouncementContent = styled.div`
  position: relative;
  padding: 200px 24px 24px;
  cursor: pointer;
`;

const AnnouncementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 3;
`;

const AnnouncementTitle = styled.h3`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  max-width: 70%;
  position: relative;
  z-index: 3;
`;

const ImportantBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  color: white;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 3;
`;

const AnnouncementBody = styled.div`
  position: relative;
  font-size: 15px;
  line-height: 1.6;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  margin-bottom: 24px;
  white-space: pre-line;
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
`;

const AnnouncementMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`;

const Divider = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.text.tertiary || '#94a3b8'};
`;

interface AudienceBadgeProps {
  $audience: string;
}

const AudienceBadge = styled.span<AudienceBadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.$audience) {
      case 'admin': return 'rgba(79, 70, 229, 0.1)';
      case 'teacher': return 'rgba(16, 185, 129, 0.1)';
      case 'student': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$audience) {
      case 'admin': return '#4f46e5';
      case 'teacher': return '#10b981';
      case 'student': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

interface ActionButtonProps {
  $danger?: boolean;
}

const ActionButton = styled.button<ActionButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background-color: ${props => props.$danger ? 'rgba(239, 68, 68, 0.1)' : props.theme.colors.background.secondary || '#f1f5f9'};
  color: ${props => props.$danger ? '#ef4444' : props.theme.colors.text.secondary || '#64748b'};
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.$danger ? '#dc2626' : props.theme.colors.text.primary || '#334155'};
    transform: scale(1.05);
  }
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

// Modal styled components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
`;

const Modal = styled(motion.div)`
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text.primary || '#334155'};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary || '#64748b'};
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${props => props.theme.colors.text.primary || '#334155'};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  padding: 0 24px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  padding: 0 24px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary || '#334155'};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
  border-radius: 6px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary || '#334155'};
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[300] || '#93c5fd'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100] || '#dbeafe'};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
  border-radius: 6px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary || '#334155'};
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[300] || '#93c5fd'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100] || '#dbeafe'};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
  border-radius: 6px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary || '#334155'};
  background-color: ${props => props.theme.colors.background.primary || '#ffffff'};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[300] || '#93c5fd'};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100] || '#dbeafe'};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary || '#334155'};
  cursor: pointer;
  margin-top: 24px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  background-color: transparent;
  color: ${props => props.theme.colors.text.primary || '#334155'};
  border: 1px solid ${props => props.theme.colors.border.light || '#e2e8f0'};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background.secondary || '#f8fafc'};
  }
`;

const SubmitButton = styled.button`
  padding: 10px 16px;
  background-color: ${props => props.theme.colors.primary[500] || '#3b82f6'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primary[600] || '#2563eb'};
  }
`;

export default AdminAnnouncements;