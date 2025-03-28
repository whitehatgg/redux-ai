import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type {
  ApplicantState,
  SelectApplicantAction,
  SetSearchTermAction,
  SetSortOrderAction,
  SetVisibleColumnsAction,
  AddNoteAction,
} from '../schema';

// Mock applicant details
const mockApplicantDetails = {
  '1': {
    skills: ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Redux'],
    education: [
      {
        institution: 'University of Technology',
        degree: 'Bachelor of Computer Science',
        year: '2020'
      }
    ],
    experience: [
      {
        company: 'Tech Solutions Inc.',
        role: 'Junior Developer',
        duration: '2020-2022',
        description: 'Worked on front-end development using React and Redux.'
      },
      {
        company: 'Startup Innovation',
        role: 'Intern',
        duration: '2019-2020',
        description: 'Assisted in developing web applications using JavaScript and Node.js.'
      }
    ],
    notes: 'Strong candidate with good technical skills'
  },
  '2': {
    skills: ['Product Strategy', 'User Research', 'Agile', 'Roadmapping', 'Analytics'],
    education: [
      {
        institution: 'Business University',
        degree: 'MBA',
        year: '2018'
      },
      {
        institution: 'Design College',
        degree: 'Bachelor of Design',
        year: '2015'
      }
    ],
    experience: [
      {
        company: 'Tech Giant Corp',
        role: 'Associate Product Manager',
        duration: '2018-2022',
        description: 'Led product development for mobile applications with over 1M users.'
      },
      {
        company: 'Design Agency',
        role: 'UX Researcher',
        duration: '2015-2018',
        description: 'Conducted user research and created product specifications.'
      }
    ],
    notes: 'Excellent communication skills and leadership potential'
  },
  '3': {
    skills: ['UI Design', 'Figma', 'User Research', 'Prototyping', 'Adobe Creative Suite'],
    education: [
      {
        institution: 'Design Institute',
        degree: 'Master of UX Design',
        year: '2019'
      }
    ],
    experience: [
      {
        company: 'Creative Solutions',
        role: 'Junior Designer',
        duration: '2019-2022',
        description: 'Created user interfaces for web and mobile applications.'
      }
    ],
    notes: 'Strong design portfolio but limited experience'
  }
};

// Define initial state that matches ApplicantState type
const initialState: ApplicantState = {
  applicants: [
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
  ],
  tableConfig: {
    visibleColumns: ['name', 'email', 'status', 'position', 'appliedDate'],
    enableSearch: true,
    searchTerm: '',
    sortBy: null,
    sortOrder: null,
  },
  viewMode: 'list',
  selectedApplicantId: null,
  applicantDetails: null,
};

const applicantSlice = createSlice({
  name: 'applicant',
  initialState,
  reducers: {
    setSearchTerm(state, action: PayloadAction<SetSearchTermAction['payload']>) {
      state.tableConfig.searchTerm = action.payload;
    },
    toggleSearch(state) {
      state.tableConfig.enableSearch = !state.tableConfig.enableSearch;
      if (!state.tableConfig.enableSearch) {
        state.tableConfig.searchTerm = '';
      }
    },
    setVisibleColumns(state, action: PayloadAction<SetVisibleColumnsAction['payload']>) {
      state.tableConfig.visibleColumns = action.payload;
    },
    setSortOrder(state, action: PayloadAction<SetSortOrderAction['payload']>) {
      state.tableConfig.sortBy = action.payload.column;
      state.tableConfig.sortOrder = action.payload.direction;
    },
    selectApplicant(state, action: PayloadAction<SelectApplicantAction['payload']>) {
      const applicantId = action.payload;
      state.selectedApplicantId = applicantId;
      
      // Simulate fetching applicant details from API (using our mock data)
      const mockDetails = mockApplicantDetails[applicantId as keyof typeof mockApplicantDetails];
      state.applicantDetails = mockDetails || null;
      
      // Automatically switch to detail view when an applicant is selected
      // This ensures AI commands like "select applicant 1" will work properly
      state.viewMode = 'detail';
    },
    viewDetail(state) {
      state.viewMode = 'detail';
    },
    viewList(state) {
      state.viewMode = 'list';
      state.selectedApplicantId = null;
      state.applicantDetails = null;
    },
    approveApplicant(state) {
      if (state.selectedApplicantId) {
        const applicant = state.applicants.find(a => a.id === state.selectedApplicantId);
        if (applicant) {
          applicant.status = 'approved';
        }
      }
    },
    rejectApplicant(state) {
      if (state.selectedApplicantId) {
        const applicant = state.applicants.find(a => a.id === state.selectedApplicantId);
        if (applicant) {
          applicant.status = 'rejected';
        }
      }
    },
    scheduleInterview(state) {
      if (state.selectedApplicantId) {
        const applicant = state.applicants.find(a => a.id === state.selectedApplicantId);
        if (applicant) {
          applicant.status = 'interview';
        }
      }
    },
    addNote(state, action: PayloadAction<AddNoteAction['payload']>) {
      if (state.selectedApplicantId && state.applicantDetails) {
        state.applicantDetails.notes = action.payload;
      }
    },
  },
});

export const { 
  setSearchTerm, 
  toggleSearch, 
  setVisibleColumns, 
  setSortOrder, 
  selectApplicant,
  viewDetail,
  viewList,
  approveApplicant,
  rejectApplicant,
  scheduleInterview,
  addNote
} = applicantSlice.actions;

export default applicantSlice.reducer;
