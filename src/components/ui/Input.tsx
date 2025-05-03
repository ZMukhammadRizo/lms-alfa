import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  prefix, 
  suffix, 
  ...props 
}) => {
  return (
    <InputContainer>
      {label && <InputLabel>{label}</InputLabel>}
      <InputWrapper $hasError={!!error}>
        {prefix && <InputAdornment position="start">{prefix}</InputAdornment>}
        <StyledInput 
          $hasPrefix={!!prefix} 
          $hasSuffix={!!suffix} 
          $hasError={!!error}
          {...props} 
        />
        {suffix && <InputAdornment position="end">{suffix}</InputAdornment>}
      </InputWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputContainer>
  );
};

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 8px;
`;

const InputLabel = styled.label`
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
`;

const InputWrapper = styled.div<{ $hasError?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid ${({ $hasError, theme }) => 
    $hasError 
      ? theme.colors.danger[500] || '#ef4444' 
      : theme.colors.border || '#e5e7eb'
  };
  border-radius: 6px;
  transition: all 0.2s;
  background-color: ${({ theme }) => theme.colors.card || 'white'};
  
  &:focus-within {
    border-color: ${({ $hasError, theme }) => 
      $hasError 
        ? theme.colors.danger[500] || '#ef4444' 
        : theme.colors.primary[500] || '#3b82f6'
    };
    box-shadow: 0 0 0 2px ${({ $hasError, theme }) => 
      $hasError 
        ? theme.colors.danger[100] || '#fee2e2' 
        : theme.colors.primary[100] || '#dbeafe'
    };
  }
`;

const InputAdornment = styled.div<{ position: 'start' | 'end' }>`
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  
  ${({ position }) => position === 'start' && `
    padding-right: 0;
  `}
  
  ${({ position }) => position === 'end' && `
    padding-left: 0;
  `}
`;

const StyledInput = styled.input<{ 
  $hasPrefix?: boolean; 
  $hasSuffix?: boolean;
  $hasError?: boolean;
}>`
  width: 100%;
  padding: 10px 12px;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary || '#9ca3af'};
  }
  
  ${({ $hasPrefix }) => $hasPrefix && `
    padding-left: 0;
  `}
  
  ${({ $hasSuffix }) => $hasSuffix && `
    padding-right: 0;
  `}
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger[500] || '#ef4444'};
`;

export default Input; 