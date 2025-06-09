import React, { ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

type ColorType = 'primary' | 'green' | 'yellow' | 'purple' | 'red';

interface ColorProps {
  $color: ColorType;
}

interface StatCardProps {
	icon: ReactNode
	title: string
	value: string | number
	change: string
	color: ColorType
	isLoading?: boolean
}

const getColorValue = (color: ColorType, theme: any) => {
  switch (color) {
    case 'primary':
      return theme.colors.primary[600];
    case 'green':
      return theme.colors.success[500];
    case 'yellow':
      return theme.colors.warning[500];
    case 'purple':
      return theme.colors.purple[500];
    case 'red':
      return theme.colors.danger[500];
    default:
      return theme.colors.primary[600];
  }
};

const getColorLight = (color: ColorType, theme: any) => {
  switch (color) {
    case 'primary':
      return theme.colors.primary[50];
    case 'green':
      return theme.colors.success[50];
    case 'yellow':
      return theme.colors.warning[50];
    case 'purple':
      return theme.colors.purple[50];
    case 'red':
      return theme.colors.danger[50];
    default:
      return theme.colors.primary[50];
  }
};

const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
`;

const CardContainer = styled.div<ColorProps>`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[5]};
  box-shadow: ${props => props.theme.shadows.sm};
  border-left: 4px solid ${props => getColorValue(props.$color, props.theme)};
  border-top: 1px solid ${props => props.theme.colors.border.light};
  border-right: 1px solid ${props => props.theme.colors.border.light};
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => getColorValue(props.$color, props.theme)};
  }
`;

const IconWrapper = styled.div<ColorProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background-color: ${props =>
    props.theme.colors.background.primary === '#0f172a'
      ? getColorValue(props.$color, props.theme) + '22' // More subtle in dark mode
      : getColorLight(props.$color, props.theme)
  };
  color: ${props => getColorValue(props.$color, props.theme)};
  font-size: 1.5rem;
  margin-right: ${props => props.theme.spacing[4]};
`;

const Content = styled.div`
  flex: 1;
`;

const Value = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing[1]};
`;

const Title = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing[2]};
`;

// Loading skeleton elements
const Skeleton = styled.div`
  background-color: ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const ValueSkeleton = styled(Skeleton)`
  height: 30px;
  width: 70%;
  margin-bottom: ${props => props.theme.spacing[1]};
`;

const TitleSkeleton = styled(Skeleton)`
  height: 16px;
  width: 90%;
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const ChangeSkeleton = styled(Skeleton)`
  height: 14px;
  width: 40%;
`;

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, isLoading = false }) => {
	

  return (
    <CardContainer $color={color}>
      <IconWrapper $color={color}>{icon}</IconWrapper>
      <Content>
        {isLoading ? (
          <>
            <ValueSkeleton />
            <TitleSkeleton />
            <ChangeSkeleton />
          </>
        ) : (
          <>
            <Value>{value}</Value>
            <Title>{title}</Title>
          </>
        )}
      </Content>
    </CardContainer>
  );
};

export default StatCard;