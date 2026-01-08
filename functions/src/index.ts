/**
 * Firebase Cloud Functions API entry point
 * Optimized for production deployment
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { Express, Request, Response } from "express";

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    message: "SlideBanai API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production"
  });
  return;
});

// Import auth setup from simplified implementation
import { setupAuth, requireAuth } from "./simplified-auth";

// Setup authentication
setupAuth(app);

// API routes
app.get("/api/test", requireAuth, (req: Request, res: Response) => {
  res.json({ 
    message: "API test successful",
    user: req.user || { guest: true }
  });
  return;
});

// Mock presentation data endpoint for frontend testing
app.get("/api/presentations", requireAuth, (req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      title: "Sample Presentation",
      description: "This is a sample presentation created via Firebase Functions",
      slides: 10,
      createdAt: new Date().toISOString(),
      thumbnail: "https://placekitten.com/300/200"
    }
  ]);
  return;
});

// Canva integration endpoints
app.get("/api/canva/templates", requireAuth, (req: Request, res: Response) => {
  res.json([
    {
      id: "template-1",
      name: "Business Template",
      thumbnailUrl: "https://placekitten.com/200/140",
      category: "business"
    },
    {
      id: "template-2",
      name: "Creative Template",
      thumbnailUrl: "https://placekitten.com/200/141",
      category: "creative"
    }
  ]);
  return;
});

// Import simplified Canva implementation
import { setupCanvaRoutes } from "./simplified-canva";

// Setup Canva routes
setupCanvaRoutes(app);

// Export the API as a Firebase Function
export const api = functions.https.onRequest(app);
