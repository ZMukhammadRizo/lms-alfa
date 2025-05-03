export interface Subject {
  subjectname: ReactNode;
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
} 