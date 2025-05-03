import React from 'react';
import styled from 'styled-components';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  checked = false, 
  onChange,
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };
  
  return (
    <CheckboxContainer>
      <CheckboxLabel>
        <HiddenCheckbox 
          type="checkbox" 
          checked={checked} 
          onChange={handleChange}
          {...props}
        />
        <StyledCheckbox $checked={checked}>
          {checked && <CheckIcon />}
        </StyledCheckbox>
        {label && <LabelText>{label}</LabelText>}
      </CheckboxLabel>
    </CheckboxContainer>
  );
};

const CheckboxContainer = styled.div`
  display: inline-block;
  vertical-align: middle;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
`;

const StyledCheckbox = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: ${({ $checked, theme }) => 
    $checked ? theme.colors.primary[500] || '#3b82f6' : 'transparent'
  };
  border: 2px solid ${({ $checked, theme }) => 
    $checked ? theme.colors.primary[500] || '#3b82f6' : theme.colors.neutral[300] || '#d1d5db'
  };
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400] || '#60a5fa'};
  }
`;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M5 13l4 4L19 7" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const LabelText = styled.span`
  margin-left: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
`;

export default Checkbox; 