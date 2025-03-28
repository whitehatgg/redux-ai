import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type {
  AddNoteAction,
  Applicant,
  ApplicantDetails,
  ApplicantState,
  SelectApplicantAction,
  SetApplicantDetailsAction,
  SetApplicantsAction,
  SetSearchTermAction,
  SetSortOrderAction,
  SetVisibleColumnsAction,
} from '../schema';

// Define initial state that matches ApplicantState type
const initialState: ApplicantState = {
  applicants: [],
  tableConfig: {
    visibleColumns: ['name', 'email', 'status', 'position', 'appliedDate'],
    enableSearch: true,
    searchTerm: '',
    sortBy: null,
    sortOrder: null,
  },
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
      state.selectedApplicantId = action.payload;
      // The actual details will be fetched from the server and set using setApplicantDetails
    },
    clearSelectedApplicant(state) {
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
        // Create a new applicantDetails object with the updated notes
        state.applicantDetails = {
          ...state.applicantDetails,
          notes: action.payload,
        };
      }
    },
    // New actions for server data
    setApplicantDetails(state, action: PayloadAction<SetApplicantDetailsAction['payload']>) {
      state.applicantDetails = action.payload;
    },
    setApplicants(state, action: PayloadAction<SetApplicantsAction['payload']>) {
      state.applicants = action.payload;
    },
    // For updating a single applicant in the list
    updateApplicant(state, action: PayloadAction<Applicant>) {
      const index = state.applicants.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.applicants[index] = action.payload;
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
  clearSelectedApplicant,
  approveApplicant,
  rejectApplicant,
  scheduleInterview,
  addNote,
  setApplicantDetails,
  setApplicants,
  updateApplicant,
} = applicantSlice.actions;

export default applicantSlice.reducer;
