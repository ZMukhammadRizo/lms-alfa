import React from 'react';
import styled from 'styled-components';

interface ContainerProps {
  children: React.ReactNode;
  fluid?: boolean;
}

const Container: React.FC<ContainerProps> = ({ children, fluid = false }) => {
  return (
    <ContainerWrapper $fluid={fluid}>
      {children}
    </ContainerWrapper>
  );
};

interface ContainerWrapperProps {
  $fluid: boolean;
}

const ContainerWrapper = styled.div<ContainerWrapperProps>`
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
  
  @media (min-width: 576px) {
    max-width: ${props => props.$fluid ? '100%' : '540px'};
  }
  
  @media (min-width: 768px) {
    max-width: ${props => props.$fluid ? '100%' : '720px'};
  }
  
  @media (min-width: 992px) {
    max-width: ${props => props.$fluid ? '100%' : '960px'};
  }
  
  @media (min-width: 1200px) {
    max-width: ${props => props.$fluid ? '100%' : '1140px'};
  }
`;

export default Container; 