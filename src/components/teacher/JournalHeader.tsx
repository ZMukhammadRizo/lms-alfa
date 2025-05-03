import React, { useState } from 'react';
import styled from 'styled-components';

type Quarter = '1-chorak' | '2-chorak' | '3-chorak' | '4-chorak' | 'year';

interface JournalHeaderProps {
  className: string;
  subjectName: string;
  selectedQuarter: Quarter;
  onQuarterChange: (quarter: Quarter) => void;
  onBackClick: () => void;
}

const JournalHeader: React.FC<JournalHeaderProps> = ({
  className,
  subjectName,
  selectedQuarter,
  onQuarterChange,
  onBackClick,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleQuarterSelect = (quarter: Quarter) => {
    onQuarterChange(quarter);
    setShowDropdown(false);
  };

  return (
    <HeaderContainer>
      <HeaderInfo>
        <TitleArea>
          <Title>{subjectName}</Title>
          <Subtitle>{className}</Subtitle>
        </TitleArea>
      </HeaderInfo>

      <Controls>
        <QuarterSelector>
          <QuarterButton onClick={() => setShowDropdown(!showDropdown)}>
            {selectedQuarter}
            <DropdownIcon $isOpen={showDropdown}>▼</DropdownIcon>
          </QuarterButton>

          {showDropdown && (
            <DropdownMenu>
              <DropdownItem
                onClick={() => handleQuarterSelect('1-chorak')}
                $isActive={selectedQuarter === '1-chorak'}
              >
                1-chorak
              </DropdownItem>
              <DropdownItem
                onClick={() => handleQuarterSelect('2-chorak')}
                $isActive={selectedQuarter === '2-chorak'}
              >
                2-chorak
              </DropdownItem>
              <DropdownItem
                onClick={() => handleQuarterSelect('3-chorak')}
                $isActive={selectedQuarter === '3-chorak'}
              >
                3-chorak
              </DropdownItem>
              <DropdownItem
                onClick={() => handleQuarterSelect('4-chorak')}
                $isActive={selectedQuarter === '4-chorak'}
              >
                4-chorak
              </DropdownItem>
              <DropdownItem
                onClick={() => handleQuarterSelect('year')}
                $isActive={selectedQuarter === 'year'}
              >
                year
              </DropdownItem>
            </DropdownMenu>
          )}
        </QuarterSelector>
      </Controls>
    </HeaderContainer>
  );
};

// Styled Components
const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[500]};
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary[600]};
  }
`;

const BackIcon = styled.span`
  font-size: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
`;

const Subtitle = styled.h2`
  font-size: 1rem;
  font-weight: 500;
  margin: 0.25rem 0 0;
  color: ${props => props.theme.colors.text.secondary};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const QuarterSelector = styled.div`
  position: relative;
`;

const QuarterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

interface DropdownIconProps {
  $isOpen: boolean;
}

const DropdownIcon = styled.span<DropdownIconProps>`
  font-size: 0.6rem;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s ease;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  background-color: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.md};
  min-width: 150px;
  z-index: 10;
  overflow: hidden;
`;

interface DropdownItemProps {
  $isActive: boolean;
}

const DropdownItem = styled.div<DropdownItemProps>`
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  background-color: ${props => props.$isActive
    ? props.theme.colors.primary[50]
    : props.theme.colors.background.secondary};
  color: ${props => props.$isActive
    ? props.theme.colors.primary[700]
    : props.theme.colors.text.primary};

  &:hover {
    background-color: ${props => props.$isActive
      ? props.theme.colors.primary[50]
      : props.theme.colors.background.hover};
  }
`;

export default JournalHeader;