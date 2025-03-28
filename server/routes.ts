import { ExpressAdapter } from '@redux-ai/express';
import { applicantSchema } from '@shared/schema';
import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { runtime } from './config';
import { storage } from './storage';

export async function registerRoutes(app: Express) {
  const adapter = new ExpressAdapter();
  const handler = await adapter.createHandler({ runtime });

  app.post('/api/query', async (req, res, next) => {
    try {
      await (handler as unknown as (req: any, res: any, next: any) => Promise<void>)(
        req,
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  });

  // Applicant endpoints
  app.get('/api/applicants', async (_req: Request, res: Response) => {
    try {
      const applicants = await storage.getApplicants();
      res.json(applicants);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch applicants' });
    }
  });

  app.get('/api/applicants/:id', async (req: Request, res: Response) => {
    try {
      const applicant = await storage.getApplicant(req.params.id);
      if (!applicant) {
        return res.status(404).json({ error: 'Applicant not found' });
      }
      res.json(applicant);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch applicant' });
    }
  });

  app.get('/api/applicants/:id/details', async (req: Request, res: Response) => {
    try {
      const details = await storage.getApplicantDetails(req.params.id);
      if (!details) {
        return res.status(404).json({ error: 'Applicant details not found' });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch applicant details' });
    }
  });

  app.patch('/api/applicants/:id/status', async (req: Request, res: Response) => {
    try {
      const statusSchema = z.object({
        status: z.enum(['pending', 'interview', 'approved', 'rejected']),
      });

      const result = statusSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updatedApplicant = await storage.updateApplicantStatus(
        req.params.id,
        result.data.status
      );

      if (!updatedApplicant) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      res.json(updatedApplicant);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update applicant status' });
    }
  });

  app.patch('/api/applicants/:id/notes', async (req: Request, res: Response) => {
    try {
      const notesSchema = z.object({
        notes: z.string(),
      });

      const result = notesSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid notes format' });
      }

      const updatedDetails = await storage.updateApplicantDetails(req.params.id, {
        notes: result.data.notes,
      });

      if (!updatedDetails) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      res.json(updatedDetails);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update applicant notes' });
    }
  });

  return app;
}
