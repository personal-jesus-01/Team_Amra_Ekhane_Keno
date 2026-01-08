"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRequestSchema = exports.loginSchema = exports.insertCoachSessionSchema = exports.insertCollaboratorSchema = exports.insertSlideSchema = exports.insertPresentationSchema = exports.insertUserSchema = exports.coachSessions = exports.templates = exports.collaborators = exports.slides = exports.presentations = exports.users = exports.collaboratorRoleEnum = exports.slideStatusEnum = exports.subscriptionTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// Enums
exports.subscriptionTypeEnum = (0, pg_core_1.pgEnum)('subscription_type', ['free', 'pro', 'single_purchase']);
exports.slideStatusEnum = (0, pg_core_1.pgEnum)('slide_status', ['draft', 'published']);
exports.collaboratorRoleEnum = (0, pg_core_1.pgEnum)('collaborator_role', ['viewer', 'editor', 'owner']);
// Users
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    name: (0, pg_core_1.text)("name"),
    avatar_url: (0, pg_core_1.text)("avatar_url"),
    firebase_uid: (0, pg_core_1.text)("firebase_uid").unique(),
    subscription_type: (0, exports.subscriptionTypeEnum)("subscription_type").default('free'),
    credits: (0, pg_core_1.integer)("credits").default(0),
    subscription_expiry: (0, pg_core_1.timestamp)("subscription_expiry"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// Presentations
exports.presentations = (0, pg_core_1.pgTable)("presentations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    owner_id: (0, pg_core_1.integer)("owner_id").notNull().references(() => exports.users.id),
    status: (0, exports.slideStatusEnum)("status").default('draft'),
    thumbnail_url: (0, pg_core_1.text)("thumbnail_url"),
    slides_count: (0, pg_core_1.integer)("slides_count").default(0),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Slides
exports.slides = (0, pg_core_1.pgTable)("slides", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    presentation_id: (0, pg_core_1.integer)("presentation_id").notNull().references(() => exports.presentations.id),
    slide_number: (0, pg_core_1.integer)("slide_number").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    background_color: (0, pg_core_1.text)("background_color"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
// Collaborators
exports.collaborators = (0, pg_core_1.pgTable)("collaborators", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    presentation_id: (0, pg_core_1.integer)("presentation_id").notNull().references(() => exports.presentations.id),
    user_id: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    role: (0, exports.collaboratorRoleEnum)("role").default('viewer'),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// Templates
exports.templates = (0, pg_core_1.pgTable)("templates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    thumbnail_url: (0, pg_core_1.text)("thumbnail_url"),
    category: (0, pg_core_1.text)("category"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// Coach Sessions
exports.coachSessions = (0, pg_core_1.pgTable)("coach_sessions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    presentation_id: (0, pg_core_1.integer)("presentation_id").notNull().references(() => exports.presentations.id),
    content_coverage: (0, pg_core_1.integer)("content_coverage"),
    pace_score: (0, pg_core_1.integer)("pace_score"),
    clarity_score: (0, pg_core_1.integer)("clarity_score"),
    eye_contact_score: (0, pg_core_1.integer)("eye_contact_score"),
    feedback: (0, pg_core_1.text)("feedback"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
// Insert schemas
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    email: true,
    password: true,
    name: true,
    avatar_url: true,
    firebase_uid: true
});
exports.insertPresentationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.presentations).pick({
    title: true,
    owner_id: true,
    status: true,
    thumbnail_url: true
});
exports.insertSlideSchema = (0, drizzle_zod_1.createInsertSchema)(exports.slides).pick({
    presentation_id: true,
    slide_number: true,
    content: true,
    background_color: true
});
exports.insertCollaboratorSchema = (0, drizzle_zod_1.createInsertSchema)(exports.collaborators).pick({
    presentation_id: true,
    user_id: true,
    role: true
});
exports.insertCoachSessionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.coachSessions).pick({
    user_id: true,
    presentation_id: true,
    content_coverage: true,
    pace_score: true,
    clarity_score: true,
    eye_contact_score: true,
    feedback: true
});
// Login schema
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6).optional(),
    otp: zod_1.z.string().optional(),
    otp_token: zod_1.z.string().optional()
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
exports.otpRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional()
}).refine((data) => data.email || data.phone, {
    message: "Either email or phone is required"
});
//# sourceMappingURL=schema.js.map