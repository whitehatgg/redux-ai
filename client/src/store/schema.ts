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

// Define the complete state schema
export const applicantStateSchema = z.object({
  applicants: z.array(applicantSchema),
  tableConfig: tableConfigSchema,
  selectedId: z.string().nullable(),
});

// Define the action payload schemas
export const setSearchTermSchema = z.string();
export const setVisibleColumnsSchema = z.array(z.enum(columnKeys));
export const setSortOrderSchema = z.object({
  column: z.string(),
  direction: z.enum(['asc', 'desc']),
});

// Status update schema
export const updateStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
});

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
      payload: z.string(),
    }),
    z.object({
      type: z.literal('applicant/clearSelection'),
    }),
    z.object({
      type: z.literal('applicant/updateApplicantStatus'),
      payload: updateStatusSchema,
    }),
    z.object({
      type: z.literal('applicant/archiveApplicant'),
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
export type UpdateApplicantStatusAction = Extract<Action, { type: 'applicant/updateApplicantStatus' }>;
export type ArchiveApplicantAction = Extract<Action, { type: 'applicant/archiveApplicant' }>;


// Generate JSON schema
export const jsonActionSchema = zodToJsonSchema(actionSchema);
export const jsonStateSchema = zodToJsonSchema(applicantStateSchema);