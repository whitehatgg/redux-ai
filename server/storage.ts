import type { Applicant, ApplicantDetails, InsertUser, User } from '@shared/schema';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Applicant methods
  getApplicants(): Promise<Applicant[]>;
  getApplicant(id: string): Promise<Applicant | undefined>;
  getApplicantDetails(id: string): Promise<ApplicantDetails | undefined>;
  updateApplicantStatus(id: string, status: Applicant['status']): Promise<Applicant | undefined>;
  updateApplicantDetails(
    id: string,
    details: Partial<ApplicantDetails>
  ): Promise<ApplicantDetails | undefined>;

  getState(): Record<string, unknown>;
}

// Mock applicant details
const mockApplicantDetails: Record<string, ApplicantDetails> = {
  '1': {
    skills: ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Redux'],
    education: [
      {
        institution: 'University of Technology',
        degree: 'Bachelor of Computer Science',
        year: '2020',
      },
    ],
    experience: [
      {
        company: 'Tech Solutions Inc.',
        role: 'Junior Developer',
        duration: '2020-2022',
        description: 'Worked on front-end development using React and Redux.',
      },
      {
        company: 'Startup Innovation',
        role: 'Intern',
        duration: '2019-2020',
        description: 'Assisted in developing web applications using JavaScript and Node.js.',
      },
    ],
    notes: 'Strong candidate with good technical skills',
  },
  '2': {
    skills: ['Product Strategy', 'User Research', 'Agile', 'Roadmapping', 'Analytics'],
    education: [
      {
        institution: 'Business University',
        degree: 'MBA',
        year: '2018',
      },
      {
        institution: 'Design College',
        degree: 'Bachelor of Design',
        year: '2015',
      },
    ],
    experience: [
      {
        company: 'Tech Giant Corp',
        role: 'Associate Product Manager',
        duration: '2018-2022',
        description: 'Led product development for mobile applications with over 1M users.',
      },
      {
        company: 'Design Agency',
        role: 'UX Researcher',
        duration: '2015-2018',
        description: 'Conducted user research and created product specifications.',
      },
    ],
    notes: 'Excellent communication skills and leadership potential',
  },
  '3': {
    skills: ['UI Design', 'Figma', 'User Research', 'Prototyping', 'Adobe Creative Suite'],
    education: [
      {
        institution: 'Design Institute',
        degree: 'Master of UX Design',
        year: '2019',
      },
    ],
    experience: [
      {
        company: 'Creative Solutions',
        role: 'Junior Designer',
        duration: '2019-2022',
        description: 'Created user interfaces for web and mobile applications.',
      },
    ],
    notes: 'Strong design portfolio but limited experience',
  },
};

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private applicants: Map<string, Applicant>;
  private applicantDetails: Map<string, ApplicantDetails>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.applicants = new Map();
    this.applicantDetails = new Map();
    this.currentId = 1;

    // Initialize with sample applicant data
    this.initializeApplicants();
  }

  private initializeApplicants(): void {
    const sampleApplicants: Applicant[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'pending',
        position: 'Software Engineer',
        appliedDate: '2024-02-18',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'approved',
        position: 'Product Manager',
        appliedDate: '2024-02-17',
      },
      {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        status: 'rejected',
        position: 'UX Designer',
        appliedDate: '2024-02-16',
      },
    ];

    sampleApplicants.forEach(applicant => {
      this.applicants.set(applicant.id, applicant);
    });

    // Initialize applicant details
    Object.entries(mockApplicantDetails).forEach(([id, details]) => {
      this.applicantDetails.set(id, details);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Applicant methods
  async getApplicants(): Promise<Applicant[]> {
    return Array.from(this.applicants.values());
  }

  async getApplicant(id: string): Promise<Applicant | undefined> {
    return this.applicants.get(id);
  }

  async getApplicantDetails(id: string): Promise<ApplicantDetails | undefined> {
    return this.applicantDetails.get(id);
  }

  async updateApplicantStatus(
    id: string,
    status: Applicant['status']
  ): Promise<Applicant | undefined> {
    const applicant = this.applicants.get(id);
    if (applicant) {
      applicant.status = status;
      this.applicants.set(id, applicant);
      return applicant;
    }
    return undefined;
  }

  async updateApplicantDetails(
    id: string,
    details: Partial<ApplicantDetails>
  ): Promise<ApplicantDetails | undefined> {
    const existingDetails = this.applicantDetails.get(id);
    if (existingDetails) {
      const updatedDetails = { ...existingDetails, ...details };
      this.applicantDetails.set(id, updatedDetails);
      return updatedDetails;
    }
    return undefined;
  }

  getState(): Record<string, unknown> {
    return {
      users: Array.from(this.users.values()),
      applicants: Array.from(this.applicants.values()),
      applicantDetails: Object.fromEntries(this.applicantDetails.entries()),
    };
  }
}

export const storage = new MemStorage();
