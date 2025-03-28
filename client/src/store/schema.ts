import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Define the base schemas for table data
export const applicantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.string(),
  position: z.string(),
  appliedDate: z.string(),
});

// Define the allowed column keys
export const columnKeys = ['name', 'email', 'status', 'position', 'appliedDate'] as const;
export type VisibleColumnKey = (typeof columnKeys)[number];

// Table configuration schema
export const tableConfigSchema = z.object({
  visibleColumns: z.array(z.enum(columnKeys)),
  enableSearch: z.boolean(),
  searchTerm: z.string(),
  sortBy: z.union([z.string(), z.null()]),
  sortOrder: z.union([z.enum(['asc', 'desc']), z.null()]),
});

// Define the view modes
export const viewModes = ['list', 'detail'] as const;
export type ViewMode = (typeof viewModes)[number];

// Define the complete state schema
export const applicantStateSchema = z.object({
  applicants: z.array(applicantSchema),
  tableConfig: tableConfigSchema,
  viewMode: z.enum(viewModes),
  selectedApplicantId: z.string().nullable(),
  // Extended applicant data with more details when viewing a specific applicant
  applicantDetails: z.object({
    skills: z.array(z.string()).optional(),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      year: z.string()
    })).optional(),
    experience: z.array(z.object({
      company: z.string(),
      role: z.string(),
      duration: z.string(),
      description: z.string()
    })).optional(),
    notes: z.string().optional()
  }).nullable(),
});

// Define the action payload schemas
export const setSearchTermSchema = z.string();
export const setVisibleColumnsSchema = z.array(z.enum(columnKeys));
export const setSortOrderSchema = z.object({
  column: z.string(),
  direction: z.enum(['asc', 'desc']),
});
export const selectApplicantSchema = z.string();

// Action schemas defined as discriminated union
export const actionSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('applicant/setSearchTerm'),
      payload: setSearchTermSchema,
    }),
    z.object({
      type: z.literal('applicant/toggleSearch'),
    }),
    z.object({
      type: z.literal('applicant/setVisibleColumns'),
      payload: setVisibleColumnsSchema,
    }),
    z.object({
      type: z.literal('applicant/setSortOrder'),
      payload: setSortOrderSchema,
    }),
    z.object({
      type: z.literal('applicant/selectApplicant'),
      payload: selectApplicantSchema,
    }),
    z.object({
      type: z.literal('applicant/viewDetail'),
    }),
    z.object({
      type: z.literal('applicant/viewList'),
    }),
    z.object({
      type: z.literal('applicant/approveApplicant'),
    }),
    z.object({
      type: z.literal('applicant/rejectApplicant'),
    }),
    z.object({
      type: z.literal('applicant/scheduleInterview'),
    }),
    z.object({
      type: z.literal('applicant/addNote'),
      payload: z.string(),
    }),
  ])
  .nullable();

// Export inferred types
export type Applicant = z.infer<typeof applicantSchema>;
export type TableConfig = z.infer<typeof tableConfigSchema>;
export type ApplicantState = z.infer<typeof applicantStateSchema>;
export type Action = z.infer<typeof actionSchema>;

// Export action types
export type SetSearchTermAction = Extract<Action, { type: 'applicant/setSearchTerm' }>;
export type ToggleSearchAction = Extract<Action, { type: 'applicant/toggleSearch' }>;
export type SetVisibleColumnsAction = Extract<Action, { type: 'applicant/setVisibleColumns' }>;
export type SetSortOrderAction = Extract<Action, { type: 'applicant/setSortOrder' }>;
export type SelectApplicantAction = Extract<Action, { type: 'applicant/selectApplicant' }>;
export type ViewDetailAction = Extract<Action, { type: 'applicant/viewDetail' }>;
export type ViewListAction = Extract<Action, { type: 'applicant/viewList' }>;
export type ApproveApplicantAction = Extract<Action, { type: 'applicant/approveApplicant' }>;
export type RejectApplicantAction = Extract<Action, { type: 'applicant/rejectApplicant' }>;
export type ScheduleInterviewAction = Extract<Action, { type: 'applicant/scheduleInterview' }>;
export type AddNoteAction = Extract<Action, { type: 'applicant/addNote' }>;

// Generate JSON schema
export const jsonActionSchema = zodToJsonSchema(actionSchema);
export const jsonStateSchema = zodToJsonSchema(applicantStateSchema);
