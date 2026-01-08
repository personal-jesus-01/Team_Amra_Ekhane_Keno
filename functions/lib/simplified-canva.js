"use strict";
/**
 * Simplified Canva integration for Firebase Functions deployment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCanvaRoutes = void 0;
const simplified_auth_1 = require("./simplified-auth");
// Mock Canva templates data
const templateData = [
    {
        id: "template-1",
        name: "Professional Business",
        thumbnailUrl: "https://placekitten.com/300/200",
        category: "business"
    },
    {
        id: "template-2",
        name: "Creative Pitch",
        thumbnailUrl: "https://placekitten.com/300/201",
        category: "creative"
    },
    {
        id: "template-3",
        name: "Educational Presentation",
        thumbnailUrl: "https://placekitten.com/300/202",
        category: "education"
    },
    {
        id: "template-4",
        name: "Modern Minimal",
        thumbnailUrl: "https://placekitten.com/300/203",
        category: "minimal"
    }
];
/**
 * Setup Canva integration routes
 */
function setupCanvaRoutes(app) {
    // Get available templates
    app.get('/api/canva/templates', simplified_auth_1.requireAuth, (req, res) => {
        const category = req.query.category;
        const limit = parseInt(req.query.limit || '10');
        let templates = [...templateData];
        // Filter by category if provided
        if (category) {
            templates = templates.filter(t => t.category === category);
        }
        // Apply limit
        templates = templates.slice(0, limit);
        res.json(templates);
        return;
    });
    // Create presentation from template
    app.post('/api/canva/presentations', simplified_auth_1.requireAuth, (req, res) => {
        const { title, template_id } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        // Create mock presentation data
        const presentation = {
            id: `pres-${Date.now()}`,
            title,
            description: `Created from template ${template_id || 'default'}`,
            edit_url: `https://www.canva.com/design/demo/edit`,
            created_at: new Date().toISOString(),
            template_id: template_id || 'default'
        };
        res.status(201).json(presentation);
        return;
    });
}
exports.setupCanvaRoutes = setupCanvaRoutes;
//# sourceMappingURL=simplified-canva.js.map