import React from 'react';
import styled from 'styled-components';
import { FiSearch } from 'react-icons/fi';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 10px 10px 40px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.95rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}33;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const SearchInput: React.FC<SearchInputProps> = ({ 
  placeholder = 'Search...', 
  value, 
  onChange,
  className
}) => {
  return (
    <SearchContainer className={className}>
      <IconWrapper>
        <FiSearch size={16} />
      </IconWrapper>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </SearchContainer>
  );
};

export default SearchInput; 