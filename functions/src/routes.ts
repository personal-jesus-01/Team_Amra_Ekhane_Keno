import type { Express } from "express";
import type { Server } from "http";
import { registerAllRoutes } from "./routes/index";

/**
 * Register all routes and create the server
 * Main entry point from server/index.ts
 * 
 * @param app Express application
 * @returns HTTP server with WebSocket support
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Use our centralized route registration
  return registerAllRoutes(app);
}
