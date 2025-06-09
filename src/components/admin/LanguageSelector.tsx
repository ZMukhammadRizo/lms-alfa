import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇺🇸'
  },
  { 
    code: 'uz', 
    name: 'Uzbek', 
    nativeName: "O'zbekcha", 
    flag: '🇺🇿'
  },
  { 
    code: 'ru', 
    name: 'Russian', 
    nativeName: 'Русский', 
    flag: '🇷🇺'
  },
];

// SVG flag components
const USFlag: React.FC = () => (
  <svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="16" fill="#B22234"/>
    <rect width="24" height="1.23" y="1.23" fill="white"/>
    <rect width="24" height="1.23" y="3.69" fill="white"/>
    <rect width="24" height="1.23" y="6.15" fill="white"/>
    <rect width="24" height="1.23" y="8.62" fill="white"/>
    <rect width="24" height="1.23" y="11.08" fill="white"/>
    <rect width="24" height="1.23" y="13.54" fill="white"/>
    <rect width="9.6" height="8.8" fill="#3C3B6E"/>
  </svg>
);

const UZFlag: React.FC = () => (
  <svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="5.33" fill="#04AAC8"/>
    <rect width="24" height="5.33" y="5.33" fill="white"/>
    <rect width="24" height="5.33" y="10.67" fill="#00B04F"/>
    <rect width="24" height="0.8" y="4.53" fill="#CE1126"/>
    <rect width="24" height="0.8" y="10.67" fill="#CE1126"/>
  </svg>
);

const RUFlag: React.FC = () => (
  <svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="5.33" fill="white"/>
    <rect width="24" height="5.33" y="5.33" fill="#0039A6"/>
    <rect width="24" height="5.33" y="10.67" fill="#D52B1E"/>
  </svg>
);

const getFlagComponent = (code: string) => {
  switch (code) {
    case 'en': return <USFlag />;
    case 'uz': return <UZFlag />;
    case 'ru': return <RUFlag />;
    default: return <USFlag />;
  }
};

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('selectedLanguage', languageCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <LanguageSelectorContainer ref={dropdownRef}>
      <SelectorButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        <CurrentLanguage>
          <FlagIcon>
            {getFlagComponent(currentLanguage.code)}
          </FlagIcon>
          <LanguageInfo>
            <LanguageCode>{currentLanguage.code.toUpperCase()}</LanguageCode>
          </LanguageInfo>
        </CurrentLanguage>
        <ChevronIcon $isOpen={isOpen}>
          <FiChevronDown size={14} />
        </ChevronIcon>
      </SelectorButton>

      <DropdownContainer $isOpen={isOpen}>
        <DropdownList>
          {languages.map((language) => {
            const isActive = language.code === i18n.language;
            return (
              <LanguageOption
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                $isActive={isActive}
              >
                <OptionLeft>
                  <FlagIcon>
                    {getFlagComponent(language.code)}
                  </FlagIcon>
                  <LanguageDetails>
                    <PrimaryText>{language.nativeName}</PrimaryText>
                    <SecondaryText>{language.name}</SecondaryText>
                  </LanguageDetails>
                </OptionLeft>
                {isActive && (
                  <CheckIcon>
                    <FiCheck size={16} />
                  </CheckIcon>
                )}
              </LanguageOption>
            );
          })}
        </DropdownList>
      </DropdownContainer>

      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}
    </LanguageSelectorContainer>
  );
};

const LanguageSelectorContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectorButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${props => props.theme.colors.background.white};
  border: 1px solid ${props => props.$isOpen 
    ? props.theme.colors.primary.main 
    : props.theme.colors.border.light
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 80px;
  gap: 8px;
  box-shadow: ${props => props.$isOpen 
    ? `0 4px 12px rgba(0, 0, 0, 0.1)` 
    : `0 1px 3px rgba(0, 0, 0, 0.05)`
  };

  &:hover {
    border-color: ${props => props.theme.colors.primary.light};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary.light}20;
  }
`;

const CurrentLanguage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FlagIcon = styled.div`
  width: 20px;
  height: 14px;
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const LanguageInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const LanguageCode = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  letter-spacing: 0.5px;
  line-height: 1;
`;

const ChevronIcon = styled.div<{ $isOpen: boolean }>`
  color: ${props => props.theme.colors.text.secondary};
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DropdownContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.background.white};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.98)'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
`;

const DropdownList = styled.div`
  padding: 4px 0;
`;

const LanguageOption = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.$isActive 
    ? `${props.theme.colors.primary.light}08` 
    : 'transparent'
  };
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$isActive 
      ? `${props.theme.colors.primary.light}12` 
      : `${props.theme.colors.background.light}`
    };
  }

  &:focus {
    outline: none;
    background: ${props => props.theme.colors.primary.light}10;
  }
`;

const OptionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LanguageDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
`;

const PrimaryText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  line-height: 1.2;
`;

const SecondaryText = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 400;
  line-height: 1.2;
  margin-top: 2px;
`;

const CheckIcon = styled.div`
  color: ${props => props.theme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  animation: checkIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes checkIn {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.01);
`;

export default LanguageSelector; 