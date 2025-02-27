import { Type } from '@sinclair/typebox';

// Define applicant personal information schema
const PersonalInfoSchema = Type.Object({
  firstName: Type.String(),
  lastName: Type.String(),
  email: Type.String(),
  phone: Type.String(),
});

// Define work experience schema
const WorkExperienceSchema = Type.Object({
  company: Type.String(),
  position: Type.String(),
  startDate: Type.String(),
  endDate: Type.Optional(Type.String()),
  current: Type.Boolean(),
});

// Define action schema for form handling
export const actionSchema = Type.Union([
  Type.Object(
    {
      type: Type.Literal('applicant/setPersonalInfo'),
      payload: PersonalInfoSchema,
    },
    {
      description: "Update applicant's personal information",
      keywords: ['personal', 'info', 'contact', 'details'],
    }
  ),
  Type.Object(
    {
      type: Type.Literal('applicant/addWorkExperience'),
      payload: WorkExperienceSchema,
    },
    {
      description: 'Add work experience entry',
      keywords: ['work', 'experience', 'job', 'career'],
    }
  ),
  Type.Object(
    {
      type: Type.Literal('applicant/setCurrentStep'),
      payload: Type.Union([
        Type.Literal('personal'),
        Type.Literal('work'),
        Type.Literal('education'),
        Type.Literal('skills'),
      ]),
    },
    {
      description: 'Set current form step',
      keywords: ['step', 'navigation', 'form', 'progress'],
    }
  ),
]);

// State schema for the applicant slice
export const applicantStateSchema = Type.Object({
  personalInfo: Type.Union([PersonalInfoSchema, Type.Null()]),
  workExperience: Type.Array(WorkExperienceSchema),
  currentStep: Type.Union([
    Type.Literal('personal'),
    Type.Literal('work'),
    Type.Literal('education'),
    Type.Literal('skills'),
  ]),
});

// Export inferred types for use in slices
export type Action = ReturnType<typeof actionSchema>;
export type ApplicantState = ReturnType<typeof applicantStateSchema>;
export type PersonalInfo = ReturnType<typeof PersonalInfoSchema>;
export type WorkExperience = ReturnType<typeof WorkExperienceSchema>;
export type CurrentStep = 'personal' | 'work' | 'education' | 'skills';
