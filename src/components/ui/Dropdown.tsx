import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[] | string[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Format options to consistent structure
  const formattedOptions: DropdownOption[] = options.map(option => 
    typeof option === 'string' ? { value: option, label: option } : option
  );
  
  // Find selected option
  const selectedOption = value 
    ? formattedOptions.find(option => option.value === value) 
    : undefined;
  
  // Toggle dropdown
  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };
  
  // Select option
  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <DropdownContainer ref={dropdownRef}>
      {label && <DropdownLabel>{label}</DropdownLabel>}
      <DropdownControl $isOpen={isOpen} $hasError={!!error} onClick={handleToggle}>
        <SelectedValue>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectedValue>
        <ArrowIcon $isOpen={isOpen}>
          <i className="fas fa-chevron-down"></i>
        </ArrowIcon>
      </DropdownControl>
      
      {isOpen && (
        <DropdownMenu>
          {formattedOptions.map(option => (
            <DropdownItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              $isSelected={option.value === value}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </DropdownContainer>
  );
};

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
`;

const DropdownControl = styled.div<{ $isOpen: boolean; $hasError: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 14px;
  background-color: ${({ theme }) => theme.colors.card || 'white'};
  border: 1px solid ${({ $hasError, theme }) => 
    $hasError 
      ? theme.colors.danger[500] || '#ef4444' 
      : theme.colors.border || '#e5e7eb'
  };
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $isOpen, $hasError, theme }) => $isOpen && `
    border-color: ${$hasError 
      ? theme.colors.danger[500] || '#ef4444'
      : theme.colors.primary[500] || '#3b82f6'
    };
    box-shadow: 0 0 0 2px ${$hasError 
      ? theme.colors.danger[100] + '40' || '#fee2e240'
      : theme.colors.primary[100] + '40' || '#dbeafe40'
    };
  `}
  
  &:hover {
    border-color: ${({ $hasError, theme }) => 
      $hasError 
        ? theme.colors.danger[500] || '#ef4444'
        : theme.colors.neutral[400] || '#9ca3af'
    };
  }
`;

const SelectedValue = styled.div`
  color: ${({ theme }) => theme.colors.text || '#1f2937'};
`;

const ArrowIcon = styled.div<{ $isOpen: boolean }>`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.card || 'white'};
  border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 250px;
  overflow-y: auto;
`;

const DropdownItem = styled.div<{ $isSelected: boolean }>`
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  background-color: ${({ $isSelected, theme }) => 
    $isSelected ? theme.colors.primary[50] || '#eff6ff' : 'transparent'
  };
  color: ${({ $isSelected, theme }) => 
    $isSelected ? theme.colors.primary[700] || '#1d4ed8' : theme.colors.text || '#1f2937'
  };
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[100] || '#f3f4f6'};
  }
  
  &:first-child {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  
  &:last-child {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger[500] || '#ef4444'};
`;

export default Dropdown; 