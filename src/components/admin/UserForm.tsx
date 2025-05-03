import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiX, FiUser, FiMail, FiLock, FiShield, FiCalendar, FiCheck, FiUserPlus, FiUsers } from 'react-icons/fi';
import supabase, { supabaseAdmin } from '../../config/supabaseClient';

// User interface matching the one in Users.tsx
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  name?: string; // Optional string property
  parent_id?: string; // ID of parent user if this user is a child
  childrenIds?: string[]; // For parent-child relationships
  password?: string; // Password for new user creation
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Partial<User>) => void;
  initialData?: Partial<User>;
  formTitle: string;
}

const UserForm: React.FC<UserFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  formTitle
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Student',
    status: 'active',
  });

  // Password fields (only for new users)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States for parent-child relationship
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to check database schema more directly
  const checkDatabaseSchema = async () => {
    try {
      console.log("Checking database schema directly...");

      // Try to get the structure of the public schema
      const { data: authData } = await supabaseAdmin.auth.getSession();
      console.log("Current auth session:", authData);

      // Try to get information about the 'users' table directly
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .limit(1);

        if (error) {
          console.error("Error querying users table:", error);
        } else {
          console.log("Successfully queried users table:", data);
          if (data.length > 0) {
            console.log("Users table schema:", Object.keys(data[0]));
            return Object.keys(data[0]);
          } else {
            console.log("Users table exists but is empty");
            return [];
          }
        }
      } catch (err) {
        console.error("Error checking users table:", err);
      }

      // Check if a 'public.users' table exists
      try {
        const { data, error } = await supabaseAdmin
          .rpc('execute_sql', {
            sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')"
          });

        if (!error && data) {
          console.log("Check for users table result:", data);
        }
      } catch (err) {
        console.error("Error checking table existence:", err);
      }
    } catch (err) {
      console.error("Failed to check schema:", err);
    }
    return [];
  };

  // Function to check available tables and their structure more thoroughly
  const checkDatabaseTables = async () => {
    try {
      console.log("Checking database structure thoroughly...");

      // First, try to get schema information using postgres_meta function if available
      // try {
      //   const { data: tablesData, error: tablesError } = await supabaseAdmin.rpc('get_database_tables');
      //
      //   if (!tablesError && tablesData) {
      //     console.log("Available tables from metadata function:", tablesData);
      //     return tablesData;
      //   }
      // } catch (err) {
      //   console.log("Metadata function not available, using fallback methods");
      // }

      // Check potential user tables directly and record their schema
      const potentialTables = ['users', 'auth.users', 'public.users'];
      const tableInfo: Record<string, {
        exists: boolean;
        schema?: string[];
        isEmpty?: boolean;
        error?: string
      }> = {};

      for (const table of potentialTables) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table.replace(/^(public|auth)\./, ''))
            .select('*')
            .limit(1);

          if (!error && data) {
            console.log(`Table '${table}' exists and has schema:`, data.length > 0 ? Object.keys(data[0]) : "No records");
            tableInfo[table] = {
              exists: true,
              schema: data.length > 0 ? Object.keys(data[0]) : [],
              isEmpty: data.length === 0
            };
          } else {
            console.log(`Table '${table}' does not exist or is not accessible`, error);
            tableInfo[table] = { exists: false, error: error?.message };
          }
        } catch (err: any) { // Type assertion for error
          console.error(`Error checking table '${table}':`, err);
          tableInfo[table] = { exists: false, error: err?.message || 'Unknown error' };
        }
      }

      console.log("Database tables scan complete:", tableInfo);

      // Check RLS policies that might block us
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData) {
          console.log("Current user for RLS context:", userData);
        }
      } catch (err) {
        console.error("Error checking current user context:", err);
      }

      return tableInfo;
    } catch (err) {
      console.error("Failed to check database structure:", err);
      return {};
    }
  };

  // Function to ensure necessary tables exist
  const ensureTablesExist = async () => {
    try {
      console.log("Checking if necessary tables exist and creating them if needed...");

      // First, get the database structure
      const tableInfo = await checkDatabaseTables();

      // Check if 'users' table exists
      const hasUsersTable = tableInfo['users']?.exists || tableInfo['public.users']?.exists;

      // If we need to create tables, use admin client
      if (!hasUsersTable) {
        console.log("Users table doesn't exist. Attempting to create one...");

        try {
          // Try to create a users table directly with SQL
          const { error: sqlError } = await supabaseAdmin.rpc('execute_sql', {
            sql: `
            CREATE TABLE IF NOT EXISTS public.users (
              id UUID PRIMARY KEY REFERENCES auth.users(id),
              email TEXT NOT NULL,
              first_name TEXT,
              last_name TEXT,
              name TEXT,
              role TEXT DEFAULT 'Student',
              status TEXT DEFAULT 'active',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Users are viewable by everyone"
              ON public.users
              FOR SELECT USING (true);

            CREATE POLICY "Users can update their own data"
              ON public.users
              FOR UPDATE USING (auth.uid() = id);
            `
          });

          if (sqlError) {
            console.error("Error creating users table via SQL:", sqlError);
          } else {
            console.log("Successfully created users table");
          }
        } catch (err) {
          console.error("Error creating necessary tables:", err);
        }
      } else {
        console.log("Required table already exists:", { hasUsersTable });
      }
    } catch (err) {
      console.error("Error in ensureTablesExist:", err);
    }
  };

  // Call these functions once when the form opens
  useEffect(() => {
    if (isOpen) {
      checkDatabaseSchema();
      checkDatabaseTables();
      ensureTablesExist();
    }
  }, [isOpen]);

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      console.log("Initializing form with data:", initialData);

      // Handle existing data which might still have "name" instead of first/last name
      if (initialData.name && (!initialData.firstName || !initialData.lastName)) {
        const nameParts = (initialData.name as string).split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData({
          ...initialData,
          firstName,
          lastName
        });
      } else {
        setFormData({
          ...initialData
        });
      }
    } else {
      // Reset form data when creating a new user
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'Student',
        status: 'active',
      });
    }
  }, [initialData]);

  // Fetch all students who don't have a parent assigned
  const fetchAvailableStudents = async () => {
    setIsLoadingStudents(true);
    try {
      // Fetch all students
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'Student');

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      // Format the data to match our User interface
      const formattedStudents = data.map(student => ({
        id: student.id,
        firstName: student.firstName || student.first_name || '',
        lastName: student.lastName || student.last_name || '',
        email: student.email || '',
        role: 'Student',
        status: student.status || 'active',
        lastLogin: student.lastLogin || student.last_login || '',
        createdAt: student.createdAt || student.createdAt || '',
        parent_id: student.parent_id
      }));

      console.log('Available students:', formattedStudents);
      setAvailableStudents(formattedStudents);
    } catch (err) {
      console.error('Error in fetchAvailableStudents:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // When the role changes to Parent, fetch available students
  useEffect(() => {
    if (formData.role === 'Parent') {
      fetchAvailableStudents();
    }
  }, [formData.role]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset selected children if role changes from Parent
    if (name === 'role' && value !== 'Parent') {
      setSelectedChildren([]);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle password changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // Password validation (only for new users)
    if (!initialData?.id) {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = 'Password must contain at least one number';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Add validation for parent-child relationship
    if (formData.role === 'Parent' && selectedChildren.length === 0) {
      newErrors.children = 'Please select at least one child';
    }

    // Check if we already have submission errors related to email
    if (errors.submit?.includes('Email address')) {
      newErrors.email = 'This email is already registered';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error for better UX
      const firstErrorElement = document.querySelector('.error-message');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    // Clear any previous submission errors
    setErrors(prev => ({ ...prev, submit: '' }));
    
    try {
      // First submit the user data normally
      const userData: Partial<User> = { ...formData };
      
      // When creating/updating a user who is a parent, include the selected children
      if (formData.role === 'Parent') {
        userData.childrenIds = selectedChildren;
      }

      // For new users, ensure password is included
      if (!initialData?.id) {
        userData.password = password;
      }
      
      // Submit the updated user data
      await onSubmit(userData);
      
      // Close the form on success
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors({
        ...errors,
        submit: error.message || 'Failed to save user data'
      });
      
      // Scroll to the error message
      setTimeout(() => {
        const errorElement = document.querySelector('.form-error');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to assign children to a parent
  const assignChildrenToParent = async (parentId: string, childrenIds: string[]) => {
    try {
      console.log('Assigning children to parent:', { parentId, childrenIds });
      
      // Update each child's parent_id to point to this parent
      const { data, error } = await supabase
        .from('users')
        .update({ parent_id: parentId })
        .in('id', childrenIds);
      
      if (error) {
        console.error('Error assigning children to parent:', error);
        throw error;
      }
      
      console.log('Successfully assigned children to parent:', data);
      return data;
    } catch (err) {
      console.error('Error in assignChildrenToParent:', err);
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalContent
        as={motion.div}
        initial={{ scale: 0.9, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitleContainer>
            <ModalIcon>
              <FiUserPlus />
            </ModalIcon>
            <div>
              <ModalTitle>{formTitle}</ModalTitle>
              <ModalSubtitle>
                {initialData?.id ? 'Update user information' : 'Create a new user account'}
              </ModalSubtitle>
            </div>
          </ModalTitleContainer>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <FormDivider />

        <form onSubmit={handleSubmit}>
          {errors.submit && (
            <FormErrorContainer className="form-error">
              <FormErrorIcon>⚠️</FormErrorIcon>
              <FormErrorMessage>
                {errors.submit.includes('Email address') ? (
                  <>
                    <strong>Email Already Registered:</strong> {errors.submit}
                  </>
                ) : (
                  errors.submit
                )}
              </FormErrorMessage>
            </FormErrorContainer>
          )}

          <FormSection>
            <SectionTitle>Personal Information</SectionTitle>
            <FormGrid>
              <FormGroup>
                <FormLabel htmlFor="firstName">
                  <FiUser />
                  <span>First Name</span>
                </FormLabel>
                <FormInput
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  $hasError={!!errors.firstName}
                />
                {errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="lastName">
                  <FiUser />
                  <span>Last Name</span>
                </FormLabel>
                <FormInput
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  $hasError={!!errors.lastName}
                />
                {errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="email">
                  <FiMail />
                  <span>Email Address</span>
                </FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => {
                    // Clear duplicate email errors when user types
                    if (errors.submit?.includes('Email address')) {
                      setErrors(prev => ({...prev, submit: ''}));
                    }
                    handleChange(e);
                  }}
                  placeholder="Enter email address"
                  $hasError={!!errors.email || errors.submit?.includes('Email address')}
                />
                {errors.email && (
                  <ErrorMessage>
                    {errors.email.includes('already registered') ? (
                      <><strong>Duplicate:</strong> {errors.email}</>
                    ) : (
                      errors.email
                    )}
                  </ErrorMessage>
                )}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="role">
                  <FiShield />
                  <span>Role</span>
                </FormLabel>
                <FormSelect
                  id="role"
                  name="role"
                  value={formData.role || ''}
                  onChange={handleChange}
                  $hasError={!!errors.role}
                >
                  <option value="">Select a role</option>
                  <option value="Admin">Admin</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Student">Student</option>
                  <option value="Parent">Parent</option>
                </FormSelect>
                {errors.role && <ErrorMessage>{errors.role}</ErrorMessage>}
              </FormGroup>
            </FormGrid>
          </FormSection>

          {!initialData?.id && (
            <FormSection>
              <SectionTitle>Security</SectionTitle>
              <FormGrid>
                <FormGroup>
                  <FormLabel htmlFor="password">
                    <FiLock />
                    <span>Password</span>
                  </FormLabel>
                  <FormInput
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter password"
                    $hasError={!!errors.password}
                  />
                  {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="confirmPassword">
                    <FiLock />
                    <span>Confirm Password</span>
                  </FormLabel>
                  <FormInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm password"
                    $hasError={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
                </FormGroup>
              </FormGrid>
            </FormSection>
          )}

          <FormSection>
            <SectionTitle>Account Status</SectionTitle>
            <FormGrid>
              <FormGroup>
                <FormLabel htmlFor="status">
                  <FiCalendar />
                  <span>Status</span>
                </FormLabel>
                <StatusOptions>
                  <StatusOption
                    $isActive={formData.status === 'active'}
                    $status="active"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, status: 'active' }));
                      // Manually trigger any validation
                      if (errors.status) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.status;
                          return newErrors;
                        });
                      }
                    }}
                  >
                    <StatusRadio
                      id="statusActive"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleChange}
                      aria-labelledby="statusActiveLabelText"
                    />
                    <StatusCheck $isActive={formData.status === 'active'}>
                      <FiCheck />
                    </StatusCheck>
                    <StatusLabel htmlFor="statusActive" id="statusActiveLabelText">Active</StatusLabel>
                  </StatusOption>

                  <StatusOption
                    $isActive={formData.status === 'inactive'}
                    $status="inactive"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, status: 'inactive' }));
                      // Manually trigger any validation
                      if (errors.status) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.status;
                          return newErrors;
                        });
                      }
                    }}
                  >
                    <StatusRadio
                      id="statusInactive"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleChange}
                      aria-labelledby="statusInactiveLabelText"
                    />
                    <StatusCheck $isActive={formData.status === 'inactive'}>
                      <FiCheck />
                    </StatusCheck>
                    <StatusLabel htmlFor="statusInactive" id="statusInactiveLabelText">Inactive</StatusLabel>
                  </StatusOption>
                </StatusOptions>
                {errors.status && <ErrorMessage>{errors.status}</ErrorMessage>}
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Child selection field - only show when Parent role is selected */}
          {formData.role === 'Parent' && (
            <FormSection>
              <SectionTitle>Children</SectionTitle>
              <FormGroup>
                <FormLabel htmlFor="children">
                  <FiUsers />
                  <span>Select Children</span>
                </FormLabel>
                
                {isLoadingStudents ? (
                  <LoadingIndicator>Loading students...</LoadingIndicator>
                ) : availableStudents.length > 0 ? (
                  <>
                    <ChildrenSelectionContainer>
                      {availableStudents.map(student => (
                        <ChildCard 
                          key={student.id} 
                          $isSelected={selectedChildren.includes(student.id)}
                          onClick={() => {
                            if (selectedChildren.includes(student.id)) {
                              setSelectedChildren(selectedChildren.filter(id => id !== student.id));
                            } else {
                              setSelectedChildren([...selectedChildren, student.id]);
                            }
                          }}
                        >
                          <ChildCheckbox $isSelected={selectedChildren.includes(student.id)}>
                            {selectedChildren.includes(student.id) && <FiCheck />}
                          </ChildCheckbox>
                          <ChildInfo>
                            <ChildName>{student.firstName} {student.lastName}</ChildName>
                            <ChildEmail>{student.email}</ChildEmail>
                          </ChildInfo>
                        </ChildCard>
                      ))}
                    </ChildrenSelectionContainer>
                    <SelectionSummary>
                      {selectedChildren.length === 0 ? (
                        <span>No children selected</span>
                      ) : (
                        <span>Selected: <strong>{selectedChildren.length}</strong> {selectedChildren.length === 1 ? 'child' : 'children'}</span>
                      )}
                    </SelectionSummary>
                  </>
                ) : (
                  <EmptyChildrenMessage>No students available for selection</EmptyChildrenMessage>
                )}
                {errors.children && <ErrorMessage>{errors.children}</ErrorMessage>}
              </FormGroup>
            </FormSection>
          )}

          <FormDivider />

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData?.id ? 'Update User' : 'Create User'}
            </SubmitButton>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing[4]};
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: ${props => props.theme.spacing[6]};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const ModalTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
`;

const ModalIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.full};
  background-color: ${props => `${props.theme.colors.primary[500]}15`};
  color: ${props => props.theme.colors.primary[600]};
  font-size: 1.5rem;
  box-shadow: 0 0 0 6px ${props => `${props.theme.colors.primary[500]}05`};
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
`;

const ModalSubtitle = styled.p`
  margin: ${props => props.theme.spacing[1]} 0 0 0;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  opacity: 0.9;
`;

const FormDivider = styled.div`
  height: 1px;
  background-color: ${props => `${props.theme.colors.border}80`};
  margin: ${props => props.theme.spacing[5]} 0;
  opacity: 0.8;
`;

const FormSection = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[5]};
`;

const SectionTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing[4]} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};

  &::before {
    content: "";
    display: block;
    width: 3px;
    height: 18px;
    background-color: ${props => props.theme.colors.primary[500]};
    border-radius: ${props => props.theme.borderRadius.full};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.full};
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    background-color: ${props => props.theme.colors.background.tertiary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing[6]};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[2]};
  margin-bottom: ${props => props.theme.spacing[1]};
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing[1]};

  svg {
    color: ${props => props.theme.colors.primary[400]};
    font-size: 1rem;
  }
`;

interface FormInputProps {
  $hasError?: boolean;
}

const FormInput = styled.input<FormInputProps>`
  padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
  border: 1px solid ${props => props.$hasError
    ? props.theme.colors.accent.red
    : props.theme.colors.neutral[300]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.95rem;
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  height: 44px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError
      ? props.theme.colors.accent.red
      : props.theme.colors.primary[400]};
    box-shadow: ${props => props.$hasError
      ? '0 0 0 3px rgba(220, 38, 38, 0.1)'
      : '0 0 0 3px rgba(99, 102, 241, 0.15)'};
    transform: translateY(-1px);
  }

  &:hover:not(:focus) {
    border-color: ${props => props.$hasError
      ? props.theme.colors.accent.red
      : props.theme.colors.primary[200]};
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
    opacity: 0.7;
  }
`;

const FormSelect = styled.select<FormInputProps>`
  padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
  border: 1px solid ${props => props.$hasError
    ? props.theme.colors.accent.red
    : props.theme.colors.neutral[300]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.95rem;
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  height: 44px;
  width: 100%;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError
      ? props.theme.colors.accent.red
      : props.theme.colors.primary[400]};
    box-shadow: ${props => props.$hasError
      ? '0 0 0 3px rgba(220, 38, 38, 0.1)'
      : '0 0 0 3px rgba(99, 102, 241, 0.15)'};
    transform: translateY(-1px);
  }

  &:hover:not(:focus) {
    border-color: ${props => props.$hasError
      ? props.theme.colors.accent.red
      : props.theme.colors.primary[200]};
  }
`;

const StatusOptions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing[3]};
  margin-top: ${props => props.theme.spacing[1]};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    width: 100%;
  }
`;

interface StatusOptionProps {
  $isActive: boolean;
  $status: 'active' | 'inactive';
}

const StatusOption = styled.div<StatusOptionProps>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.$isActive
    ? props.$status === 'active'
      ? props.theme.colors.success[500]
      : props.theme.colors.warning[500]
    : props.theme.colors.neutral[300]
  };
  background-color: ${props => props.$isActive
    ? props.$status === 'active'
      ? props.theme.colors.success[50]
      : props.theme.colors.warning[50]
    : 'transparent'
  };
  box-shadow: ${props => props.$isActive ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none'};
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 150px;
  position: relative;
  user-select: none;

  &:hover {
    background-color: ${props => {
      if (props.$isActive) {
        return props.$status === 'active'
          ? props.theme.colors.success[100]
          : props.theme.colors.warning[100];
      }
      return props.theme.colors.background.tertiary;
    }};
    border-color: ${props => {
      if (props.$isActive) {
        return props.$status === 'active'
          ? props.theme.colors.success[600]
          : props.theme.colors.warning[600];
      }
      return props.theme.colors.primary[200];
    }};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

const StatusRadio = styled.input.attrs({ type: 'radio' })`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 1;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
`;

interface StatusCheckProps {
  $isActive: boolean;
}

const StatusCheck = styled.div<StatusCheckProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${props => props.theme.borderRadius.full};
  border: 2px solid ${props => props.$isActive
    ? props.theme.colors.primary[500]
    : props.theme.colors.text.tertiary
  };
  color: white;
  background-color: ${props => props.$isActive
    ? props.theme.colors.primary[500]
    : 'transparent'
  };
  transition: all ${props => props.theme.transition.fast};
  flex-shrink: 0;

  svg {
    opacity: ${props => props.$isActive ? 1 : 0};
    font-size: 14px;
    transition: all ${props => props.theme.transition.fast};
  }
`;

const StatusLabel = styled.label`
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  color: ${props => props.theme.colors.text.primary};
  transition: color ${props => props.theme.transition.fast};

  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
`;

const ErrorMessage = styled.div.attrs(() => ({
  className: 'error-message'
}))`
  color: ${props => props.theme.colors.accent.red};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing[1]};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[1]};

  &::before {
    content: "⚠";
    font-size: 0.8rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing[3]};
  margin-top: ${props => props.theme.spacing[6]};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[5]}`};
  background-color: transparent;
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};
  min-width: 120px;

  &:hover {
    background-color: ${props => props.theme.colors.background.tertiary};
    border-color: ${props => props.theme.colors.neutral[400]};
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    order: 2;
  }
`;

const SubmitButton = styled.button`
  padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[5]}`};
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    order: 1;
    margin-bottom: ${props => props.theme.spacing[2]};
  }
`;

// New styled component for help text
const HelpText = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

// New styled component for loading indicator
const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
`;

// New styled component for children selection container
const ChildrenSelectionContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${props => props.theme.spacing[3]};
  max-height: 300px;
  overflow-y: auto;
  padding: ${props => props.theme.spacing[2]};
  border: 1px solid ${props => props.theme.colors.neutral[200]};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.background.primary};
`;

// New styled component for child card
const ChildCard = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing[3]};
  border: 2px solid ${props => props.$isSelected ? props.theme.colors.primary[500] : props.theme.colors.neutral[200]};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isSelected ? `${props.theme.colors.primary[50]}` : props.theme.colors.background.primary};
  box-shadow: ${props => props.$isSelected ? `0 2px 4px rgba(99, 102, 241, 0.15)` : 'none'};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary[400]};
    background-color: ${props => props.$isSelected ? `${props.theme.colors.primary[50]}` : props.theme.colors.background.secondary};
    transform: translateY(-1px);
  }
`;

// New styled component for child checkbox
const ChildCheckbox = styled.div<{ $isSelected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 2px solid ${props => props.$isSelected ? props.theme.colors.primary[500] : props.theme.colors.neutral[300]};
  margin-right: ${props => props.theme.spacing[3]};
  transition: all 0.2s ease;
  background-color: ${props => props.$isSelected ? props.theme.colors.primary[500] : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  
  svg {
    font-size: 12px;
  }
`;

// New styled component for child info
const ChildInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// New styled component for child name
const ChildName = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// New styled component for child email
const ChildEmail = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// New styled component for selection summary
const SelectionSummary = styled.div`
  margin-top: ${props => props.theme.spacing[3]};
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  
  strong {
    color: ${props => props.theme.colors.primary[600]};
    margin: 0 4px;
  }
`;

// New styled component for empty children message
const EmptyChildrenMessage = styled.div`
  padding: ${props => props.theme.spacing[4]};
  text-align: center;
  border: 1px dashed ${props => props.theme.colors.neutral[300]};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing[2]};
`;

// Form error display components
const FormErrorContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing[4]};
  padding: ${props => props.theme.spacing[4]};
  background-color: ${props => `${props.theme.colors.danger[50]}`};
  border-left: 4px solid ${props => props.theme.colors.danger[500]};
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing[3]};
`;

const FormErrorIcon = styled.div`
  font-size: 1.2rem;
  line-height: 1;
`;

const FormErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger[700]};
  font-size: 0.95rem;
  line-height: 1.5;
`;

export default UserForm;