import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API router
  const api = express.Router();

  // Users
  api.get("/users", async (req, res, next) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  });

  api.get("/users/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  api.post("/users", async (req, res, next) => {
    try {
      const data = req.body;
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  api.put("/users/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateUser(id, req.body);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  api.delete("/users/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteUser(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // Presentations
  api.get("/presentations", async (req, res, next) => {
    try {
      const items = await storage.listPresentations();
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  api.get("/presentations/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const p = await storage.getPresentation(id);
      if (!p) return res.status(404).json({ message: "Presentation not found" });
      res.json(p);
    } catch (err) {
      next(err);
    }
  });

  api.post("/presentations", async (req, res, next) => {
    try {
      const created = await storage.createPresentation(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  api.put("/presentations/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updatePresentation(id, req.body);
      if (!updated) return res.status(404).json({ message: "Presentation not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  api.delete("/presentations/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await storage.deletePresentation(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // Slides
  api.get("/presentations/:id/slides", async (req, res, next) => {
    try {
      const presentationId = Number(req.params.id);
      const slides = await storage.listSlides(presentationId);
      res.json(slides);
    } catch (err) {
      next(err);
    }
  });

  api.post("/presentations/:id/slides", async (req, res, next) => {
    try {
      const payload = { ...req.body, presentation_id: Number(req.params.id) };
      const created = await storage.createSlide(payload);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  api.put("/slides/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateSlide(id, req.body);
      if (!updated) return res.status(404).json({ message: "Slide not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  api.delete("/slides/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteSlide(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.use("/api", api);

  return httpServer;
}
