import React from 'react';
import styled from 'styled-components';
import { useThemeContext } from '../../App';
import { Card, Switch, Divider } from '../common/DarkModeElements';
import { FiSun, FiMoon } from 'react-icons/fi';
import { IoMdColorPalette } from 'react-icons/io';

const Container = styled.div`
  padding: 1.5rem;
`;

const Header = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borders.radius.md};
  margin-bottom: 0.5rem;
`;

const OptionLabel = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
`;

const OptionDescription = styled.p`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 0.25rem;
`;

const ColorOptions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ColorOption = styled.button<{ color: string; isSelected: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 2px solid ${props => props.isSelected
    ? props.theme.colors.primary[500]
    : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isSelected
    ? `0 0 0 2px ${props.theme.colors.primary[500]}40`
    : 'none'};

  &:hover {
    transform: scale(1.1);
  }
`;

const ThemeToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ThemeIcon = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.active
    ? props.theme.colors.primary[500]
    : props.theme.colors.text.secondary};
  font-size: 1.25rem;
  transition: all 0.2s ease;
`;

// Theme color options
const themeColors = [
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Green', color: '#10b981' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Indigo', color: '#6366f1' },
];

const AppearanceSettings: React.FC = () => {
  const { isDarkMode, toggleTheme, setPrimaryColor, primaryColor } = useThemeContext();

  return (
    <Container>
      <Header>Appearance</Header>

      <Section>
        <SectionTitle>
          <FiSun /> / <FiMoon /> Theme
        </SectionTitle>

        <OptionContainer>
          <div>
            <OptionLabel>Dark Mode</OptionLabel>
            <OptionDescription>
              Switch between light and dark theme
            </OptionDescription>
          </div>

          <ThemeToggleContainer>
            <ThemeIcon active={!isDarkMode}>
              <FiSun />
            </ThemeIcon>

            <Switch>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleTheme}
              />
              <span />
            </Switch>

            <ThemeIcon active={isDarkMode}>
              <FiMoon />
            </ThemeIcon>
          </ThemeToggleContainer>
        </OptionContainer>
      </Section>

      <Divider />

      <Section>
        <SectionTitle>
          <IoMdColorPalette /> Theme Color
        </SectionTitle>

        <OptionContainer>
          <div>
            <OptionLabel>Accent Color</OptionLabel>
            <OptionDescription>
              Choose your preferred accent color for buttons and highlights
            </OptionDescription>
          </div>
        </OptionContainer>

        <ColorOptions>
          {themeColors.map(color => (
            <ColorOption
              key={color.name}
              color={color.color}
              isSelected={primaryColor === color.color}
              onClick={() => setPrimaryColor(color.color)}
              aria-label={`Select ${color.name} theme color`}
            />
          ))}
        </ColorOptions>
      </Section>
    </Container>
  );
};

export default AppearanceSettings;