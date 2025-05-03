import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import AnnouncementModal from '../../components/admin/AnnouncementModal';
import { FiArrowLeft } from 'react-icons/fi';

const AnnouncementCreate: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/admin/announcements');
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={handleClose}>
          <FiArrowLeft size={18} />
          <span>Back to Announcements</span>
        </BackButton>
        <Title>Create New Announcement</Title>
      </Header>
      
      <Content>
        <AnnouncementModal
          onClose={handleClose}
          standalone={true}
        />
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 0 0;
  color: ${props => props.theme.colors.text.primary};
`;

const Content = styled.div`
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[600]};
  font-size: 14px;
  font-weight: 500;
  padding: 0;
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.colors.primary[700]};
    text-decoration: underline;
  }
`;

export default AnnouncementCreate; 