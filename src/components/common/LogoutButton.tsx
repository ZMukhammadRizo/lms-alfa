import React from 'react';
import styled from 'styled-components';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showText?: boolean;
  text?: string;
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  showIcon = true,
  showText = true,
  text = 'Logout',
  className
}) => {
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('LogoutButton: Logout triggered');
    logout();
  };

  return (
    <StyledButton 
      $variant={variant} 
      $size={size} 
      onClick={handleLogout} 
      className={className}
      data-testid="logout-button"
    >
      {showIcon && <FiLogOut />}
      {showText && <span>{text}</span>}
    </StyledButton>
  );
};

interface StyledButtonProps {
  $variant: 'primary' | 'secondary' | 'danger';
  $size: 'small' | 'medium' | 'large';
}

const StyledButton = styled.button<StyledButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  /* Size variations */
  padding: ${props => {
    switch (props.$size) {
      case 'small': return '6px 12px';
      case 'large': return '12px 24px';
      default: return '8px 16px';
    }
  }};
  
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '0.75rem';
      case 'large': return '1rem';
      default: return '0.875rem';
    }
  }};
  
  /* Variant styling */
  background-color: ${props => {
    switch (props.$variant) {
      case 'primary': return props.theme.colors.primary[500];
      case 'secondary': return 'transparent';
      case 'danger': return props.theme.colors.danger[500];
      default: return props.theme.colors.primary[500];
    }
  }};
  
  color: ${props => {
    switch (props.$variant) {
      case 'primary': return 'white';
      case 'secondary': return props.theme.colors.text.primary;
      case 'danger': return 'white';
      default: return 'white';
    }
  }};
  
  border: ${props => {
    return props.$variant === 'secondary' 
      ? `1px solid ${props.theme.colors.border.light}` 
      : 'none';
  }};
  
  &:hover {
    background-color: ${props => {
      switch (props.$variant) {
        case 'primary': return props.theme.colors.primary[600];
        case 'secondary': return props.theme.colors.background.hover;
        case 'danger': return props.theme.colors.danger[600];
        default: return props.theme.colors.primary[600];
      }
    }};
    
    border-color: ${props => {
      return props.$variant === 'secondary' 
        ? props.theme.colors.border.dark
        : 'none';
    }};
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  svg {
    width: ${props => props.$size === 'small' ? '14px' : props.$size === 'large' ? '20px' : '16px'};
    height: ${props => props.$size === 'small' ? '14px' : props.$size === 'large' ? '20px' : '16px'};
  }
`;

export default LogoutButton; 