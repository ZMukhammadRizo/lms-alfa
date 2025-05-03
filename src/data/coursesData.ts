// Lesson interface
export interface Lesson {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  description?: string;
}

// Material interface
export interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'doc' | 'link' | 'image' | 'other';
  url: string;
  size?: string;
  description?: string;
  dateAdded: string;
}

// Course interface
export interface Course {
  id: string;
  name: string;
  subject: string;
  description: string;
  coverImage: string;
  materials: Material[];
  lessons: Lesson[];
}

// Mock data for courses with materials and lessons
export const courses: Course[] = [
  {
    id: '1',
    name: 'Mathematics',
    subject: 'STEM',
    description: 'Core mathematics curriculum covering algebra, geometry, and calculus concepts',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    materials: [],
    lessons: [
      {
        id: 'l1',
        title: '1-dars: Algebra asoslari',
        duration: '45 min',
        youtubeId: 'NybHckSEQBI',
        description: 'Learn the fundamentals of algebraic expressions and equations.'
      },
      {
        id: 'l2',
        title: '2-dars: Kvadrat funksiyalar',
        duration: '38 min',
        youtubeId: '2ZzuZvz33X0',
        description: 'Understanding quadratic functions and their graphs.'
      },
      {
        id: 'l3',
        title: '3-dars: Calculus kirish',
        duration: '52 min',
        youtubeId: 'WUvTyaaNkzM',
        description: 'Introduction to calculus concepts and derivatives.'
      }
    ]
  },
  {
    id: '2',
    name: 'Science',
    subject: 'STEM',
    description: 'Science education covering biology, chemistry, and physics',
    coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    materials: [],
    lessons: [
      {
        id: 'l4',
        title: '1-dars: Newton qonunlari',
        duration: '42 min',
        youtubeId: 'kKKM8Y-u7ds',
        description: 'Comprehensive explanation of Newton\'s three laws of motion.'
      },
      {
        id: 'l5',
        title: '2-dars: Kimyoviy reaksiyalar',
        duration: '36 min',
        youtubeId: '0Dt0VVRbG5g',
        description: 'Learn about different types of chemical reactions.'
      }
    ]
  },
  {
    id: '3',
    name: 'English Literature',
    subject: 'Humanities',
    description: 'English literature curriculum covering classic and contemporary works',
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    materials: [],
    lessons: [
      {
        id: 'l6',
        title: '1-dars: Shakespeare\'s Macbeth tahlili',
        duration: '48 min',
        youtubeId: 'JwhouCNq-Fc',
        description: 'Analysis of themes and characters in Shakespeare\'s Macbeth.'
      },
      {
        id: 'l7',
        title: '2-dars: Sheriyat texnikalari',
        duration: '35 min',
        youtubeId: 'z0BUYzMypi8',
        description: 'Learn about various poetry techniques and analysis methods.'
      }
    ]
  },
  {
    id: '4',
    name: 'History',
    subject: 'Humanities',
    description: 'History curriculum covering world, European, and American history',
    coverImage: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    materials: [],
    lessons: [
      {
        id: 'l8',
        title: '1-dars: Ikkinchi Jahon Urushi',
        duration: '55 min',
        youtubeId: 'fo2Rb9h788s',
        description: 'Detailed analysis of the causes and global impact of World War II.'
      },
      {
        id: 'l9',
        title: '2-dars: Qadimgi tsivilizatsiyalar',
        duration: '47 min',
        youtubeId: 'ErLmXrOH2s4',
        description: 'Overview of major ancient civilizations and their contributions.'
      }
    ]
  },
  {
    id: '5',
    name: 'Physical Education',
    subject: 'Athletics',
    description: 'Physical education program developing fitness, teamwork, and sports skills',
    coverImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    materials: [],
    lessons: [
      {
        id: 'l10',
        title: '1-dars: Jismoniy tarbiya asoslari',
        duration: '32 min',
        youtubeId: 'mCC8wHJdUkI',
        description: 'Introduction to basic fitness principles and exercise techniques.'
      }
    ]
  },
  {
    id: '6',
    name: 'Fine Arts',
    subject: 'Arts',
    description: 'Fine arts education covering visual arts, music, and theater',
    coverImage: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    materials: [],
    lessons: [
      {
        id: 'l11',
        title: '1-dars: Rang nazariyasi',
        duration: '38 min',
        youtubeId: 'AvgCkHrcj8w',
        description: 'Understanding color theory and its application in art.'
      },
      {
        id: 'l12',
        title: '2-dars: San\'at tarixi',
        duration: '45 min',
        youtubeId: 'HstlO_-9xDE',
        description: 'Overview of major art movements throughout history.'
      }
    ]
  }
]; 