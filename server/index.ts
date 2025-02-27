import type { NextFunction, Request, Response } from 'express';
import express from 'express';

import { registerRoutes } from './routes';
import { log, serveStatic, setupVite } from './vite';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    });
  }
  next();
});

(async () => {
  try {
    log('Starting server initialization...');
    await registerRoutes(app);
    log('Routes registered successfully');

    // Global error handler
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Internal Server Error',
        });
      }
    });

    if (app.get('env') === 'development') {
      await setupVite(app);
    } else {
      serveStatic(app);
    }

    const PORT = parseInt(process.env.PORT || '5000', 10);
    app.listen(PORT, '0.0.0.0', () => {
      log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
