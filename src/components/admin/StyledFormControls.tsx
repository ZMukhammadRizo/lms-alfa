import React, { ReactNode } from 'react';
import styled from 'styled-components';

// Admin Input Component
interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const AdminInput: React.FC<AdminInputProps> = ({ prefix, suffix, ...props }) => {
  return (
    <InputWrapper>
      {prefix && <InputAdornment>{prefix}</InputAdornment>}
      <StyledInput hasPrefix={!!prefix} hasSuffix={!!suffix} {...props} />
      {suffix && <InputAdornment>{suffix}</InputAdornment>}
    </InputWrapper>
  );
};

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const InputAdornment = styled.span`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  padding: 0 12px;
  z-index: 1;
`;

const StyledInput = styled.input<{ hasPrefix?: boolean; hasSuffix?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
  background-color: ${({ theme }) => theme.colors.card || 'white'};
  border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  border-radius: 6px;
  transition: all 0.2s;
  
  padding-left: ${({ hasPrefix }) => hasPrefix ? '38px' : '12px'};
  padding-right: ${({ hasSuffix }) => hasSuffix ? '38px' : '12px'};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[400] || '#60a5fa'};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100] || '#dbeafe'};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary || '#9ca3af'};
  }
`;

// Enhanced Checkbox Component
interface EnhancedCheckboxProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EnhancedCheckbox: React.FC<EnhancedCheckboxProps> = ({ checked, onChange }) => {
  return (
    <CheckboxWrapper>
      <StyledCheckbox 
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
      />
      <CheckboxCustom $checked={checked}>
        {checked && <i className="fas fa-check"></i>}
      </CheckboxCustom>
    </CheckboxWrapper>
  );
};

const CheckboxWrapper = styled.label`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const StyledCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const CheckboxCustom = styled.div<{ $checked?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid ${({ $checked, theme }) => 
    $checked ? theme.colors.primary[500] || '#3b82f6' : theme.colors.border || '#d1d5db'};
  background-color: ${({ $checked, theme }) => 
    $checked ? theme.colors.primary[500] || '#3b82f6' : 'transparent'};
  color: white;
  font-size: 10px;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400] || '#60a5fa'};
  }
`;

// Admin Dropdown Component
interface AdminDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export const AdminDropdown: React.FC<AdminDropdownProps> = ({ label, value, onChange, options }) => {
  return (
    <DropdownWrapper>
      <DropdownLabel>{label}</DropdownLabel>
      <DropdownSelect 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </DropdownSelect>
      <DropdownIcon>
        <i className="fas fa-chevron-down"></i>
      </DropdownIcon>
    </DropdownWrapper>
  );
};

const DropdownWrapper = styled.div`
  position: relative;
  min-width: 150px;
`;

const DropdownLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
`;

const DropdownSelect = styled.select`
  width: 100%;
  padding: 9px 12px;
  padding-right: 36px;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
  background-color: ${({ theme }) => theme.colors.card || 'white'};
  border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  border-radius: 6px;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[400] || '#60a5fa'};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100] || '#dbeafe'};
  }
`;

const DropdownIcon = styled.div`
  position: absolute;
  top: 31px;
  right: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  pointer-events: none;
`;