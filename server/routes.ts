import type { Express } from "express";
import { createServer } from "http";
import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express) {
  app.post('/api/query', async (req, res) => {
    try {
      const { query } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that helps users interact with Redux state through natural language."
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" }
      });

      res.json({ 
        message: response.choices[0].message.content,
        action: null // TODO: Implement action generation
      });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ error: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}