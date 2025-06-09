# Internationalization (i18n) Implementation

## Overview
This document describes the implementation of internationalization (i18n) in the Admin Panel of the LMS project using i18next and react-i18next.

## Features Implemented

### 1. Supported Languages
- **English (en)** - Default language
- **Uzbek (uz)** - O'zbekcha
- **Russian (ru)** - Русский

### 2. Language Persistence
- Selected language is stored in `localStorage`
- Language choice persists after page reload
- Falls back to English if no language is stored

### 3. Language Selector Component
- Location: `frontend/src/components/admin/LanguageSelector.tsx`
- Features:
  - Dropdown interface with flag icons
  - Shows current selected language
  - Immediate language switching
  - Consistent with Admin Panel design
  - Integrated into the admin header

## File Structure

```
frontend/src/
├── locales/
│   ├── en/
│   │   └── translation.json      # English translations
│   ├── uz/
│   │   └── translation.json      # Uzbek translations
│   └── ru/
│       └── translation.json      # Russian translations
├── components/admin/
│   └── LanguageSelector.tsx      # Language selector component
├── types/
│   └── i18next.d.ts              # TypeScript declarations
└── i18n.ts                       # i18n configuration
```

## Configuration Files

### i18n Configuration (`src/i18n.ts`)
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Resource imports and configuration
// Includes localStorage persistence
// Default language: English
```

### TypeScript Declarations (`src/types/i18next.d.ts`)
- Provides type safety for translation keys
- Enables IntelliSense support for translations
- References English translation file as type source

## Translation Structure

### Common Keys
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save",
    "cancel": "Cancel",
    // ... more common translations
  }
}
```

### Navigation Keys
```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "students": "Students",
    "teachers": "Teachers",
    // ... navigation items
  }
}
```

### Dashboard Keys
```json
{
  "dashboard": {
    "title": "Dashboard",
    "attendanceOverview": "Attendance Overview",
    "fullReport": "Full Report",
    "totalStudents": "Total Students",
    // ... dashboard specific translations
  }
}
```

## Implementation Examples

### Component Usage
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
};
```

### Updated Components
1. **AttendanceOverview** (`src/components/admin/AttendanceOverview.tsx`)
   - Title: `{t('dashboard.attendanceOverview')}`
   - Full Report button: `{t('dashboard.fullReport')}`
   - Loading text: `{t('common.loading')}`
   - Error messages: `{t('errors.loadingFailed')}`

2. **Dashboard** (`src/pages/admin/Dashboard.tsx`)
   - Statistics titles using translation keys
   - Dynamic content translation

3. **Admin Header** (`src/components/admin/Header.tsx`)
   - Integrated LanguageSelector component

## Dependencies Installed
```json
{
  "dependencies": {
    "i18next": "^23.x.x",
    "react-i18next": "^13.x.x",
    "i18next-browser-languagedetector": "^7.x.x"
  },
  "devDependencies": {
    "@types/react-i18next": "^8.x.x"
  }
}
```

## How to Add New Translations

### 1. Add Keys to Translation Files
Update all three language files (`en`, `uz`, `ru`) with new keys:

```json
// en/translation.json
{
  "newSection": {
    "newKey": "English text"
  }
}

// uz/translation.json
{
  "newSection": {
    "newKey": "O'zbek matni"
  }
}

// ru/translation.json
{
  "newSection": {
    "newKey": "Русский текст"
  }
}
```

### 2. Use in Components
```typescript
const { t } = useTranslation();
return <span>{t('newSection.newKey')}</span>;
```

## Language Selector Usage

The language selector appears in the admin header and allows users to:
- View current language with flag icon
- Switch between English, Uzbek, and Russian
- See visual feedback for the active language
- Experience immediate UI updates when switching languages

## Future Enhancements

### Planned Improvements
1. **Menu Translation**: Implement translation for sidebar navigation items
2. **Dynamic Content**: Add support for translating dynamic content from database
3. **Date/Time Localization**: Implement locale-specific date and time formatting
4. **Number Formatting**: Add locale-specific number and currency formatting
5. **RTL Support**: Prepare infrastructure for right-to-left languages if needed

### Extending to Other Panels
The current implementation is scoped to the Admin Panel. To extend to other panels:
1. Add language selectors to Teacher, Student, and Parent layouts
2. Create role-specific translation keys
3. Implement role-based language preferences

## Testing
To test the i18n implementation:
1. Navigate to the Admin Panel
2. Use the language selector in the header
3. Verify text changes immediately
4. Refresh the page to confirm persistence
5. Check different components for translated content

## Notes
- The implementation uses namespace 'translation' for all keys
- Language detection order: localStorage → navigator language
- Fallback language is always English
- All admin panel text should gradually be migrated to use translation keys
- TypeScript provides compile-time checking for translation key existence 