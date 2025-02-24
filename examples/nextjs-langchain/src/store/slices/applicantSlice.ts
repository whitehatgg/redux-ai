import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import type { PersonalInfo, WorkExperience, Education, Skills } from '../schema';

interface ApplicantState {
  personalInfo: PersonalInfo | null;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skills | null;
  currentStep: 'personal' | 'work' | 'education' | 'skills';
}

const initialState: ApplicantState = {
  personalInfo: null,
  workExperience: [],
  education: [],
  skills: null,
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
    addEducation: (state, action: PayloadAction<Education>) => {
      state.education.push(action.payload);
    },
    setSkills: (state, action: PayloadAction<Skills>) => {
      state.skills = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<ApplicantState['currentStep']>) => {
      state.currentStep = action.payload;
    },
  },
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.applicant,
      };
    },
  },
});

export const { 
  setPersonalInfo, 
  addWorkExperience, 
  addEducation, 
  setSkills,
  setCurrentStep 
} = applicantSlice.actions;

export default applicantSlice.reducer;