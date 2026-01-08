import { pgTable, text, serial, integer, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const subscriptionTypeEnum = pgEnum('subscription_type', ['free', 'pro', 'single_purchase']);
export const slideStatusEnum = pgEnum('slide_status', ['draft', 'published']);
export const collaboratorRoleEnum = pgEnum('collaborator_role', ['viewer', 'editor', 'owner']);

// ===========================
// USERS
// ===========================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  avatar_url: text("avatar_url"),
  firebase_uid: text("firebase_uid").unique(),
  subscription_type: subscriptionTypeEnum("subscription_type").default('free'),
  credits: integer("credits").default(0),
  subscription_expiry: timestamp("subscription_expiry"),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// PRESENTATIONS
// ===========================
export const presentations = pgTable("presentations", {
  id: serial("id").primaryKey(),
  owner_id: integer("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  status: slideStatusEnum("status").default('draft'),
  slides_count: integer("slides_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// ===========================
// PRESENTATION INTEGRATIONS
// ===========================
export const presentationIntegrations = pgTable("presentation_integrations", {
  id: serial("id").primaryKey(),
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // google_slides, canva
  external_id: text("external_id").notNull(),
  edit_url: text("edit_url"),
  view_url: text("view_url"),
  thumbnail_url: text("thumbnail_url"),
  created_at: timestamp("created_at").defaultNow()
}, (table) => ({
  uniqueProviderExternalId: unique().on(table.provider, table.external_id)
}));

// ===========================
// SLIDES
// ===========================
export const slides = pgTable("slides", {
  id: serial("id").primaryKey(),
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id, { onDelete: 'cascade' }),
  slide_number: integer("slide_number").notNull(),
  content: text("content").notNull(),
  background_color: text("background_color"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  uniquePresentationSlideNumber: unique().on(table.presentation_id, table.slide_number)
}));

// ===========================
// COLLABORATORS
// ===========================
export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id, { onDelete: 'cascade' }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: collaboratorRoleEnum("role").default('viewer'),
  created_at: timestamp("created_at").defaultNow()
}, (table) => ({
  uniquePresentationUser: unique().on(table.presentation_id, table.user_id)
}));

// ===========================
// TEMPLATES
// ===========================
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnail_url: text("thumbnail_url"),
  category: text("category"),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// PRESENTATION TEMPLATES
// ===========================
export const presentationTemplates = pgTable("presentation_templates", {
  presentation_id: integer("presentation_id").notNull().references(() => presentations.id, { onDelete: 'cascade' }),
  template_id: integer("template_id").notNull().references(() => templates.id),
  applied_at: timestamp("applied_at").defaultNow()
}, (table) => ({
  pk: unique().on(table.presentation_id, table.template_id)
}));

// ===========================
// COACH SESSIONS
// ===========================
export const coachSessions = pgTable("coach_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  presentation_id: integer("presentation_id").references(() => presentations.id, { onDelete: 'set null' }),
  mode: text("mode").notNull(), // existing_presentation | uploaded_file
  language: text("language").default('english'),
  duration_minutes: integer("duration_minutes"),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// COACH SESSION CONFIGS
// ===========================
export const coachSessionConfigs = pgTable("coach_session_configs", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => coachSessions.id, { onDelete: 'cascade' }),
  audience_type: text("audience_type"),
  speech_style: text("speech_style"),
  technicality_level: text("technicality_level"),
  slide_range_start: integer("slide_range_start"),
  slide_range_end: integer("slide_range_end")
});

// ===========================
// AI OUTPUTS
// ===========================
export const aiOutputs = pgTable("ai_outputs", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => coachSessions.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // speech_script | feedback | summary
  content: text("content").notNull(),
  model_used: text("model_used"),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// USER RECORDINGS
// ===========================
export const userRecordings = pgTable("user_recordings", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => coachSessions.id, { onDelete: 'cascade' }),
  transcript: text("transcript"),
  video_duration: integer("video_duration"),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// PERFORMANCE SCORES
// ===========================
export const performanceScores = pgTable("performance_scores", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => coachSessions.id, { onDelete: 'cascade' }),
  metric: text("metric").notNull(), // pace, clarity, fluency, confidence, content_coverage, etc
  score: integer("score").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// FEEDBACK ITEMS
// ===========================
export const feedbackItems = pgTable("feedback_items", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull().references(() => coachSessions.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // strength | improvement | exercise | pronunciation
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

// ===========================
// INSERT SCHEMAS
// ===========================
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  avatar_url: true,
  firebase_uid: true
});

export const insertPresentationSchema = createInsertSchema(presentations).pick({
  owner_id: true,
  title: true,
  description: true,
  status: true,
  slides_count: true
});

export const insertPresentationIntegrationSchema = createInsertSchema(presentationIntegrations).pick({
  presentation_id: true,
  provider: true,
  external_id: true,
  edit_url: true,
  view_url: true,
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

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  thumbnail_url: true,
  category: true
});

export const insertPresentationTemplateSchema = createInsertSchema(presentationTemplates).pick({
  presentation_id: true,
  template_id: true
});

export const insertCoachSessionSchema = createInsertSchema(coachSessions).pick({
  user_id: true,
  presentation_id: true,
  mode: true,
  language: true,
  duration_minutes: true
});

export const insertCoachSessionConfigSchema = createInsertSchema(coachSessionConfigs).pick({
  session_id: true,
  audience_type: true,
  speech_style: true,
  technicality_level: true,
  slide_range_start: true,
  slide_range_end: true
});

export const insertAiOutputSchema = createInsertSchema(aiOutputs).pick({
  session_id: true,
  type: true,
  content: true,
  model_used: true
});

export const insertUserRecordingSchema = createInsertSchema(userRecordings).pick({
  session_id: true,
  transcript: true,
  video_duration: true
});

export const insertPerformanceScoreSchema = createInsertSchema(performanceScores).pick({
  session_id: true,
  metric: true,
  score: true
});

export const insertFeedbackItemSchema = createInsertSchema(feedbackItems).pick({
  session_id: true,
  type: true,
  content: true
});

// ===========================
// LOGIN & AUTH SCHEMAS
// ===========================
export const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  otp: z.string().optional(),
  otp_token: z.string().optional()
}).refine((data) => {
  const hasIdentifier = data.username || data.email || data.phone;
  const hasAuthMethod = data.password || data.otp;
  return hasIdentifier && hasAuthMethod;
}, {
  message: "Either username/email/phone and either password or OTP code is required"
});

export const otpRequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional()
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required"
});

// ===========================
// TYPES
// ===========================
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type Presentation = typeof presentations.$inferSelect;

export type InsertPresentationIntegration = z.infer<typeof insertPresentationIntegrationSchema>;
export type PresentationIntegration = typeof presentationIntegrations.$inferSelect;

export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type Slide = typeof slides.$inferSelect;

export type InsertCollaborator = z.infer<typeof insertCollaboratorSchema>;
export type Collaborator = typeof collaborators.$inferSelect;

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export type InsertPresentationTemplate = z.infer<typeof insertPresentationTemplateSchema>;
export type PresentationTemplate = typeof presentationTemplates.$inferSelect;

export type InsertCoachSession = z.infer<typeof insertCoachSessionSchema>;
export type CoachSession = typeof coachSessions.$inferSelect;

export type InsertCoachSessionConfig = z.infer<typeof insertCoachSessionConfigSchema>;
export type CoachSessionConfig = typeof coachSessionConfigs.$inferSelect;

export type InsertAiOutput = z.infer<typeof insertAiOutputSchema>;
export type AiOutput = typeof aiOutputs.$inferSelect;

export type InsertUserRecording = z.infer<typeof insertUserRecordingSchema>;
export type UserRecording = typeof userRecordings.$inferSelect;

export type InsertPerformanceScore = z.infer<typeof insertPerformanceScoreSchema>;
export type PerformanceScore = typeof performanceScores.$inferSelect;

export type InsertFeedbackItem = z.infer<typeof insertFeedbackItemSchema>;
export type FeedbackItem = typeof feedbackItems.$inferSelect;

export type LoginData = z.infer<typeof loginSchema>;
export type OtpRequestData = z.infer<typeof otpRequestSchema>;
