import React from 'react';
import styled from 'styled-components';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterText>
          &copy; {currentYear} Learning Management System. All rights reserved.
        </FooterText>
        <FooterLinks>
          <FooterLink href="#">Privacy Policy</FooterLink>
          <FooterLink href="#">Terms of Service</FooterLink>
          <FooterLink href="#">Help Center</FooterLink>
        </FooterLinks>
      </FooterContent>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  background-color: ${props => props.theme.colors.background.primary};
  border-top: 1px solid ${props => props.theme.colors.border.light};
  padding: ${props => props.theme.spacing[4]};
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing[2]};
  }
`;

const FooterText = styled.p`
  color: ${props => props.theme.colors.text.tertiary};
  font-size: 0.875rem;
  margin: 0;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing[4]};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing[1]};
    align-items: center;
  }
`;

const FooterLink = styled.a`
  color: ${props => props.theme.colors.text.tertiary};
  text-decoration: none;
  font-size: 0.875rem;
  transition: color ${props => props.theme.transition.fast};
  
  &:hover {
    color: ${props => props.theme.colors.primary[600]};
    text-decoration: underline;
  }
`;

export default Footer; 