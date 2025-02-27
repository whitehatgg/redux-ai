import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

import type { ApplicantState, CurrentStep, PersonalInfo, WorkExperience } from '../schema';

const initialState: ApplicantState = {
  personalInfo: null,
  workExperience: [],
  currentStep: 'personal',
};

export const applicantSlice = createSlice({
  name: 'applicant',
  initialState,
  reducers: {
    setPersonalInfo: (state, action: PayloadAction<PersonalInfo>) => {
      state.personalInfo = action.payload;
      state.currentStep = 'work';
    },
    addWorkExperience: (state, action: PayloadAction<WorkExperience>) => {
      state.workExperience.push(action.payload);
    },
    setCurrentStep: (state, action: PayloadAction<CurrentStep>) => {
      state.currentStep = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(HYDRATE, (state, action: any) => {
      return {
        ...state,
        ...action.payload.applicant,
      };
    });
  },
});

export const { setPersonalInfo, addWorkExperience, setCurrentStep } = applicantSlice.actions;

export default applicantSlice.reducer;
