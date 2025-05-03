# System Patterns

## Application Architecture
- **Component-Based Architecture**: React components organized by feature and responsibility
- **Feature-First Organization**: Code organized by feature rather than type
- **Client-Side Routing**: React Router for navigation between pages
- **Context API & Zustand**: For global state management

## Directory Structure
```
src/
├── assets/         # Static files like images, fonts
├── components/     # Reusable UI components
├── config/         # Configuration files and constants
├── contexts/       # React contexts for state sharing
├── data/           # Static data, mock data, or data utilities
├── hooks/          # Custom React hooks
├── layouts/        # Layout components that wrap pages
├── pages/          # Page components (route endpoints)
├── routes/         # Routing configuration
├── stores/         # Zustand stores for state management
├── styles/         # Global styles and theme definitions
├── types/          # TypeScript type definitions
└── utils/          # Utility functions and helpers
```

## Design Patterns
- **Container/Presentation Pattern**: Separation of logic and presentation
- **Custom Hooks**: For reusable logic and side effects
- **Context Providers**: For shared state and functionality
- **HOCs and Render Props**: For component composition when appropriate
- **Composition over Inheritance**: Preferring component composition

## State Management
- **Zustand**: For global application state
- **React Context**: For theme, auth, and other cross-cutting concerns
- **Local Component State**: For component-specific state
- **Form State**: Managed within form components or with form libraries

## Data Flow
- **Unidirectional Data Flow**: Data flows down from parent to child components
- **Event Handlers**: For sending actions up from child to parent components
- **API Services**: For communication with Supabase backend
- **State Updates**: Through store actions and context providers

## Authentication Flow
- Supabase Auth UI for login/registration
- JWT tokens stored securely
- Protected routes with authentication checks
- User profile and permissions management

## Error Handling
- Try-catch blocks for async operations
- Error boundaries for component errors
- Toast notifications for user feedback
- Graceful degradation for failed operations

## Responsive Design
- Mobile-first approach
- Tailwind CSS breakpoints
- Responsive components and layouts
- Media queries for specific adjustments 