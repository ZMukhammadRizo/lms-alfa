import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiSearch, FiX, FiFilter } from 'react-icons/fi';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  filterActive?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'outlined';
  disabled?: boolean;
  loading?: boolean;
  resultsCount?: number;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  showFilter = false,
  onFilterClick,
  filterActive = false,
  size = 'medium',
  variant = 'elevated',
  disabled = false,
  loading = false,
  resultsCount,
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <SearchContainer className={className}>
      <SearchWrapper
        $isFocused={isFocused}
        $hasValue={!!value}
        $size={size}
        $variant={variant}
        $disabled={disabled}
      >
        <SearchIconWrapper $loading={loading}>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <FiSearch size={size === 'small' ? 16 : size === 'large' ? 20 : 18} />
          )}
        </SearchIconWrapper>

        <StyledInput
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          $size={size}
        />

        {value && !disabled && (
          <ClearButton
            onClick={handleClear}
            type="button"
            aria-label="Clear search"
            $size={size}
          >
            <FiX size={size === 'small' ? 14 : 16} />
          </ClearButton>
        )}

        {showFilter && (
          <FilterButton
            onClick={onFilterClick}
            type="button"
            aria-label="Toggle filters"
            $active={filterActive}
            $size={size}
            disabled={disabled}
          >
            <FiFilter size={size === 'small' ? 14 : 16} />
          </FilterButton>
        )}
      </SearchWrapper>

      {resultsCount !== undefined && value && (
        <ResultsCounter $size={size}>
          {resultsCount === 0 ? 'No results found' : `${resultsCount} result${resultsCount === 1 ? '' : 's'}`}
        </ResultsCounter>
      )}
    </SearchContainer>
  );
};

// Animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components
const SearchContainer = styled.div`
  width: 100%;
  position: relative;
`;

const SearchWrapper = styled.div<{
  $isFocused: boolean;
  $hasValue: boolean;
  $size: 'small' | 'medium' | 'large';
  $variant: 'default' | 'elevated' | 'outlined';
  $disabled: boolean;
}>`
  display: flex;
  align-items: center;
  position: relative;
  border-radius: ${({ $size }) => 
    $size === 'small' ? '8px' : $size === 'large' ? '12px' : '10px'
  };
  background: ${({ theme, $variant, $disabled }) => {
    if ($disabled) return theme.colors.background.disabled || '#f5f5f5';
    switch ($variant) {
      case 'outlined':
        return 'transparent';
      case 'elevated':
        return theme.colors.background.secondary || '#ffffff';
      default:
        return theme.colors.background.lighter || '#f8f9fa';
    }
  }};
  border: ${({ theme, $variant, $isFocused, $disabled }) => {
    if ($variant === 'outlined') {
      if ($isFocused && !$disabled) {
        return `2px solid ${theme.colors.primary[500] || '#3b82f6'}`;
      }
      return `1px solid ${theme.colors.border.light || '#e5e7eb'}`;
    }
    if ($isFocused && !$disabled) {
      return `1px solid ${theme.colors.primary[400] || '#60a5fa'}`;
    }
    return `1px solid ${theme.colors.border.light || '#e5e7eb'}`;
  }};
  box-shadow: ${({ $variant, $isFocused, $disabled }) => {
    if ($disabled) return 'none';
    if ($variant === 'elevated') {
      if ($isFocused) {
        return '0 8px 25px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(59, 130, 246, 0.1)';
      }
      return '0 4px 15px rgba(0, 0, 0, 0.05)';
    }
    if ($isFocused) {
      return '0 0 0 3px rgba(59, 130, 246, 0.1)';
    }
    return 'none';
  }};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${({ $size }) => {
    switch ($size) {
      case 'small': return '8px 12px';
      case 'large': return '16px 20px';
      default: return '12px 16px';
    }
  }};
  gap: ${({ $size }) => $size === 'small' ? '8px' : '12px'};
  min-width: 280px;
  width: 100%;
  
  &:hover:not(:focus-within) {
    ${({ $disabled, theme, $variant }) => !$disabled && $variant === 'elevated' && `
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
      border-color: ${theme.colors.border.medium || '#d1d5db'};
    `}
  }

  ${({ $disabled }) => $disabled && `
    opacity: 0.6;
    cursor: not-allowed;
  `}
`;

const SearchIconWrapper = styled.div<{ $loading: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary || '#6b7280'};
  flex-shrink: 0;
  
  ${({ $loading }) => $loading && `
    svg {
      animation: ${spin} 1s linear infinite;
    }
  `}
`;

const LoadingSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid ${({ theme }) => theme.colors.border.light || '#e5e7eb'};
  border-top: 2px solid ${({ theme }) => theme.colors.primary[500] || '#3b82f6'};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const StyledInput = styled.input<{ $size: 'small' | 'medium' | 'large' }>`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: ${({ $size }) => {
    switch ($size) {
      case 'small': return '14px';
      case 'large': return '18px';
      default: return '16px';
    }
  }};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.primary || '#111827'};
  font-weight: 400;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary || '#9ca3af'};
    font-weight: 400;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button<{ $size: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary || '#6b7280'};
  padding: ${({ $size }) => $size === 'small' ? '2px' : '4px'};
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
  animation: ${fadeIn} 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover || 'rgba(0, 0, 0, 0.05)'};
    color: ${({ theme }) => theme.colors.text.primary || '#111827'};
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const FilterButton = styled.button<{ 
  $active: boolean; 
  $size: 'small' | 'medium' | 'large' 
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary[100] || '#dbeafe' : 'none'
  };
  border: none;
  cursor: pointer;
  color: ${({ theme, $active }) => 
    $active 
      ? theme.colors.primary[600] || '#2563eb'
      : theme.colors.text.secondary || '#6b7280'
  };
  padding: ${({ $size }) => $size === 'small' ? '6px' : '8px'};
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background: ${({ theme, $active }) => 
      $active 
        ? theme.colors.primary[200] || '#bfdbfe'
        : theme.colors.background.hover || 'rgba(0, 0, 0, 0.05)'
    };
    color: ${({ theme, $active }) => 
      $active 
        ? theme.colors.primary[700] || '#1d4ed8'
        : theme.colors.text.primary || '#111827'
    };
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsCounter = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  margin-top: 8px;
  font-size: ${({ $size }) => $size === 'small' ? '12px' : '14px'};
  color: ${({ theme }) => theme.colors.text.secondary || '#6b7280'};
  font-weight: 500;
  animation: ${fadeIn} 0.3s ease;
`;

export default SearchInput; 