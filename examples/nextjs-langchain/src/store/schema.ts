import { s } from 'ajv-ts';

// Schema for applicant personal information
const personalInfoSchema = s.object({
  firstName: s.string(),
  lastName: s.string(),
  email: s.string().format('email'),
  phone: s.string()
});

// Schema for work experience
const workExperienceSchema = s.object({
  company: s.string(),
  position: s.string(),
  startDate: s.string(),
  endDate: s.string().optional(),
  current: s.boolean()
});

// Enum for steps
const StepType = s.enum(['personal', 'work', 'education', 'skills']);

// State schema
const applicantStateSchema = s.object({
  personalInfo: s.union([personalInfoSchema, s.null()]),
  workExperience: s.array(workExperienceSchema),
  currentStep: StepType
});

// Store schema
export const storeSchema = s.object({
  applicant: applicantStateSchema
});

// Export types and schemas
export type PersonalInfo = s.infer<typeof personalInfoSchema>;
export type WorkExperience = s.infer<typeof workExperienceSchema>;
export type ApplicantState = s.infer<typeof applicantStateSchema>;
export type CurrentStep = s.infer<typeof StepType>;

// Export schemas
export {
  personalInfoSchema,
  workExperienceSchema,
  applicantStateSchema,
  StepType as stepSchema
};