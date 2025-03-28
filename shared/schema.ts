import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Applicant schemas
export const applicantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['pending', 'interview', 'approved', 'rejected']),
  position: z.string(),
  appliedDate: z.string(),
});

export const applicantDetailsSchema = z.object({
  skills: z.array(z.string()).optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        year: z.string(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export type Applicant = z.infer<typeof applicantSchema>;
export type ApplicantDetails = z.infer<typeof applicantDetailsSchema>;
