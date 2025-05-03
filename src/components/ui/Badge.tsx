import React from 'react';
import styled from 'styled-components';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className,
  ...props 
}) => {
  return (
    <StyledBadge 
      $variant={variant}
      className={className}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

const StyledBadge = styled.span<{ $variant: BadgeProps['variant'] }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return `
          background-color: ${theme.colors.success[500] + '20' || '#10b98120'};
          color: ${theme.colors.success[500] || '#10b981'};
        `;
      case 'warning':
        return `
          background-color: ${theme.colors.warning[500] + '20' || '#f59e0b20'};
          color: ${theme.colors.warning[500] || '#f59e0b'};
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.danger[500] + '20' || '#ef444420'};
          color: ${theme.colors.danger[500] || '#ef4444'};
        `;
      case 'info':
        return `
          background-color: ${theme.colors.primary[500] + '20' || '#3b82f620'};
          color: ${theme.colors.primary[500] || '#3b82f6'};
        `;
      default:
        return `
          background-color: ${theme.colors.neutral[500] + '20' || '#6b728020'};
          color: ${theme.colors.neutral[700] || '#374151'};
        `;
    }
  }}
`;

export default Badge; 