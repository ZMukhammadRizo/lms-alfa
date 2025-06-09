import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSettings, FiSave, FiRefreshCw, FiMonitor, 
  FiBell, FiShield, FiGlobe, FiDatabase, FiUsers, FiMail, 
  FiLock, 
  FiSliders, FiToggleLeft, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../App';
import { useTranslation } from 'react-i18next';

// Setting item type
type SettingType = 'toggle' | 'select' | 'input' | 'slider' | 'color' | 'button';

// Setting definition
interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: SettingType;
  value: any;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
  category: string;
}

// Settings Page Component
export const Settings: React.FC = () => {
  const { t } = useTranslation();
  // Get theme context
  const { isDarkMode, toggleTheme, primaryColor, setPrimaryColor } = useThemeContext();
  // Get auth context to check user role
  const { user } = useAuth();
  
  // State for active category
  const [activeCategory, setActiveCategory] = useState<string>('general');
  
  // Get translation for admin-only note
  const adminOnlyNoteText = t('settings.adminOnlyNote');
  
    // State for settings
  const [settings, setSettings] = useState<SettingItem[]>([
    // General Settings
    {
      id: 'siteName',
      label: t('settings.siteName'),
      description: t('settings.siteNameDescription'),
      type: 'input',
      value: 'My Learning Management System',
      category: 'general',
      icon: <FiGlobe />
    },
    {
      id: 'adminEmail',
      label: t('settings.adminEmail'),
      description: t('settings.adminEmailDescription'),
      type: 'input',
      value: 'admin@example.com',
      category: 'general',
      icon: <FiMail />
    },
    // "Allow User Registration" toggle has been removed
    
    // Appearance Settings
    {
      id: 'theme',
      label: t('settings.colorTheme'),
      description: t('settings.colorThemeDescription'),
      type: 'select',
      value: isDarkMode ? 'dark' : 'light',
      options: [
        { value: 'light', label: t('settings.lightMode') },
        { value: 'dark', label: t('settings.darkMode') },
        { value: 'system', label: t('settings.systemDefault') }
      ],
      category: 'appearance',
      icon: <FiMonitor />
    },
    {
      id: 'primaryColor',
      label: t('settings.primaryColor'),
      description: t('settings.primaryColorDescription'),
      type: 'color',
      value: primaryColor,
      category: 'appearance',
      icon: <FiSliders />
    },
    {
      id: 'compactMode',
      label: t('settings.compactMode'),
      description: t('settings.compactModeDescription'),
      type: 'toggle',
      value: false,
      category: 'appearance',
      icon: <FiToggleLeft />
    },
    
    // Notification Settings
    {
      id: 'emailNotifications',
      label: t('settings.emailNotifications'),
      description: t('settings.emailNotificationsDescription'),
      type: 'toggle',
      value: true,
      category: 'notifications',
      icon: <FiMail />
    },
    {
      id: 'newUserAlert',
      label: t('settings.newUserAlerts'),
      description: t('settings.newUserAlertsDescription'),
      type: 'toggle',
      value: true,
      category: 'notifications',
      icon: <FiUsers />
    },
    {
      id: 'loginAlerts',
      label: t('settings.loginAlerts'),
      description: t('settings.loginAlertsDescription'),
      type: 'toggle',
      value: true,
      category: 'notifications',
      icon: <FiBell />
    },
    
    // Security Settings
    {
      id: 'twoFactorAuth',
      label: t('settings.twoFactorAuth'),
      description: t('settings.twoFactorAuthDescription'),
      type: 'toggle',
      value: false,
      category: 'security',
      icon: <FiShield />
    },
    {
      id: 'passwordPolicy',
      label: t('settings.passwordPolicy'),
      description: t('settings.passwordPolicyDescription'),
      type: 'select',
      value: 'strong',
      options: [
        { value: 'basic', label: t('settings.passwordBasic') },
        { value: 'medium', label: t('settings.passwordMedium') },
        { value: 'strong', label: t('settings.passwordStrong') }
      ],
      category: 'security',
      icon: <FiLock />
    },
    {
      id: 'sessionTimeout',
      label: t('settings.sessionTimeout'),
      description: t('settings.sessionTimeoutDescription'),
      type: 'select',
      value: '30',
      options: [
        { value: '15', label: t('settings.minutes15') },
        { value: '30', label: t('settings.minutes30') },
        { value: '60', label: t('settings.hour1') },
        { value: '120', label: t('settings.hours2') },
        { value: 'never', label: t('settings.never') }
      ],
      category: 'security',
      icon: <FiRefreshCw />
    },
    
    // System Settings
    {
      id: 'backupFrequency',
      label: t('settings.backupFrequency'),
      description: t('settings.backupFrequencyDescription'),
      type: 'select',
      value: 'daily',
      options: [
        { value: 'daily', label: t('settings.daily') },
        { value: 'weekly', label: t('settings.weekly') },
        { value: 'monthly', label: t('settings.monthly') },
        { value: 'manual', label: t('settings.manualOnly') }
      ],
      category: 'system',
      icon: <FiDatabase />
    },
    {
      id: 'maintenanceMode',
      label: t('settings.maintenanceMode'),
      description: t('settings.maintenanceModeDescription'),
      type: 'toggle',
      value: false,
      category: 'system',
      icon: <FiSliders />
    },
    {
      id: 'cacheClearing',
      label: t('settings.clearSystemCache'),
      description: t('settings.clearSystemCacheDescription'),
      type: 'button',
      value: t('settings.clearCache'),
      category: 'system',
      icon: <FiRefreshCw />
    }
  ]);
  
  // Update settings when theme props change
  useEffect(() => {
    setSettings(prevSettings => 
      prevSettings.map(setting => {
        if (setting.id === 'theme') {
          return { ...setting, value: isDarkMode ? 'dark' : 'light' };
        }
        if (setting.id === 'primaryColor') {
          return { ...setting, value: primaryColor };
        }
        return setting;
      })
    );
  }, [isDarkMode, primaryColor]);
  
  // State for save animation
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Categories
  const categories = [
    { id: 'general', label: t('settings.general'), icon: <FiSettings /> },
    { id: 'appearance', label: t('settings.appearance'), icon: <FiMonitor /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <FiBell /> },
    { id: 'security', label: t('settings.security'), icon: <FiShield /> },
    { id: 'system', label: t('settings.system'), icon: <FiDatabase /> }
  ];
  
  // Handle setting change
  const handleSettingChange = (id: string, value: any) => {
    // Update settings state
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id ? { ...setting, value } : setting
      )
    );
    
    // Handle special settings
    if (id === 'theme') {
      // Handle theme change
      if (value === 'light' && isDarkMode) {
        toggleTheme();
      } else if (value === 'dark' && !isDarkMode) {
        toggleTheme();
      } else if (value === 'system') {
        // Reset to system preference
        localStorage.removeItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark !== isDarkMode) {
          toggleTheme();
        }
      }
    } else if (id === 'primaryColor') {
      // Handle primary color change
      setPrimaryColor(value);
    }
  };
  
  // Handle toggle change
  const handleToggleChange = (id: string) => {
    // Get current value
    const currentSetting = settings.find(setting => setting.id === id);
    if (currentSetting) {
      // Toggle value
      handleSettingChange(id, !currentSetting.value);
    }
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('success');
      
      // Reset status after a delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }, 1500);
  };
  
  // Helper function to check if user is admin
  const isAdmin = () => {
    return user?.role === 'Admin' || (typeof user?.role === 'object' && user?.role?.name === 'Admin');
  };

  // Get filtered settings by category and role
  const filteredSettings = settings.filter(setting => {
    // Only show security and system settings to admin users
    if ((setting.category === 'security' || setting.category === 'system') && !isAdmin()) {
      return false;
    }
    return setting.category === activeCategory;
  });

  // Get visible categories based on user role
  const visibleCategories = categories.filter(category => {
    if ((category.id === 'security' || category.id === 'system') && !isAdmin()) {
      return false;
    }
    return true;
  });
  
  return (
    <SettingsContainer>
      <SettingsHeader>
        <div>
          <PageTitle>{t('settings.title')}</PageTitle>
          <PageDescription>{t('settings.description')}</PageDescription>
        </div>
        
        <SaveButton 
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiRefreshCw className="spin" />
                <span>{t('settings.saving')}</span>
              </motion.div>
            ) : saveStatus === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiCheckCircle />
                <span>{t('settings.saved')}</span>
              </motion.div>
            ) : saveStatus === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiXCircle />
                <span>{t('settings.error')}</span>
              </motion.div>
            ) : (
              <motion.div
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiSave />
                <span>{t('settings.saveChanges')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </SaveButton>
      </SettingsHeader>
      
      <SettingsLayout>
        <CategorySidebar>
          {visibleCategories.map(category => (
            <CategoryButton
              key={category.id}
              $isActive={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              <CategoryIcon>{category.icon}</CategoryIcon>
              <CategoryLabel>{category.label}</CategoryLabel>
              {activeCategory === category.id && (
                <ActiveIndicator
                  layoutId="activeCategoryIndicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </CategoryButton>
          ))}
        </CategorySidebar>
        
        <SettingsContent>
          <SectionTitle>
            {categories.find(c => c.id === activeCategory)?.label}
          </SectionTitle>
          
          <SettingsList>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {filteredSettings.map(setting => (
                  <SettingCard key={setting.id}>
                    <SettingIconContainer>
                      {setting.icon}
                    </SettingIconContainer>
                    
                    <SettingInfo>
                      <SettingLabel>{setting.label}</SettingLabel>
                      <SettingDescription>{setting.description}</SettingDescription>
                    </SettingInfo>
                    
                    <SettingControl>
                      {setting.type === 'toggle' && (
                        <ToggleSwitch
                          $isActive={setting.value}
                          onClick={() => handleToggleChange(setting.id)}
                        >
                          <ToggleSlider $isActive={setting.value} />
                        </ToggleSwitch>
                      )}
                      
                      {setting.type === 'input' && (
                        <div style={{ width: '100%' }}>
                          <InputControl
                            type="text"
                            value={setting.value}
                            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                            readOnly={setting.id === 'siteName' && !isAdmin()}
                          />
                          {setting.id === 'siteName' && !isAdmin() && (
                            <AdminOnlyNote>
                              <FiLock size={12} />
                              {adminOnlyNoteText}
                            </AdminOnlyNote>
                          )}
                        </div>
                      )}
                      
                      {setting.type === 'select' && (
                        <SelectControl
                          value={setting.value}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                        >
                          {setting.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectControl>
                      )}
                      
                      {setting.type === 'color' && (
                        <ColorPickerWrapper>
                          <ColorDisplay $color={setting.value} />
                          <ColorInput
                            type="color"
                            value={setting.value}
                            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          />
                        </ColorPickerWrapper>
                      )}
                      
                      {setting.type === 'button' && (
                        <ActionButton onClick={() => alert(`Action: ${setting.value}`)}>
                          {setting.value}
                        </ActionButton>
                      )}
                    </SettingControl>
                  </SettingCard>
                ))}
              </motion.div>
            </AnimatePresence>
          </SettingsList>
        </SettingsContent>
      </SettingsLayout>
    </SettingsContainer>
  );
};

// Styled Components
const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[6]};
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing[4]};
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  margin-bottom: ${props => props.theme.spacing[1]};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
`;

const PageDescription = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[4]}`};
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.primary[700]};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.neutral[400]};
    cursor: not-allowed;
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  div {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing[2]};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
  }
`;

const SettingsLayout = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing[6]};
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    flex-direction: column;
  }
`;

const CategorySidebar = styled.div`
  display: flex;
  flex-direction: column;
  width: 240px;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: ${props => props.theme.spacing[2]};
  }
`;

interface ActiveButtonProps {
  $isActive: boolean;
}

const CategoryButton = styled.button<ActiveButtonProps>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  background-color: ${props => props.$isActive ? props.theme.colors.background.lighter : 'transparent'};
  color: ${props => props.$isActive ? props.theme.colors.primary[600] : props.theme.colors.text.secondary};
  border: none;
  padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[4]}`};
  font-size: 0.95rem;
  font-weight: ${props => props.$isActive ? 600 : 400};
  text-align: left;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};
  position: relative;
  
  &:hover {
    background-color: ${props => props.$isActive ? props.theme.colors.background.lighter : props.theme.colors.background.hover};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
    flex-shrink: 0;
    border-radius: ${props => props.theme.borderRadius.md};
  }
`;

const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

const CategoryLabel = styled.div`
  flex: 1;
`;

const ActiveIndicator = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background-color: ${props => props.theme.colors.primary[600]};
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    width: 100%;
    height: 4px;
    top: auto;
    bottom: -${props => props.theme.spacing[1]};
  }
`;

const SettingsContent = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: ${props => props.theme.spacing[6]};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing[4]};
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
`;

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[4]};
`;

const SettingCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[4]};
  background-color: ${props => props.theme.colors.background.lighter};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing[4]};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SettingIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.full};
  background-color: ${props => props.theme.colors.primary[50]};
  color: ${props => props.theme.colors.primary[600]};
  font-size: 1.2rem;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin-bottom: ${props => props.theme.spacing[2]};
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingLabel = styled.div`
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing[1]};
  color: ${props => props.theme.colors.text.primary};
`;

const SettingDescription = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const SettingControl = styled.div`
  min-width: 120px;
  display: flex;
  justify-content: flex-end;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 100%;
    justify-content: flex-start;
    margin-top: ${props => props.theme.spacing[3]};
  }
`;

interface ToggleProps {
  $isActive: boolean;
}

const ToggleSwitch = styled.div<ToggleProps>`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${props => props.$isActive ? props.theme.colors.primary[500] : props.theme.colors.neutral[300]};
  border-radius: 24px;
  cursor: pointer;
  transition: background-color ${props => props.theme.transition.fast};
`;

const ToggleSlider = styled.div<ToggleProps>`
  position: absolute;
  top: 2px;
  left: ${props => props.$isActive ? '26px' : '2px'};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  box-shadow: ${props => props.theme.shadows.sm};
  transition: left ${props => props.theme.transition.fast};
`;

const InputControl = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.neutral[300]};
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.background.primary};
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[600]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
  
  &:read-only {
    background-color: ${props => props.theme.colors.background.tertiary};
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

const SelectControl = styled.select`
  min-width: 150px;
  padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
  font-size: 0.95rem;
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.background.secondary};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[400]};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary[100]};
  }
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const ColorDisplay = styled.div<{ $color: string }>`
  width: 30px;
  height: 30px;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.$color};
  border: 1px solid ${props => props.theme.colors.border.light};
`;

const ColorInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 30px;
  height: 30px;
  cursor: pointer;
`;

const ActionButton = styled.button`
  background-color: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => `${props.theme.spacing[2]} ${props.theme.spacing[3]}`};
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color ${props => props.theme.transition.fast};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary[700]};
  }
`;

const AdminOnlyNote = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.text.tertiary};
  margin-top: 4px;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    font-size: 14px;
  }
`;

// Export the component as default
export default Settings; 