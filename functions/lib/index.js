"use strict";
/**
 * Firebase Cloud Functions API entry point
 * Optimized for production deployment
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
admin.initializeApp();
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "SlideBanai API is running",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "production"
    });
    return;
});
// Import auth setup from simplified implementation
const simplified_auth_1 = require("./simplified-auth");
// Setup authentication
(0, simplified_auth_1.setupAuth)(app);
// API routes
app.get("/api/test", simplified_auth_1.requireAuth, (req, res) => {
    res.json({
        message: "API test successful",
        user: req.user || { guest: true }
    });
    return;
});
// Mock presentation data endpoint for frontend testing
app.get("/api/presentations", simplified_auth_1.requireAuth, (req, res) => {
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
app.get("/api/canva/templates", simplified_auth_1.requireAuth, (req, res) => {
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
const simplified_canva_1 = require("./simplified-canva");
// Setup Canva routes
(0, simplified_canva_1.setupCanvaRoutes)(app);
// Export the API as a Firebase Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map