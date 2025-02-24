import type { NextFunction, Request, Response } from 'express';
import express from 'express';

import { registerRoutes } from './routes';
import { log, serveStatic, setupVite } from './vite';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: Record<string, unknown>) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});


(async () => {
  try {
    log('Starting server initialization...');
    const server = await registerRoutes(app);
    log('Routes registered successfully');

    // Global error handler - now just logs and passes error response from adapter
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      if (!res.headersSent) {
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        res.status(500).json({ error: message });
      }
    });

    if (app.get('env') === 'development') {
      log('Setting up Vite for development...');
      await setupVite(app, server);
      log('Vite setup completed');
    } else {
      log('Setting up static file serving...');
      serveStatic(app);
      log('Static file serving setup completed');
    }

    const PORT = parseInt(process.env.PORT || '5000', 10);
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();