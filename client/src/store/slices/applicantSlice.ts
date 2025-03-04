import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type {
  ApplicantState,
  SetSearchTermAction,
  SetSortOrderAction,
  SetVisibleColumnsAction,
  ToggleSearchAction,
  VisibleColumnKey,
} from '../schema';

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
  },
});

export const { setSearchTerm, toggleSearch, setVisibleColumns, setSortOrder } =
  applicantSlice.actions;
export default applicantSlice.reducer;
