import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'light' | 'dark';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  isLoading = false,
  disabled = false,
  className,
  onClick,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick && !disabled && !isLoading) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <StyledButton
      variant={variant}
      size={size}
      $fullWidth={fullWidth}
      $isLoading={isLoading}
      disabled={disabled || isLoading}
      className={className}
      onClick={handleClick}
      {...rest}
    >
      {isLoading && <Spinner />}
      {!isLoading && startIcon && <IconWrapper>{startIcon}</IconWrapper>}
      <span>{children}</span>
      {!isLoading && endIcon && <IconWrapper>{endIcon}</IconWrapper>}
    </StyledButton>
  );
};

interface StyledButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  $fullWidth: boolean;
  $isLoading: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  /* Size Styles */
  ${props => props.size === 'small' && css`
    font-size: 0.75rem;
    padding: 0.35rem 0.75rem;
    height: 32px;
  `}
  
  ${props => props.size === 'medium' && css`
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    height: 40px;
  `}
  
  ${props => props.size === 'large' && css`
    font-size: 1rem;
    padding: 0.65rem 1.25rem;
    height: 48px;
  `}

  /* Variant Styles */
  ${props => props.variant === 'primary' && css`
    background-color: ${props => props.theme.colors.primary[500]};
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.primary[600]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.primary[700]};
    }
  `}
  
  ${props => props.variant === 'secondary' && css`
    background-color: transparent;
    color: ${props => props.theme.colors.text.primary};
    border: 1px solid ${props => props.theme.colors.border.light};
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.background.hover};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.background.tertiary};
    }
  `}
  
  ${props => props.variant === 'danger' && css`
    background-color: ${props => props.theme.colors.danger[500]};
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.danger[600]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.danger[700]};
    }
  `}
  
  ${props => props.variant === 'success' && css`
    background-color: ${props => props.theme.colors.success[500]};
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.success[600]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.success[700]};
    }
  `}
  
  ${props => props.variant === 'warning' && css`
    background-color: ${props => props.theme.colors.warning[500]};
    color: ${props => props.theme.colors.warning[900]};
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.warning[600]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.warning[700]};
    }
  `}
  
  ${props => props.variant === 'info' && css`
    background-color: ${props => props.theme.colors.info[500]};
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.info[600]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.info[700]};
    }
  `}
  
  ${props => props.variant === 'light' && css`
    background-color: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
    border: 1px solid ${props => props.theme.colors.border.light};
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.background.secondary};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.background.tertiary};
    }
  `}
  
  ${props => props.variant === 'dark' && css`
    background-color: ${props => props.theme.colors.gray[800]};
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      background-color: ${props => props.theme.colors.gray[900]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props => props.theme.colors.gray[950]};
    }
  `}
  
  /* Loading Style */
  ${props => props.$isLoading && css`
    color: transparent !important;
  `}
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  font-size: 1.1em;
`;

const Spinner = styled.span`
  width: 1.2em;
  height: 1.2em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  position: absolute;
  animation: spin 0.75s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default Button; 