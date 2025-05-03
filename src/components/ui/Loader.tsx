import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoaderProps {
  size?: number;
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 24, color }) => {
  return <StyledLoader $size={size} $color={color} />;
};

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledLoader = styled.div<{ $size: number; $color?: string }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border: ${({ $size }) => Math.max(2, $size / 10)}px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: ${({ $color, theme }) => $color || theme.colors.primary[500] || '#3b82f6'};
  animation: ${spin} 0.8s linear infinite;
`;

export default Loader; 