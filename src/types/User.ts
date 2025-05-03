export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string; // Keep for backwards compatibility
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  parent_id?: string; // ID of parent user if this user is a child
} 