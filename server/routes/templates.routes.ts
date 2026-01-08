import { Router } from 'express';
import { requireAuth } from '../auth';

const router = Router();

// Google Slides template definitions
const GOOGLE_SLIDES_TEMPLATES = [
  {
    id: 'modern-business',
    name: 'Modern Business',
    description: 'Clean, professional design perfect for business presentations',
    category: 'Business',
    thumbnail: '/templates/modern-business.jpg',
    features: ['Professional layouts', 'Clean typography', 'Consistent branding']
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Vibrant design ideal for creative presentations',
    category: 'Creative',
    thumbnail: '/templates/creative-portfolio.jpg',
    features: ['Bold colors', 'Creative layouts', 'Visual emphasis']
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Traditional corporate style with blue accents',
    category: 'Corporate',
    thumbnail: '/templates/corporate-blue.jpg',
    features: ['Corporate branding', 'Blue color scheme', 'Professional layouts']
  },
  {
    id: 'startup-pitch',
    name: 'Startup Pitch',
    description: 'Dynamic design for startup and investor presentations',
    category: 'Startup',
    thumbnail: '/templates/startup-pitch.jpg',
    features: ['Dynamic layouts', 'Investor-focused', 'Modern design']
  },
  {
    id: 'education-modern',
    name: 'Modern Education',
    description: 'Educational template with clear layouts',
    category: 'Education',
    thumbnail: '/templates/education-modern.jpg',
    features: ['Clear layouts', 'Educational focus', 'Easy to read']
  },
  {
    id: 'tech-presentation',
    name: 'Tech Presentation',
    description: 'Technology-focused template with modern aesthetics',
    category: 'Technology',
    thumbnail: '/templates/tech-presentation.jpg',
    features: ['Tech-focused', 'Modern aesthetics', 'Data visualization']
  }
];

// Get all available templates
router.get('/', (req, res) => {
  res.json(GOOGLE_SLIDES_TEMPLATES);
});

// Get templates by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const templates = GOOGLE_SLIDES_TEMPLATES.filter(
    template => template.category.toLowerCase() === category.toLowerCase()
  );
  res.json(templates);
});

// Get template by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const template = GOOGLE_SLIDES_TEMPLATES.find(template => template.id === id);
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.json(template);
});

export { router as templatesRouter };