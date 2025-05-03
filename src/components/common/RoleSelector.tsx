import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import supabase from '../../config/supabaseClient';
import { FiChevronDown } from 'react-icons/fi';

interface RoleOption {
  id: string;
  name: string;
}

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select a role',
  error,
  required = false
}) => {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Define fallback roles in case the database fetch fails
  const fallbackRoles: RoleOption[] = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'Teacher' },
    { id: '3', name: 'Student' },
    { id: '4', name: 'Parent' }
  ];

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        console.log('Fetching roles from Supabase...');
        const { data, error } = await supabase
          .from('roles')
          .select('id, name')
          .order('name');

        console.log('Roles data received:', data);
        console.log('Roles error if any:', error);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setRoles(data);
          console.log('Roles set in state:', data);
        } else {
          // If no data was returned, try to insert some default roles
          console.log('No roles found in database, trying to create default roles');
          await insertDefaultRoles();
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setFetchError('Unable to load roles from database, using default roles');
        // Use fallback roles if fetch fails
        setRoles(fallbackRoles);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const insertDefaultRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .upsert(fallbackRoles, { onConflict: 'id' })
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Default roles inserted:', data);
      
      // If successful, set the roles state with the inserted data
      if (data && data.length > 0) {
        setRoles(data);
      } else {
        // If upsert didn't return data, use fallback roles
        setRoles(fallbackRoles);
      }
    } catch (error) {
      console.error('Error inserting default roles:', error);
      // Use fallback roles if insert fails
      setRoles(fallbackRoles);
    }
  };

  const handleSelect = (roleId: string) => {
    onChange(roleId);
    setOpen(false);
  };

  const toggleDropdown = () => {
    setOpen(!open);
  };

  // Find the selected role name to display
  const selectedRole = roles.find(role => role.id === value);

  return (
    <SelectorContainer>
      <SelectorButton 
        type="button" 
        onClick={toggleDropdown}
        $hasError={!!error}
      >
        <span>{selectedRole ? selectedRole.name : placeholder}</span>
        <FiChevronDown />
      </SelectorButton>
      
      {open && (
        <DropdownMenu>
          {loading ? (
            <LoadingItem>Loading roles...</LoadingItem>
          ) : fetchError ? (
            <>
              <ErrorItem>{fetchError}</ErrorItem>
              {roles.map(role => (
                <DropdownItem 
                  key={role.id} 
                  onClick={() => handleSelect(role.id)}
                  $isSelected={role.id === value}
                >
                  {role.name}
                </DropdownItem>
              ))}
            </>
          ) : roles.length === 0 ? (
            <EmptyItem>No roles available</EmptyItem>
          ) : (
            roles.map(role => (
              <DropdownItem 
                key={role.id} 
                onClick={() => handleSelect(role.id)}
                $isSelected={role.id === value}
              >
                {role.name}
              </DropdownItem>
            ))
          )}
        </DropdownMenu>
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </SelectorContainer>
  );
};

const SelectorContainer = styled.div`
  position: relative;
  width: 100%;
`;

interface SelectorButtonProps {
  $hasError: boolean;
}

const SelectorButton = styled.button<SelectorButtonProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => 
    props.$hasError 
      ? props.theme.colors.danger[500] 
      : props.theme.colors.border.light
  };
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => 
      props.$hasError 
        ? props.theme.colors.danger[500] 
        : props.theme.colors.primary[300]
    };
  }

  svg {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 16px;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  z-index: 10;
`;

interface DropdownItemProps {
  $isSelected: boolean;
}

const DropdownItem = styled.div<DropdownItemProps>`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => 
    props.$isSelected ? props.theme.colors.primary[50] : 'transparent'
  };

  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const LoadingItem = styled.div`
  padding: 8px 12px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 14px;
  text-align: center;
`;

const ErrorItem = styled.div`
  padding: 8px 12px;
  color: ${props => props.theme.colors.danger[500]};
  font-size: 14px;
  text-align: center;
`;

const EmptyItem = styled.div`
  padding: 8px 12px;
  color: ${props => props.theme.colors.text.tertiary};
  font-size: 14px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger[500]};
  font-size: 12px;
  margin-top: 4px;
  margin-left: 2px;
`;

export default RoleSelector; 