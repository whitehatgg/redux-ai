import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Applicant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  position: string;
  appliedDate: string;
}

export interface TableConfig {
  visibleColumns: (keyof Applicant)[];
  enableSearch: boolean;
  searchTerm: string;
}

interface ApplicantState {
  applicants: Applicant[];
  tableConfig: TableConfig;
}

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
  },
};

export const applicantSlice = createSlice({
  name: 'applicant',
  initialState,
  reducers: {
    setVisibleColumns: (state, action: PayloadAction<(keyof Applicant)[]>) => {
      state.tableConfig.visibleColumns = action.payload;
    },
    toggleSearch: (state) => {
      state.tableConfig.enableSearch = !state.tableConfig.enableSearch;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.tableConfig.searchTerm = action.payload;
    },
    addApplicant: (state, action: PayloadAction<Omit<Applicant, 'id'>>) => {
      const newApplicant = {
        ...action.payload,
        id: Math.random().toString(36).substring(7),
      };
      state.applicants.push(newApplicant);
    },
  },
});

export const {
  setVisibleColumns,
  toggleSearch,
  setSearchTerm,
  addApplicant,
} = applicantSlice.actions;

export default applicantSlice.reducer;
