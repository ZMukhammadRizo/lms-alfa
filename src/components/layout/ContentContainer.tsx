import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface ContentContainerProps {
  children: ReactNode;
}

const ContentContainer: React.FC<ContentContainerProps> = ({ children }) => {
  return (
    <Container>
      {children}
    </Container>
  );
};

const Container = styled.div`
  padding: 0;
  max-width: 100%;
  overflow-x: hidden;
`;

export default ContentContainer; 