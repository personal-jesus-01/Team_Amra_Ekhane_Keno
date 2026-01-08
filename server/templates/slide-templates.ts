// Professional slide templates with design configurations
export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'academic' | 'creative' | 'technical';
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  layouts: {
    title: GoogleSlidesLayout;
    content: GoogleSlidesLayout;
    section: GoogleSlidesLayout;
    conclusion: GoogleSlidesLayout;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

interface GoogleSlidesLayout {
  layout: string;
  styling: {
    titleFontSize: number;
    bodyFontSize: number;
    titleAlignment: 'LEFT' | 'CENTER' | 'RIGHT';
    bodyAlignment: 'LEFT' | 'CENTER' | 'RIGHT';
  };
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'modern-business',
    name: 'Modern Business',
    description: 'Clean, professional design perfect for business presentations',
    category: 'business',
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6'
    },
    layouts: {
      title: {
        layout: 'TITLE',
        styling: {
          titleFontSize: 44,
          bodyFontSize: 20,
          titleAlignment: 'CENTER',
          bodyAlignment: 'CENTER'
        }
      },
      content: {
        layout: 'TITLE_AND_BODY',
        styling: {
          titleFontSize: 28,
          bodyFontSize: 16,
          titleAlignment: 'LEFT',
          bodyAlignment: 'LEFT'
        }
      },
      section: {
        layout: 'SECTION_HEADER',
        styling: {
          titleFontSize: 36,
          bodyFontSize: 18,
          titleAlignment: 'CENTER',
          bodyAlignment: 'CENTER'
        }
      },
      conclusion: {
        layout: 'TITLE_AND_BODY',
        styling: {
          titleFontSize: 32,
          bodyFontSize: 18,
          titleAlignment: 'CENTER',
          bodyAlignment: 'CENTER'
        }
      }
    },
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans'
    }
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Vibrant gradient design for creative and innovative presentations',
    category: 'creative',
    theme: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#7c3aed',
      backgroundColor: '#f8fafc',
      textColor: '#334155',
      accentColor: '#a855f7'
    },
    layouts: {
      title: {
        layout: 'TITLE',
        styling: {
          titleFontSize: 48,
          bodyFontSize: 22,
          titleAlignment: 'CENTER',
          bodyAlignment: 'CENTER'
        }
      },
      content: {
        layout: 'TITLE_AND_BODY',
        styling: {
          titleFontSize: 30,
          bodyFontSize: 18,
          titleAlignment: 'LEFT',
          bodyAlignment: 'LEFT'
        }
      },
      section: {
        layout: 'SECTION_HEADER',
        styling: {
          titleFontSize: 38,
          bodyFontSize: 20,
          titleAlignment: 'CENTER',
          bodyAlignment: 'CENTER'
        }
      },
      conclusion: {
        layout: 'TITLE_AND_BODY',
        styling: {
          titleFontSize: 34,
          bodyFontSize: 20,
          titleAlignment: 'CENTER',
          bodyAlignment: 'CENTER'
        }
      }
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Source Sans Pro'
    }
  }
];

export function getTemplateById(templateId: string): SlideTemplate | undefined {
  return SLIDE_TEMPLATES.find(template => template.id === templateId);
}

export function getTemplatesByCategory(category: string): SlideTemplate[] {
  return SLIDE_TEMPLATES.filter(template => template.category === category);
}