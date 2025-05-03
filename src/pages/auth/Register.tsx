import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import supabase from '../../config/supabaseClient';
import { toast } from 'react-toastify';
import RoleSelector from '../../components/common/RoleSelector';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [roleId, setRoleId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle role selection
  const handleRoleChange = (value: string) => {
    setRoleId(value);
    
    // Clear role error when user selects
    if (errors.role) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.role;
        return newErrors;
      });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!roleId) {
      newErrors.role = 'Role selection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Step 1: Create the user in auth.users
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        
        if (authError) {
          throw authError;
        }
        
        if (authData.user) {
          // Step 2: Add user details to public.users table
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: formData.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              role_id: roleId,
              created_at: new Date().toISOString(),
            });
          
          if (profileError) {
            throw profileError;
          }
          
          // Success
          toast.success('Registration successful! Please check your email to verify your account.');
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        toast.error(error.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <PageContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <FormCard
        as={motion.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <FormTitle>Create an Account</FormTitle>
        <FormSubtitle>Sign up to get started with our LMS</FormSubtitle>
        
        <Form onSubmit={handleSubmit}>
          <InputRow>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <InputWrapper>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  $hasError={!!errors.firstName}
                />
                <InputIcon><FiUser /></InputIcon>
              </InputWrapper>
              {errors.firstName && <ErrorMessage>{errors.firstName}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <InputWrapper>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  $hasError={!!errors.lastName}
                />
                <InputIcon><FiUser /></InputIcon>
              </InputWrapper>
              {errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
            </FormGroup>
          </InputRow>
          
          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <InputWrapper>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                $hasError={!!errors.email}
              />
              <InputIcon><FiMail /></InputIcon>
            </InputWrapper>
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="role">Role</Label>
            <RoleSelector 
              value={roleId}
              onChange={handleRoleChange}
              placeholder="Select a role"
              error={errors.role}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <InputWrapper>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                $hasError={!!errors.password}
              />
              <InputIcon><FiLock /></InputIcon>
            </InputWrapper>
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <InputWrapper>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                $hasError={!!errors.confirmPassword}
              />
              <InputIcon><FiLock /></InputIcon>
            </InputWrapper>
            {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
          </FormGroup>
          
          <SubmitButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
            <FiArrowRight />
          </SubmitButton>
        </Form>
        
        <LoginPrompt>
          Already have an account? <LoginLink to="/login">Sign in</LoginLink>
        </LoginPrompt>
      </FormCard>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: ${props => props.theme.colors.background.light};
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 550px;
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
`;

const FormTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 8px 0;
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
`;

const InputWrapper = styled.div`
  position: relative;
`;

interface InputProps {
  $hasError: boolean;
}

const Input = styled.input<InputProps>`
  width: 100%;
  padding: 10px 12px 10px 40px;
  font-size: 14px;
  border: 1px solid ${props => props.$hasError 
    ? props.theme.colors.danger[500] 
    : props.theme.colors.border.light};
  border-radius: 6px;
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.background.primary};
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError 
      ? props.theme.colors.danger[500] 
      : props.theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${props => props.$hasError 
      ? props.theme.colors.danger[100] 
      : props.theme.colors.primary[100]};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.tertiary};
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger[500]};
  font-size: 12px;
  margin-top: -4px;
`;

const SubmitButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[600]};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.primary[300]};
    cursor: not-allowed;
  }
  
  svg {
    font-size: 18px;
  }
`;

const LoginPrompt = styled.div`
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const LoginLink = styled(Link)`
  color: ${props => props.theme.colors.primary[500]};
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default Register; 