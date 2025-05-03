import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  border-radius: 8px;
  background-color: ${props => props.theme.colors.errorLight};
  border: 1px solid ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.textPrimary};
`;

const ErrorHeading = styled.h2`
  color: ${props => props.theme.colors.error};
  margin-top: 0;
`;

const ErrorMessage = styled.p`
  margin-bottom: 16px;
`;

const ErrorStack = styled.pre`
  background-color: ${props => props.theme.colors.backgroundAlt};
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
  font-size: 14px;
  max-height: 200px;
`;

const ReloadButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 12px;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
`;

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorHeading>Something went wrong</ErrorHeading>
          <ErrorMessage>
            The application encountered an unexpected error. Please try reloading the page.
          </ErrorMessage>
          {this.state.error && (
            <ErrorStack>
              {this.state.error.toString()}
            </ErrorStack>
          )}
          <ReloadButton onClick={this.handleReload}>
            Reload Page
          </ReloadButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 