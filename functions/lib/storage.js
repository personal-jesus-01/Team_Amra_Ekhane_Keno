"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
// In-memory storage implementation
class MemStorage {
    constructor() {
        this.users = new Map();
        this.presentations = new Map();
        this.slides = new Map();
        this.collaborators = new Map();
        this.coachSessions = new Map();
        this.templates = new Map();
        this.userId = 1;
        this.presentationId = 1;
        this.slideId = 1;
        this.collaboratorId = 1;
        this.coachSessionId = 1;
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000 // 24h
        });
        // Initialize with some templates
        this.initializeTemplates();
    }
    // User operations
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find((user) => user.username.toLowerCase() === username.toLowerCase());
    }
    async getUserByEmail(email) {
        return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
    }
    async getUserByPhone(phone) {
        return Array.from(this.users.values()).find((user) => user.phone === phone);
    }
    async getUserByFirebaseUid(firebaseUid) {
        return Array.from(this.users.values()).find((user) => user.firebase_uid === firebaseUid);
    }
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    async updateUser(id, data) {
        const user = await this.getUser(id);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = Object.assign(Object.assign({}, user), data);
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    async createUser(insertUser) {
        const id = this.userId++;
        const now = new Date();
        const user = Object.assign(Object.assign({}, insertUser), { id, subscription_type: 'free', credits: 50, created_at: now });
        this.users.set(id, user);
        return user;
    }
    async updateUserCredits(userId, credits) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = Object.assign(Object.assign({}, user), { credits });
        this.users.set(userId, updatedUser);
        return updatedUser;
    }
    async updateUserSubscription(userId, type, expiryDate) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = Object.assign(Object.assign({}, user), { subscription_type: type, subscription_expiry: expiryDate, credits: type === 'pro' ? (user.credits || 0) + 5 : (user.credits || 0) });
        this.users.set(userId, updatedUser);
        return updatedUser;
    }
    // Presentation operations
    async createPresentation(presentation) {
        const id = this.presentationId++;
        const now = new Date();
        const newPresentation = Object.assign(Object.assign({}, presentation), { id, slides_count: 0, created_at: now, updated_at: now });
        this.presentations.set(id, newPresentation);
        return newPresentation;
    }
    async getPresentationById(id) {
        return this.presentations.get(id);
    }
    async getPresentationsByUserId(userId) {
        return Array.from(this.presentations.values()).filter((presentation) => presentation.owner_id === userId);
    }
    async getSharedPresentations(userId) {
        // Get all presentation IDs where the user is a collaborator
        const collaboratorPresentationIds = Array.from(this.collaborators.values())
            .filter(collab => collab.user_id === userId)
            .map(collab => collab.presentation_id);
        // Get the presentation objects for those IDs
        return Array.from(this.presentations.values()).filter((presentation) => collaboratorPresentationIds.includes(presentation.id));
    }
    async updatePresentation(id, data) {
        const presentation = await this.getPresentationById(id);
        if (!presentation) {
            throw new Error('Presentation not found');
        }
        const updatedPresentation = Object.assign(Object.assign(Object.assign({}, presentation), data), { updated_at: new Date() });
        this.presentations.set(id, updatedPresentation);
        return updatedPresentation;
    }
    async deletePresentation(id) {
        this.presentations.delete(id);
        // Also delete associated slides and collaborators
        for (const [slideId, slide] of this.slides.entries()) {
            if (slide.presentation_id === id) {
                this.slides.delete(slideId);
            }
        }
        for (const [collabId, collab] of this.collaborators.entries()) {
            if (collab.presentation_id === id) {
                this.collaborators.delete(collabId);
            }
        }
    }
    // Slide operations
    async createSlide(slide) {
        const id = this.slideId++;
        const now = new Date();
        const newSlide = Object.assign(Object.assign({}, slide), { id, created_at: now, updated_at: now });
        this.slides.set(id, newSlide);
        // Update slide count in the presentation
        const presentation = await this.getPresentationById(slide.presentation_id);
        if (presentation) {
            await this.updatePresentation(presentation.id, {
                slides_count: presentation.slides_count + 1
            });
        }
        return newSlide;
    }
    async getSlidesByPresentationId(presentationId) {
        return Array.from(this.slides.values())
            .filter(slide => slide.presentation_id === presentationId)
            .sort((a, b) => a.slide_number - b.slide_number);
    }
    async updateSlide(id, data) {
        const slide = this.slides.get(id);
        if (!slide) {
            throw new Error('Slide not found');
        }
        const updatedSlide = Object.assign(Object.assign(Object.assign({}, slide), data), { updated_at: new Date() });
        this.slides.set(id, updatedSlide);
        return updatedSlide;
    }
    async deleteSlide(id) {
        const slide = this.slides.get(id);
        if (!slide) {
            throw new Error('Slide not found');
        }
        this.slides.delete(id);
        // Update slide count in the presentation
        const presentation = await this.getPresentationById(slide.presentation_id);
        if (presentation) {
            await this.updatePresentation(presentation.id, {
                slides_count: Math.max(0, presentation.slides_count - 1)
            });
        }
    }
    // Collaborator operations
    async addCollaborator(collaborator) {
        const id = this.collaboratorId++;
        const now = new Date();
        const newCollaborator = Object.assign(Object.assign({}, collaborator), { id, created_at: now });
        this.collaborators.set(id, newCollaborator);
        return newCollaborator;
    }
    async getCollaborators(presentationId) {
        return Array.from(this.collaborators.values()).filter(collab => collab.presentation_id === presentationId);
    }
    async removeCollaborator(presentationId, userId) {
        for (const [id, collab] of this.collaborators.entries()) {
            if (collab.presentation_id === presentationId && collab.user_id === userId) {
                this.collaborators.delete(id);
                break;
            }
        }
    }
    // Coach session operations
    async createCoachSession(session) {
        const id = this.coachSessionId++;
        const now = new Date();
        const newSession = Object.assign(Object.assign({}, session), { id, created_at: now });
        this.coachSessions.set(id, newSession);
        return newSession;
    }
    async getCoachSessionsByUserId(userId) {
        return Array.from(this.coachSessions.values())
            .filter(session => session.user_id === userId)
            .sort((a, b) => { var _a, _b; return (((_a = b.created_at) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.created_at) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); });
    }
    async getCoachSessionsByPresentationId(presentationId) {
        return Array.from(this.coachSessions.values())
            .filter(session => session.presentation_id === presentationId)
            .sort((a, b) => { var _a, _b; return (((_a = b.created_at) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.created_at) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); });
    }
    // Templates
    async getTemplates() {
        return Array.from(this.templates.values());
    }
    // Initialize with some templates
    initializeTemplates() {
        const templates = [
            {
                id: 1,
                name: 'Business Pitch',
                description: 'Perfect for fundraising and investor pitches',
                thumbnail_url: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
                category: 'Business',
                created_at: new Date()
            },
            {
                id: 2,
                name: 'Marketing Plan',
                description: 'Showcase your marketing strategy effectively',
                thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
                category: 'Marketing',
                created_at: new Date()
            },
            {
                id: 3,
                name: 'Educational',
                description: 'Ideal for academic presentations and lectures',
                thumbnail_url: 'https://images.unsplash.com/photo-1613608788129-11938423088f?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
                category: 'Education',
                created_at: new Date()
            },
            {
                id: 4,
                name: 'Portfolio',
                description: 'Showcase your work and achievements',
                thumbnail_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=256&q=80',
                category: 'Portfolio',
                created_at: new Date()
            }
        ];
        templates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
}
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
//# sourceMappingURL=storage.js.map