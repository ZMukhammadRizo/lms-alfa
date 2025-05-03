import React from 'react';
import styled, { keyframes } from 'styled-components';

const LoadingScreen: React.FC = () => {
  return (
    <LoadingContainer>
      <LoadingContent>
        <LogoIcon>LMS</LogoIcon>
        <SpinnerContainer>
          <Spinner data-testid="loading-spinner" />
        </SpinnerContainer>
        <LoadingText>Loading</LoadingText>
      </LoadingContent>
    </LoadingContainer>
  );
};

// Animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleUp = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

// Styled Components
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.theme.colors.background.lighter};
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-in-out;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing[3]};
`;

const LogoIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: ${props => props.theme.spacing[4]};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  animation: ${scaleUp} 0.5s ease-out;
`;

const SpinnerContainer = styled.div`
  width: 50px;
  height: 50px;
  position: relative;
`;

const Spinner = styled.div`
  width: 100%;
  height: 100%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-left-color: ${props => props.theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  margin-top: ${props => props.theme.spacing[2]};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export default LoadingScreen; 