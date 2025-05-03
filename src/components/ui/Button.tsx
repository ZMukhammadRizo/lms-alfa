import React from 'react';
import styled, { css } from 'styled-components';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  size = 'md', 
  variant = 'primary',
  children,
  onClick,
  disabled,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick && !disabled) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <StyledButton 
      $size={size} 
      $variant={variant} 
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

const StyledButton = styled.button<{
  $size: ButtonSize;
  $variant: ButtonVariant;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        `;
      case 'lg':
        return css`
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        `;
      default: // md
        return css`
          padding: 0.5rem 1rem;
          font-size: 1rem;
        `;
    }
  }}
  
  ${({ $variant, theme }) => {
    const primary = theme?.colors?.primary?.[500] || '#3b82f6';
    const danger = theme?.colors?.danger?.[500] || '#ef4444';
    
    switch ($variant) {
      case 'primary':
        return css`
          background-color: ${primary};
          color: white;
          border: none;
          
          &:hover {
            background-color: ${theme?.colors?.primary?.[600] || '#2563eb'};
          }
        `;
      case 'secondary':
        return css`
          background-color: ${theme?.colors?.neutral?.[200] || '#e5e7eb'};
          color: ${theme?.colors?.neutral?.[800] || '#1f2937'};
          border: none;
          
          &:hover {
            background-color: ${theme?.colors?.neutral?.[300] || '#d1d5db'};
          }
        `;
      case 'outline':
        return css`
          background-color: transparent;
          color: ${theme?.colors?.neutral?.[700] || '#374151'};
          border: 1px solid ${theme?.colors?.neutral?.[300] || '#d1d5db'};
          
          &:hover {
            background-color: ${theme?.colors?.neutral?.[50] || '#f9fafb'};
          }
        `;
      case 'danger':
        return css`
          background-color: ${danger};
          color: white;
          border: none;
          
          &:hover {
            background-color: ${theme?.colors?.danger?.[600] || '#dc2626'};
          }
        `;
      default:
        return '';
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  i {
    margin-right: ${props => props.children ? '0.5rem' : '0'};
  }
`;

export default Button; 