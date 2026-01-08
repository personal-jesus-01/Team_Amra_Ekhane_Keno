import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const subscriptionTypeEnum = pgEnum('subscription_type', ['free', 'pro', 'single_purchase']);
export const slideStatusEnum = pgEnum('slide_status', ['draft', 'published']);
export const collaboratorRoleEnum = pgEnum('collaborator_role', ['viewer', 'editor', 'owner']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  avatar_url: text("avatar_url"),
  firebase_uid: text("firebase_uid").unique(), // Firebase User ID for Google authentication
  subscription_type: subscriptionTypeEnum("subscription_type").default('free'),
  credits: integer("credits").default(0),
  subscription_expiry: timestamp("subscription_expiry"),
  created_at: timestamp("created_at").defaultNow()
});

// Presentations
export const presentations = pgTable("presentations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  owner_id: integer("owner_id").notNull().references(() => users.id),
  status: slideStatusEnum("status").default('draft'),
  thumbnail_url: text("thumbnail_url"),
  slides_count: integer("slides_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Slides
export const slides = pgTable("slides", {
  id: serial("id").primaryKey(),
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id),
  slide_number: integer("slide_number").notNull(),
  content: text("content").notNull(),
  background_color: text("background_color"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Collaborators
export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  role: collaboratorRoleEnum("role").default('viewer'),
  created_at: timestamp("created_at").defaultNow()
});

// Templates
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnail_url: text("thumbnail_url"),
  category: text("category"),
  created_at: timestamp("created_at").defaultNow()
});

// Coach Sessions
export const coachSessions = pgTable("coach_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id),
  content_coverage: integer("content_coverage"),
  pace_score: integer("pace_score"),
  clarity_score: integer("clarity_score"),
  eye_contact_score: integer("eye_contact_score"),
  feedback: text("feedback"),
  created_at: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  avatar_url: true,
  firebase_uid: true
});

export const insertPresentationSchema = createInsertSchema(presentations).pick({
  title: true,
  owner_id: true,
  status: true,
  thumbnail_url: true
});

export const insertSlideSchema = createInsertSchema(slides).pick({
  presentation_id: true,
  slide_number: true,
  content: true,
  background_color: true
});

export const insertCollaboratorSchema = createInsertSchema(collaborators).pick({
  presentation_id: true,
  user_id: true,
  role: true
});

export const insertCoachSessionSchema = createInsertSchema(coachSessions).pick({
  user_id: true,
  presentation_id: true,
  content_coverage: true,
  pace_score: true,
  clarity_score: true,
  eye_contact_score: true,
  feedback: true
});

// Login schema
export const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  otp: z.string().optional(),
  otp_token: z.string().optional()
}).refine((data) => {
  // At least one identifier (username, email, or phone) is required
  const hasIdentifier = data.username || data.email || data.phone;
  
  // Either password or OTP must be provided for authentication
  const hasAuthMethod = data.password || data.otp;
  
  return hasIdentifier && hasAuthMethod;
}, {
  message: "Either username/email/phone and either password or OTP code is required"
});

// OTP request schema
export const otpRequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional()
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required"
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type Presentation = typeof presentations.$inferSelect;

export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type Slide = typeof slides.$inferSelect;

export type InsertCollaborator = z.infer<typeof insertCollaboratorSchema>;
export type Collaborator = typeof collaborators.$inferSelect;

export type InsertCoachSession = z.infer<typeof insertCoachSessionSchema>;
export type CoachSession = typeof coachSessions.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;
export type OtpRequestData = z.infer<typeof otpRequestSchema>;
