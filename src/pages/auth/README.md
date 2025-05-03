# Authentication Pages

This directory contains all authentication-related pages for the LMS application.

## Components

### Login.tsx

The login page with the following features:
- Role selection interface (Admin, Teacher, Student)
- Login form with username and password fields
- Remember me functionality
- Forgot password link
- Demo account access for quick testing
- Responsive design for all screen sizes
- Error handling for invalid credentials

Login credentials for demo accounts:
- Admin: username: `admin`, password: `123456`
- Teacher: username: `teacher`, password: `123456`
- Student: username: `student`, password: `123456`

### Future Components

The following components will be added in the future:
- `ForgotPassword.tsx` - Password recovery functionality
- `ResetPassword.tsx` - Password reset form
- `Register.tsx` - Registration form for new users (if needed)
- `VerifyEmail.tsx` - Email verification page

## Routing

Auth pages are registered in `App.tsx` under the following routes:
- `/login` - The main login page with role selection
- `/forgot-password` - (Future) Password recovery page
- `/reset-password` - (Future) Password reset page 