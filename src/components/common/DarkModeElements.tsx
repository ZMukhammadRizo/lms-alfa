import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

// Card component with dark mode support
export const Card = styled.div`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borders.radius.lg};
  box-shadow: ${props => props.theme.colors.shadow.sm};
  border: 1px solid ${props => props.theme.colors.border.light};
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: ${props => props.theme.colors.shadow.md};
  }
`;

// Animated Card component
export const AnimatedCard = styled(motion.div)`
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borders.radius.lg};
  box-shadow: ${props => props.theme.colors.shadow.sm};
  border: 1px solid ${props => props.theme.colors.border.light};
  overflow: hidden;
  transition: all 0.3s ease;
`;

// Paper component (for modals, dialogs, popovers)
export const Paper = styled.div`
  background-color: ${props => props.theme.colors.background.paper};
  border-radius: ${props => props.theme.borders.radius.lg};
  box-shadow: ${props => props.theme.colors.shadow.md};
  border: 1px solid ${props => props.theme.colors.border.light};
  padding: 1.5rem;
`;

// Button variants
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  elevated?: boolean;
  rounded?: boolean;
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  border-radius: ${props => props.rounded
    ? props.theme.borders.radius.full
    : props.theme.borders.radius.md};
  transition: all 0.2s ease;
  gap: 0.5rem;
  cursor: pointer;
  width: ${props => props.fullWidth ? '100%' : 'auto'};

  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'sm':
        return css`
          padding: 0.5rem 0.75rem;
          font-size: ${props.theme.typography.fontSize.sm};
        `;
      case 'lg':
        return css`
          padding: 0.75rem 1.5rem;
          font-size: ${props.theme.typography.fontSize.lg};
        `;
      default: // md
        return css`
          padding: 0.625rem 1.25rem;
          font-size: ${props.theme.typography.fontSize.md};
        `;
    }
  }}

  /* Elevation */
  ${props => props.elevated && css`
    box-shadow: ${props.theme.colors.shadow.sm};

    &:hover {
      box-shadow: ${props.theme.colors.shadow.md};
      transform: translateY(-2px);
    }
  `}

  /* Variants */
  ${props => {
    switch (props.variant) {
      case 'primary':
        return css`
          background-color: ${props.theme.colors.primary[500]};
          color: white;
          border: none;

          &:hover, &:focus {
            background-color: ${props.theme.colors.primary[600]};
          }

          &:active {
            background-color: ${props.theme.colors.primary[700]};
          }
        `;
      case 'secondary':
        return css`
          background-color: ${props.theme.isDark ? props.theme.colors.neutral[700] : props.theme.colors.neutral[200]};
          color: ${props.theme.isDark ? props.theme.colors.text.primary : props.theme.colors.neutral[800]};
          border: none;

          &:hover, &:focus {
            background-color: ${props.theme.isDark ? props.theme.colors.neutral[600] : props.theme.colors.neutral[300]};
          }

          &:active {
            background-color: ${props.theme.isDark ? props.theme.colors.neutral[500] : props.theme.colors.neutral[400]};
          }
        `;
      case 'danger':
        return css`
          background-color: ${props.theme.colors.danger[500]};
          color: white;
          border: none;

          &:hover, &:focus {
            background-color: ${props.theme.colors.danger[600]};
          }

          &:active {
            background-color: ${props.theme.colors.danger[700]};
          }
        `;
      case 'success':
        return css`
          background-color: ${props.theme.colors.success[500]};
          color: white;
          border: none;

          &:hover, &:focus {
            background-color: ${props.theme.colors.success[600]};
          }

          &:active {
            background-color: ${props.theme.colors.success[700]};
          }
        `;
      case 'warning':
        return css`
          background-color: ${props.theme.colors.warning[500]};
          color: ${props.theme.isDark ? props.theme.colors.neutral[900] : 'white'};
          border: none;

          &:hover, &:focus {
            background-color: ${props.theme.colors.warning[600]};
          }

          &:active {
            background-color: ${props.theme.colors.warning[700]};
          }
        `;
      case 'ghost':
        return css`
          background-color: transparent;
          color: ${props.theme.colors.text.primary};
          border: none;

          &:hover, &:focus {
            background-color: ${props.theme.colors.action.hover};
          }

          &:active {
            background-color: ${props.theme.colors.action.selected};
          }
        `;
      default:
        return css`
          background-color: transparent;
          color: ${props.theme.colors.text.primary};
          border: 1px solid ${props.theme.colors.border.light};

          &:hover, &:focus {
            background-color: ${props.theme.colors.action.hover};
          }

          &:active {
            background-color: ${props.theme.colors.action.selected};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

// Input component optimized for dark mode
export const Input = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: ${props => props.theme.colors.background.input};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.input};
  border-radius: ${props => props.theme.borders.radius.md};
  font-size: ${props => props.theme.typography.fontSize.md};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.border.focus};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}40;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.hint};
  }

  &:disabled {
    background-color: ${props => props.theme.isDark ? '#1e1e1e' : '#f3f4f6'};
    color: ${props => props.theme.colors.text.disabled};
    cursor: not-allowed;
  }
`;

// Textarea component
export const Textarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: ${props => props.theme.colors.background.input};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.input};
  border-radius: ${props => props.theme.borders.radius.md};
  font-size: ${props => props.theme.typography.fontSize.md};
  transition: all 0.2s ease;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.border.focus};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}40;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.hint};
  }

  &:disabled {
    background-color: ${props => props.theme.isDark ? '#1e1e1e' : '#f3f4f6'};
    color: ${props => props.theme.colors.text.disabled};
    cursor: not-allowed;
  }
`;

// Badge component
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  border-radius: ${props => props.theme.borders.radius.full};

  ${props => {
    switch (props.variant) {
      case 'primary':
        return css`
          background-color: ${props.theme.isDark
            ? props.theme.colors.primary[500] + '30'
            : props.theme.colors.primary[100]};
          color: ${props.theme.isDark
            ? props.theme.colors.primary[300]
            : props.theme.colors.primary[800]};
        `;
      case 'danger':
        return css`
          background-color: ${props.theme.isDark
            ? props.theme.colors.danger[500] + '30'
            : props.theme.colors.danger[100]};
          color: ${props.theme.isDark
            ? props.theme.colors.danger[300]
            : props.theme.colors.danger[800]};
        `;
      case 'success':
        return css`
          background-color: ${props.theme.isDark
            ? props.theme.colors.success[500] + '30'
            : props.theme.colors.success[100]};
          color: ${props.theme.isDark
            ? props.theme.colors.success[300]
            : props.theme.colors.success[800]};
        `;
      case 'warning':
        return css`
          background-color: ${props.theme.isDark
            ? props.theme.colors.warning[500] + '30'
            : props.theme.colors.warning[100]};
          color: ${props.theme.isDark
            ? props.theme.colors.warning[300]
            : props.theme.colors.warning[800]};
        `;
      case 'info':
        return css`
          background-color: ${props.theme.isDark
            ? props.theme.colors.info[500] + '30'
            : props.theme.colors.info[100]};
          color: ${props.theme.isDark
            ? props.theme.colors.info[300]
            : props.theme.colors.info[800]};
        `;
      default:
        return css`
          background-color: ${props.theme.isDark
            ? props.theme.colors.neutral[600]
            : props.theme.colors.neutral[200]};
          color: ${props.theme.isDark
            ? props.theme.colors.neutral[200]
            : props.theme.colors.neutral[700]};
        `;
    }
  }}
`;

// Avatar component
interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = styled.div<AvatarProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${props => props.theme.colors.primary[500]};
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.medium};

  ${props => {
    switch (props.size) {
      case 'xs':
        return css`
          width: 24px;
          height: 24px;
          font-size: ${props.theme.typography.fontSize.xs};
        `;
      case 'sm':
        return css`
          width: 32px;
          height: 32px;
          font-size: ${props.theme.typography.fontSize.sm};
        `;
      case 'lg':
        return css`
          width: 48px;
          height: 48px;
          font-size: ${props.theme.typography.fontSize.xl};
        `;
      case 'xl':
        return css`
          width: 64px;
          height: 64px;
          font-size: ${props.theme.typography.fontSize['2xl']};
        `;
      default: // md
        return css`
          width: 40px;
          height: 40px;
          font-size: ${props.theme.typography.fontSize.md};
        `;
    }
  }}

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Dark mode optimized divider
export const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: ${props => props.theme.colors.border.divider};
  margin: 1.5rem 0;
`;

// Text component
interface TextProps {
  variant?: 'body' | 'small' | 'caption' | 'subtitle' | 'lead';
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'error' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export const Text = styled.p<TextProps>`
  margin: 0;
  color: ${props => {
    switch (props.color) {
      case 'secondary':
        return props.theme.colors.text.secondary;
      case 'tertiary':
        return props.theme.colors.text.tertiary;
      case 'accent':
        return props.theme.colors.primary[500];
      case 'error':
        return props.theme.colors.danger[500];
      case 'success':
        return props.theme.colors.success[500];
      default:
        return props.theme.colors.text.primary;
    }
  }};

  font-weight: ${props => {
    switch (props.weight) {
      case 'medium':
        return props.theme.typography.fontWeight.medium;
      case 'semibold':
        return props.theme.typography.fontWeight.semibold;
      case 'bold':
        return props.theme.typography.fontWeight.bold;
      default:
        return props.theme.typography.fontWeight.normal;
    }
  }};

  font-size: ${props => {
    switch (props.variant) {
      case 'small':
        return props.theme.typography.fontSize.sm;
      case 'caption':
        return props.theme.typography.fontSize.xs;
      case 'subtitle':
        return props.theme.typography.fontSize.lg;
      case 'lead':
        return props.theme.typography.fontSize.xl;
      default:
        return props.theme.typography.fontSize.md;
    }
  }};

  line-height: ${props => props.theme.typography.lineHeight.normal};
  text-align: ${props => props.align || 'left'};
`;

// Container for layouts
export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (min-width: ${props => props.theme.breakpoints?.md || '768px'}) {
    padding: 0 2rem;
  }
`;

// Tooltip component
export const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 0.75rem;
  background-color: ${props => props.theme.isDark ? props.theme.colors.neutral[800] : props.theme.colors.neutral[900]};
  color: white;
  border-radius: ${props => props.theme.borders.radius.md};
  font-size: ${props => props.theme.typography.fontSize.xs};
  z-index: ${props => props.theme.zIndices?.tooltip || 1000};
  white-space: nowrap;
  box-shadow: ${props => props.theme.colors.shadow.lg};

  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: ${props => props.theme.isDark ? props.theme.colors.neutral[800] : props.theme.colors.neutral[900]};
  }
`;

// Switch component (toggle)
export const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + span {
      background-color: ${props => props.theme.colors.primary[500]};
    }

    &:checked + span:before {
      transform: translateX(20px);
    }

    &:focus + span {
      box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}40;
    }

    &:disabled + span {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${props => props.theme.isDark ? props.theme.colors.neutral[600] : props.theme.colors.neutral[300]};
    transition: .3s;
    border-radius: 34px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
  }
`;

// Helper hook to add dark mode classes to component
export const useDarkModeClass = () => {
  return {
    // Helper to add dark mode class to an element
    getDarkClass: (baseClass = '') => {
      return `${baseClass} dark-mode-ready`;
    }
  };
};

export default {
  Card,
  Button,
  Input,
  Textarea,
  Badge,
  Avatar,
  Divider,
  Container,
  Tooltip,
  Switch,
  Text,
  useDarkModeClass
};