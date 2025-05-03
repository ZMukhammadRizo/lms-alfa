import React from 'react';
import styled from 'styled-components';

interface ColProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const Col: React.FC<ColProps> = ({ children, xs, sm, md, lg, xl }) => {
  return (
    <ColWrapper 
      $xs={xs} 
      $sm={sm} 
      $md={md} 
      $lg={lg} 
      $xl={xl}
    >
      {children}
    </ColWrapper>
  );
};

interface ColWrapperProps {
  $xs?: number;
  $sm?: number;
  $md?: number;
  $lg?: number;
  $xl?: number;
}

const getWidthString = (span: number) => {
  if (!span) return '';
  
  const width = (span / 12) * 100;
  return `flex: 0 0 ${width}%; max-width: ${width}%;`;
};

const ColWrapper = styled.div<ColWrapperProps>`
  position: relative;
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  
  ${props => props.$xs && `
    flex: 0 0 ${(props.$xs / 12) * 100}%;
    max-width: ${(props.$xs / 12) * 100}%;
  `}
  
  @media (min-width: 576px) {
    ${props => props.$sm && getWidthString(props.$sm)}
  }
  
  @media (min-width: 768px) {
    ${props => props.$md && getWidthString(props.$md)}
  }
  
  @media (min-width: 992px) {
    ${props => props.$lg && getWidthString(props.$lg)}
  }
  
  @media (min-width: 1200px) {
    ${props => props.$xl && getWidthString(props.$xl)}
  }
`;

export default Col; 