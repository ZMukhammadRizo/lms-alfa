import React from 'react';
import styled from 'styled-components';

interface RowProps {
  children: React.ReactNode;
  noGutters?: boolean;
}

const Row: React.FC<RowProps> = ({ children, noGutters = false }) => {
  return (
    <RowWrapper $noGutters={noGutters}>
      {children}
    </RowWrapper>
  );
};

interface RowWrapperProps {
  $noGutters: boolean;
}

const RowWrapper = styled.div<RowWrapperProps>`
  display: flex;
  flex-wrap: wrap;
  margin-right: ${props => props.$noGutters ? '0' : '-15px'};
  margin-left: ${props => props.$noGutters ? '0' : '-15px'};
`;

export default Row; 