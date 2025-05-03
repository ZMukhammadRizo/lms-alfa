import { useState, useEffect } from 'react';
import { User } from '../types/User';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2023-06-12 09:30 AM',
    createdAt: '2023-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Teacher',
    status: 'active',
    lastLogin: '2023-06-10 02:45 PM',
    createdAt: '2023-02-20',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    role: 'Teacher',
    status: 'inactive',
    lastLogin: '2023-05-28 11:20 AM',
    createdAt: '2023-03-05',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    role: 'Student',
    status: 'active',
    lastLogin: '2023-06-11 10:15 AM',
    createdAt: '2023-01-30',
  },
  {
    id: '5',
    name: 'Michael Wilson',
    email: 'michael.wilson@example.com',
    role: 'Student',
    status: 'inactive',
    lastLogin: '2023-06-01 04:10 PM',
    createdAt: '2023-02-10',
  },
  {
    id: '6',
    name: 'Sarah Brown',
    email: 'sarah.brown@example.com',
    role: 'Parent',
    status: 'active',
    lastLogin: '2023-06-09 12:30 PM',
    createdAt: '2023-04-15',
  },
  {
    id: '7',
    name: 'David Miller',
    email: 'david.miller@example.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2023-06-12 08:45 AM',
    createdAt: '2023-01-05',
  },
];

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Simulate API call with a delay
    const timer = setTimeout(() => {
      try {
        setUsers(mockUsers);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setLoading(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  return { users, loading, error };
} 