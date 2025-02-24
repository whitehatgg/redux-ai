import { s } from 'ajv-ts';

// Define schemas using ajv-ts
const personalInfoSchema = s.object({
  firstName: s.string(),
  lastName: s.string(),
  email: s.string(),
  phone: s.string(), // Optional
}, {
  required: ['firstName', 'lastName', 'email']
});

const workExperienceSchema = s.object({
  company: s.string(),
  position: s.string(),
  startDate: s.string(),
  endDate: s.string(), // Optional
  responsibilities: s.array(s.string()),
}, {
  required: ['company', 'position', 'startDate', 'responsibilities']
});

const educationSchema = s.object({
  institution: s.string(),
  degree: s.string(),
  field: s.string(),
  graduationYear: s.string(), // Optional
}, {
  required: ['institution', 'degree', 'field']
});

const skillsSchema = s.object({
  technicalSkills: s.array(s.string()),
  softSkills: s.array(s.string()),
  languages: s.array(s.string()), // Optional
}, {
  required: ['technicalSkills', 'softSkills']
});

const applicantSchema = s.object({
  personalInfo: s.nullable(personalInfoSchema),
  workExperience: s.array(workExperienceSchema),
  education: s.array(educationSchema),
  skills: s.nullable(skillsSchema),
  currentStep: s.enum(['personal', 'work', 'education', 'skills']),
}, {
  required: ['currentStep', 'workExperience', 'education']
});

// Store schema that includes all state
export const storeSchema = s.object({
  applicant: applicantSchema,
}, {
  required: ['applicant']
});

// Export types using schema inference
export type ValidatedPersonalInfo = s.infer<typeof personalInfoSchema>;
export type ValidatedWorkExperience = s.infer<typeof workExperienceSchema>;
export type ValidatedEducation = s.infer<typeof educationSchema>;
export type ValidatedSkills = s.infer<typeof skillsSchema>;
export type ValidatedApplicant = s.infer<typeof applicantSchema>;
export type ValidatedStoreSchema = s.infer<typeof storeSchema>;