// Mock data for CV Maker

export const mockLinkedInData = {
  personalInfo: {
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedinUrl: 'linkedin.com/in/sarahjohnson',
    portfolio: 'sarahjohnson.dev',
    title: 'Senior Product Manager',
    summary: 'Results-driven Product Manager with 8+ years of experience leading cross-functional teams to deliver innovative digital products. Proven track record of increasing user engagement by 150% and revenue by $2M annually.',
  },
  experience: [
    {
      id: '1',
      company: 'TechCorp Inc.',
      position: 'Senior Product Manager',
      location: 'San Francisco, CA',
      startDate: '2020-01',
      endDate: 'Present',
      current: true,
      description: '• Led product strategy for SaaS platform serving 100K+ users\n• Increased user engagement by 150% through data-driven feature prioritization\n• Managed $5M product budget and cross-functional team of 12\n• Launched 3 major features that generated $2M in additional annual revenue'
    },
    {
      id: '2',
      company: 'InnovateLab',
      position: 'Product Manager',
      location: 'San Francisco, CA',
      startDate: '2018-03',
      endDate: '2020-01',
      current: false,
      description: '• Defined product roadmap for mobile app with 50K+ downloads\n• Collaborated with engineering and design teams to ship bi-weekly releases\n• Conducted user research with 200+ participants to inform product decisions\n• Reduced customer churn by 25% through improved onboarding experience'
    },
    {
      id: '3',
      company: 'StartupXYZ',
      position: 'Associate Product Manager',
      location: 'San Francisco, CA',
      startDate: '2016-06',
      endDate: '2018-02',
      current: false,
      description: '• Supported product development for B2B analytics platform\n• Gathered customer feedback and translated into product requirements\n• Coordinated sprint planning and backlog grooming sessions\n• Improved feature adoption by 40% through targeted user education'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'Master of Business Administration (MBA)',
      field: 'Technology Management',
      location: 'Stanford, CA',
      startDate: '2014-09',
      endDate: '2016-06',
      gpa: '3.8'
    },
    {
      id: '2',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      location: 'Berkeley, CA',
      startDate: '2010-09',
      endDate: '2014-05',
      gpa: '3.7'
    }
  ],
  skills: [
    'Product Strategy',
    'Agile/Scrum',
    'User Research',
    'Data Analysis',
    'A/B Testing',
    'Roadmap Planning',
    'Stakeholder Management',
    'SQL',
    'Jira',
    'Figma',
    'Google Analytics',
    'Product-Led Growth'
  ],
  certifications: [
    {
      id: '1',
      name: 'Certified Scrum Product Owner (CSPO)',
      issuer: 'Scrum Alliance',
      date: '2019-08'
    },
    {
      id: '2',
      name: 'Google Analytics Certification',
      issuer: 'Google',
      date: '2020-03'
    }
  ],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Spanish', proficiency: 'Professional' }
  ]
};

export const mockTemplates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with a professional look',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop',
    isPremium: false
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Classic format preferred by traditional industries',
    thumbnail: 'https://images.unsplash.com/photo-1586281380614-fa516df1d6c0?w=400&h=500&fit=crop',
    isPremium: false
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design perfect for creative professionals',
    thumbnail: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=400&h=500&fit=crop',
    isPremium: false
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Ultra-clean design with maximum whitespace',
    thumbnail: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=400&h=500&fit=crop',
    isPremium: false
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Formal and prestigious design for senior roles',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=500&fit=crop',
    isPremium: false
  },
  {
    id: 'tech',
    name: 'Tech Pro',
    description: 'Modern technical design for developers and engineers',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=500&fit=crop',
    isPremium: false
  }
];

export const mockAISuggestions = {
  summary: 'Consider highlighting your quantifiable achievements and leadership experience more prominently. Your track record of 150% user engagement increase is impressive!',
  improvements: [
    {
      section: 'Summary',
      suggestion: 'Add specific metrics about team size and project scope',
      priority: 'high'
    },
    {
      section: 'Experience',
      suggestion: 'Use more action verbs like "Spearheaded", "Orchestrated", "Championed"',
      priority: 'medium'
    },
    {
      section: 'Skills',
      suggestion: 'Add emerging PM skills like "AI Product Strategy" or "Machine Learning Integration"',
      priority: 'low'
    }
  ],
  atsScore: 87,
  atsOptimizations: [
    'Include more industry-specific keywords',
    'Ensure consistent date formatting',
    'Add measurable outcomes to all bullet points'
  ]
};

export const mockSavedCVs = [
  {
    id: '1',
    name: 'Product Manager - TechCorp',
    template: 'modern',
    lastModified: '2025-01-15T10:30:00Z',
    atsScore: 87
  },
  {
    id: '2',
    name: 'Senior PM - Startup Role',
    template: 'creative',
    lastModified: '2025-01-10T15:45:00Z',
    atsScore: 82
  }
];
