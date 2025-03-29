import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../lib/queryClient';

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

// Define thunks
export const fetchApplicants = createAsyncThunk(
  'applicant/fetchApplicants',
  async () => {
    try {
      const response = await apiRequest<Applicant[]>('/api/applicants', 'GET');
      return response;
    } catch (error) {
      console.error('Error fetching applicants:', error);
      throw error;
    }
  }
);

export const fetchApplicantDetails = createAsyncThunk(
  'applicant/fetchApplicantDetails',
  async (id: string) => {
    try {
      const response = await apiRequest<ApplicantDetails>(`/api/applicants/${id}/details`, 'GET');
      return response;
    } catch (error) {
      console.error(`Error fetching applicant details for ${id}:`, error);
      throw error;
    }
  }
);

export const updateApplicantStatus = createAsyncThunk(
  'applicant/updateStatus',
  async ({ id, status }: { id: string; status: Applicant['status'] }) => {
    try {
      const response = await apiRequest<Applicant>(
        `/api/applicants/${id}/status`, 
        'PATCH', 
        { status }
      );
      return response;
    } catch (error) {
      console.error(`Error updating applicant status for ${id}:`, error);
      throw error;
    }
  }
);

export const updateApplicantNotes = createAsyncThunk(
  'applicant/updateNotes',
  async ({ id, notes }: { id: string; notes: string }) => {
    try {
      const response = await apiRequest<ApplicantDetails & { id: string }>(
        `/api/applicants/${id}/notes`, 
        'PATCH', 
        { notes }
      );
      return { ...response, id }; // Add ID to response for tracking
    } catch (error) {
      console.error(`Error updating applicant notes for ${id}:`, error);
      throw error;
    }
  }
);

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
  // Handle async thunk results
  extraReducers: (builder) => {
    // fetchApplicants
    builder.addCase(fetchApplicants.fulfilled, (state, action) => {
      state.applicants = action.payload;
    });

    // fetchApplicantDetails
    builder.addCase(fetchApplicantDetails.fulfilled, (state, action) => {
      state.applicantDetails = action.payload;
    });

    // updateApplicantStatus
    builder.addCase(updateApplicantStatus.fulfilled, (state, action) => {
      // Update the applicant in the list
      const index = state.applicants.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.applicants[index] = action.payload;
      }
    });

    // updateApplicantNotes
    builder.addCase(updateApplicantNotes.fulfilled, (state, action) => {
      // Now we have an id in the response
      if (state.applicantDetails && state.selectedApplicantId === action.payload.id) {
        state.applicantDetails = {
          ...state.applicantDetails,
          notes: action.payload.notes,
        };
      }
    });
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

// Example of a complex workflow using the async thunks with effect tracking
export const complexWorkflow = (id: string) => async (dispatch: any) => {
  // Start the workflow
  dispatch({ type: 'applicant/complexWorkflow/start', payload: id });
  
  try {
    // Step 1: Fetch the applicant details - this will be automatically tracked by middleware
    const details = await dispatch(fetchApplicantDetails(id)).unwrap();
    
    // Mock a score since it's not in our schema
    const mockScore = Math.floor(Math.random() * 100);
    
    // Step 2: Update the status based on conditions
    if (mockScore > 80) {
      await dispatch(updateApplicantStatus({ id, status: 'approved' })).unwrap();
    } else if (mockScore > 60) {
      await dispatch(updateApplicantStatus({ id, status: 'interview' })).unwrap();
    } else {
      await dispatch(updateApplicantStatus({ id, status: 'rejected' })).unwrap();
    }
    
    // Step 3: Add a note about the automated decision
    const noteText = `Automated workflow processed on ${new Date().toISOString()}. Score: ${mockScore}`;
    await dispatch(updateApplicantNotes({ 
      id, 
      notes: details.notes ? details.notes + '\n\n' + noteText : noteText 
    })).unwrap();
    
    // Mark the workflow as complete
    dispatch({ type: 'applicant/complexWorkflow/complete', payload: id });
    
    return { success: true };
  } catch (error) {
    // Handle errors
    console.error('Workflow failed:', error);
    
    // Mark the workflow as failed
    dispatch({ 
      type: 'applicant/complexWorkflow/failed', 
      payload: { id, error } 
    });
    
    return { success: false, error };
  }
};

export default applicantSlice.reducer;
