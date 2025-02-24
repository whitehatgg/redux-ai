import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Applicant, TableConfig } from '../schema';

// Export the state type for use in other files
export type ApplicantState = {
  applicants: Applicant[];
  tableConfig: TableConfig;
};

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
    setVisibleColumns: (state, action: PayloadAction<TableConfig['visibleColumns']>) => {
      state.tableConfig.visibleColumns = action.payload;
    },
    toggleSearch: (state) => {
      state.tableConfig.enableSearch = !state.tableConfig.enableSearch;
      if (!state.tableConfig.enableSearch) {
        state.tableConfig.searchTerm = '';
      }
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

export const { setVisibleColumns, toggleSearch, setSearchTerm, addApplicant } = applicantSlice.actions;
export default applicantSlice.reducer;