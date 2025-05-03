import React from 'react';
import styled from 'styled-components';

interface PageTitleProps {
  title?: string;
  children?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, children }) => {
  return (
    <PageTitleContainer>
      {title || children}
    </PageTitleContainer>
  );
};

const PageTitleContainer = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

export default PageTitle; 