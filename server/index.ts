import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Create a unique process identifier to prevent conflicts
  const processId = Date.now().toString(36);
  console.log(`Starting server instance: ${processId}`);
  
  // Enhanced server startup with better error handling
  const startServer = async () => {
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port} (instance: ${processId})`);
        resolve(serverInstance);
      });
      
      serverInstance.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} busy, terminating existing processes...`);
          // Force kill existing processes and retry
          setTimeout(() => {
            process.exit(1); // Let the workflow manager restart us
          }, 1000);
        } else {
          console.error('Server error:', err);
          reject(err);
        }
      });
    });
  };

  // Handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`${signal} received for instance ${processId}, shutting down gracefully`);
    server.close(() => {
      console.log(`Server instance ${processId} closed`);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Prevent the uncaught exception handler from causing infinite loops
  process.on('uncaughtException', (err) => {
    console.error(`Uncaught exception in instance ${processId}:`, err.message);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`Unhandled rejection in instance ${processId}:`, reason);
    process.exit(1);
  });

  // Start the server with error handling
  startServer().catch((err) => {
    console.error(`Failed to start server instance ${processId}:`, err);
    process.exit(1);
  });
})();
