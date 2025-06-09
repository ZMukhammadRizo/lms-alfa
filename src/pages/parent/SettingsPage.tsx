import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiSettings, 
  FiMail,
  FiMonitor,
  FiSliders,
  FiToggleLeft,
  FiGlobe,
  FiBell,
  FiUserPlus,
  FiShield
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../App';

// Field validation interface
interface ValidationErrors {
  [key: string]: string | undefined;
}

// Settings tabs
enum SettingsTab {
  GENERAL = 'general',
  APPEARANCE = 'appearance',
  NOTIFICATIONS = 'notifications'
}

// Main component
const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme, primaryColor, setPrimaryColor } = useThemeContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.GENERAL);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('compactMode') === 'true';
  });
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'My Learning Management System',
    adminEmail: 'admin@example.com'
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUserAlerts: true,
    loginAlerts: true
  });
  
  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Handle tab change
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSuccessMessage('');
    setErrorMessage('');
  };
  
  // Toggle compact mode
  const handleCompactModeToggle = () => {
    const newValue = !compactMode;
    setCompactMode(newValue);
    localStorage.setItem('compactMode', String(newValue));
    document.body.classList.toggle('compact-mode', newValue);
  };
  
  // Handle theme change
  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'dark' && !isDarkMode) {
      toggleTheme();
    } else if (value === 'light' && isDarkMode) {
      toggleTheme();
    }
  };
  
  // Handle primary color change
  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
  };
  
  // Handle general settings change
  const handleGeneralSettingChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle notification settings toggle
  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // Show success message
    setSuccessMessage('Notification settings updated');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  // Handle general settings submit
  const handleGeneralSettingsSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In a real app, you would save these to a backend
    setSuccessMessage('General settings updated successfully');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  // Render the general tab
  const renderGeneralTab = () => (
    <TabContent>
      <PageTitle>{t('parent.settings.generalSettings')}</PageTitle>
      <SettingsSection>
        <form onSubmit={handleGeneralSettingsSubmit}>
          <SettingsCard>
            <SettingsHeader>
              <SettingsTitle>{t('parent.settings.siteSettings')}</SettingsTitle>
            </SettingsHeader>
            
            {successMessage && (
              <SuccessMessage>
                {successMessage}
              </SuccessMessage>
            )}
            
            {errorMessage && (
              <ErrorMessage>
                {errorMessage}
              </ErrorMessage>
            )}

            <FormGrid>
              <FormGroup>
                <FormLabel htmlFor="siteName">{t('parent.settings.siteName')}</FormLabel>
                <FormInputWrapper>
                  <SettingIcon>
                    <FiGlobe size={18} />
                  </SettingIcon>
                  <FormInput
                    id="siteName"
                    name="siteName" 
                    type="text"
                    value={generalSettings.siteName}
                    onChange={handleGeneralSettingChange}
                    disabled={true}
                    $hasError={false}
                  />
                </FormInputWrapper>
                <HelperText>{t('parent.settings.siteNameHelper')}</HelperText>
              </FormGroup>
              
              <FormGroup>
                <FormLabel htmlFor="adminEmail">{t('parent.settings.adminEmail')}</FormLabel>
                <FormInputWrapper>
                  <SettingIcon>
                    <FiMail size={18} />
                  </SettingIcon>
                  <FormInput
                    id="adminEmail"
                    name="adminEmail" 
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={handleGeneralSettingChange}
                    disabled={true}
                    $hasError={false}
                  />
                </FormInputWrapper>
                <HelperText>{t('parent.settings.adminEmailHelper')}</HelperText>
              </FormGroup>
              <LockMessage>
                <FiShield size={14} />
                <span>{t('parent.settings.adminOnlySettings')}</span>
              </LockMessage>
            </FormGrid>

          </SettingsCard>
        </form>
      </SettingsSection>
    </TabContent>
  );
  
  // Render the appearance tab
  const renderAppearanceTab = () => (
    <TabContent>
      <PageTitle>{t('parent.settings.appearanceSettings')}</PageTitle>
      <SettingsSection>
        <SettingsCard>
          <SettingsHeader>
            <SettingsTitle>Color Theme</SettingsTitle>
          </SettingsHeader>
          
          {successMessage && (
            <SuccessMessage>
              {successMessage}
            </SuccessMessage>
          )}
          
          <SettingRow>
            <SettingIcon>
              <FiMonitor size={20} />
            </SettingIcon>
            <SettingContent>
              <SettingLabel>Color Theme</SettingLabel>
              <SettingDescription>Choose between light and dark mode</SettingDescription>
              <SelectInput
                value={isDarkMode ? 'dark' : 'light'}
                onChange={handleThemeChange}
                $hasError={false}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </SelectInput>
            </SettingContent>
          </SettingRow>
          
          <SettingRow>
            <SettingIcon>
              <FiSliders size={20} />
            </SettingIcon>
            <SettingContent>
              <SettingLabel>Primary Color</SettingLabel>
              <SettingDescription>Main color used throughout the application</SettingDescription>
              <ColorPickerWrapper>
                <ColorPicker
                  type="color"
                  value={primaryColor}
                  onChange={handleColorChange}
                />
                <ColorValue>{primaryColor}</ColorValue>
              </ColorPickerWrapper>
            </SettingContent>
          </SettingRow>
          
          <SettingRow>
            <SettingIcon>
              <FiToggleLeft size={20} />
            </SettingIcon>
            <SettingContent>
              <SettingLabel>Compact Mode</SettingLabel>
              <SettingDescription>Use reduced spacing in the interface</SettingDescription>
              <ToggleSwitch checked={compactMode} onChange={handleCompactModeToggle} />
            </SettingContent>
          </SettingRow>
        </SettingsCard>
      </SettingsSection>
    </TabContent>
  );

  // Render the notifications tab
  const renderNotificationsTab = () => (
    <TabContent>
      <PageTitle>Notifications Settings</PageTitle>
      <SettingsSection>
        <SettingsCard>
          <SettingsHeader>
            <SettingsTitle>Notification Preferences</SettingsTitle>
          </SettingsHeader>
          
          {successMessage && (
            <SuccessMessage>
              {successMessage}
            </SuccessMessage>
          )}
          
          <SettingRow>
            <SettingIcon>
              <FiMail size={20} />
            </SettingIcon>
            <SettingContent>
              <SettingLabel>Email Notifications</SettingLabel>
              <SettingDescription>Send system notifications via email</SettingDescription>
              <ToggleSwitch 
                checked={notificationSettings.emailNotifications} 
                onChange={() => handleNotificationToggle('emailNotifications')} 
              />
            </SettingContent>
          </SettingRow>
          
          <SettingRow>
            <SettingIcon>
              <FiUserPlus size={20} />
            </SettingIcon>
            <SettingContent>
              <SettingLabel>New User Alerts</SettingLabel>
              <SettingDescription>Get notified when new users register</SettingDescription>
              <ToggleSwitch 
                checked={notificationSettings.newUserAlerts} 
                onChange={() => handleNotificationToggle('newUserAlerts')} 
              />
            </SettingContent>
          </SettingRow>
          
          <SettingRow>
            <SettingIcon>
              <FiShield size={20} />
            </SettingIcon>
            <SettingContent>
              <SettingLabel>Login Alerts</SettingLabel>
              <SettingDescription>Get notified of suspicious login attempts</SettingDescription>
              <ToggleSwitch 
                checked={notificationSettings.loginAlerts} 
                onChange={() => handleNotificationToggle('loginAlerts')} 
              />
            </SettingContent>
          </SettingRow>
        </SettingsCard>
      </SettingsSection>
    </TabContent>
  );
  
  // Get the appropriate tab content based on the active tab
  const getTabContent = () => {
    switch (activeTab) {
      case SettingsTab.GENERAL:
        return renderGeneralTab();
      case SettingsTab.APPEARANCE:
        return renderAppearanceTab();
      case SettingsTab.NOTIFICATIONS:
        return renderNotificationsTab();
      default:
        return null;
    }
  };
  
  return (
    <SettingsContainer>
      <PageHeader>
        <h1>{t('parent.settings.title')}</h1>
        <p>{t('parent.settings.description')}</p>
      </PageHeader>
      
      <SettingsContent>
        <SettingsSidebar>
          <TabButton 
            $isActive={activeTab === SettingsTab.GENERAL}
            onClick={() => handleTabChange(SettingsTab.GENERAL)}
          >
            <FiSettings size={18} />
            <span>{t('parent.settings.general')}</span>
          </TabButton>
          
          <TabButton 
            $isActive={activeTab === SettingsTab.APPEARANCE}
            onClick={() => handleTabChange(SettingsTab.APPEARANCE)}
          >
            <FiMonitor size={18} />
            <span>{t('parent.settings.appearance')}</span>
          </TabButton>
          
          <TabButton 
            $isActive={activeTab === SettingsTab.NOTIFICATIONS}
            onClick={() => handleTabChange(SettingsTab.NOTIFICATIONS)}
          >
            <FiBell size={18} />
            <span>{t('parent.settings.notifications')}</span>
          </TabButton>
        </SettingsSidebar>
        
        <SettingsMainContent>
          {getTabContent()}
        </SettingsMainContent>
      </SettingsContent>
    </SettingsContainer>
  );
};

// Styled Components
const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const PageHeader = styled.div`
  padding: 1.5rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};

  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: ${props => props.theme.colors.text.primary};
  }

  p {
    color: ${props => props.theme.colors.text.secondary};
    margin-top: 0.5rem;
  }
`;

const SettingsContent = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SettingsSidebar = styled.div`
  flex: 0 0 250px;
  
  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    margin-bottom: 1.5rem;
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
  }
`;

interface TabButtonProps {
  $isActive: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 0.5rem;
  text-align: left;
  transition: all 0.2s ease;
  border: none;
  background-color: ${props => props.$isActive 
    ? props.theme.colors.primary[500] 
    : 'transparent'};
  color: ${props => props.$isActive 
    ? '#fff' 
    : props.theme.colors.text.primary};
  font-weight: ${props => props.$isActive ? '600' : '400'};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$isActive 
      ? props.theme.colors.primary[600] 
      : props.theme.colors.background.secondary};
  }

  @media (max-width: 768px) {
    width: auto;
    flex: 0 0 auto;
    white-space: nowrap;
    margin-bottom: 0;
  }
  
  span {
    margin-left: 0.75rem;
  }
`;

const SettingsMainContent = styled.div`
  flex: 1;
`;

const TabContent = styled.div`
  padding: 1rem 0;
`;

const PageTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text.primary};
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;
`;

const SettingsCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: 1.5rem;
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SettingsTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text.secondary};
`;

interface FormInputProps {
  $hasError?: boolean;
}

const FormInput = styled.input<FormInputProps>`
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.$hasError 
    ? props.theme.colors.danger[500] 
    : props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:hover:not(:disabled) {
    border-color: ${props => props.$hasError 
      ? props.theme.colors.danger[500] 
      : props.theme.colors.border.light};
  }
  
  &:focus {
    border-color: ${props => props.$hasError 
      ? props.theme.colors.danger[500] 
      : props.theme.colors.primary[500]};
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.$hasError 
      ? `${props.theme.colors.danger[500]}25` 
      : `${props.theme.colors.primary[500]}25`};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.background.tertiary};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger[500]};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const SuccessMessage = styled.div`
  background-color: ${props => `${props.theme.colors.success[500]}15`};
  color: ${props => props.theme.colors.success[500]};
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  border: 1px solid ${props => `${props.theme.colors.success[500]}30`};
`;

const ErrorMessage = styled.div`
  background-color: ${props => `${props.theme.colors.danger[500]}15`};
  color: ${props => props.theme.colors.danger[500]};
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  border: 1px solid ${props => `${props.theme.colors.danger[500]}30`};
`;

const SettingRow = styled.div`
  display: flex;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.primary[500]};
  border-radius: ${props => props.theme.borderRadius.full};
  margin-right: 1rem;
  flex-shrink: 0;
`;

const SettingContent = styled.div`
  flex: 1;
`;

const SettingLabel = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const SettingDescription = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 0.75rem;
`;

const SelectInput = styled.select<{$hasError: boolean}>`
  width: 100%;
  max-width: 300px;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.$hasError 
    ? props.theme.colors.danger[500]
    : props.theme.colors.border.light};
  background-color: ${props => props.theme.colors.background.secondary};
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ColorPicker = styled.input`
  width: 50px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: ${props => props.theme.borderRadius.md};
  }
`;

const ColorValue = styled.div`
  font-family: monospace;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  background: ${props => props.theme.colors.background.secondary};
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const ToggleSwitch = styled(({ checked, onChange, ...props }: { 
  checked: boolean; 
  onChange: () => void;
  [x: string]: any;
}) => (
  <label {...props}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span></span>
  </label>
))`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + span {
      background-color: ${props => props.theme.colors.primary[500]};
    }
    
    &:checked + span:before {
      transform: translateX(24px);
    }
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${props => props.theme.colors.border.light};
    transition: .4s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
`;

const FormInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  ${FormInput} {
    padding-left: 2.75rem;
  }
  
  ${SettingIcon} {
    position: absolute;
    left: 0.5rem;
    margin-right: 0;
    width: 30px;
    height: 30px;
  }
`;

const HelperText = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-top: 0.5rem;
`;

const LockMessage = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
`;

export { SettingsPage }; 