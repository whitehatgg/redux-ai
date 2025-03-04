import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Define applicant personal information schema
export const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
});

// Define work experience schema
const WorkExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean(),
});

// Define action schema for form handling
export const actionSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('applicant/setPersonalInfo'),
      payload: PersonalInfoSchema,
    }),
    z.object({
      type: z.literal('applicant/addWorkExperience'),
      payload: WorkExperienceSchema,
    }),
    z.object({
      type: z.literal('applicant/setCurrentStep'),
      payload: z.enum(['personal', 'work', 'education', 'skills']),
    }),
  ])
  .nullable();

// State schema for the applicant slice
export const applicantStateSchema = z.object({
  personalInfo: PersonalInfoSchema.nullable(),
  workExperience: z.array(WorkExperienceSchema),
  currentStep: z.enum(['personal', 'work', 'education', 'skills']),
});

// Export inferred types
export type Action = z.infer<typeof actionSchema>;
export type ApplicantState = z.infer<typeof applicantStateSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type CurrentStep = z.infer<typeof applicantStateSchema>['currentStep'];

// Generate JSON schema with proper configuration
const jsonSchemaOptions = {
  target: 'jsonSchema7',
  strictUnions: true,
};

export const jsonActionSchema = zodToJsonSchema(actionSchema, jsonSchemaOptions);
export const jsonStateSchema = zodToJsonSchema(applicantStateSchema, jsonSchemaOptions);
