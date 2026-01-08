import swaggerJsdoc from 'swagger-jsdoc';
import '../server/swagger-docs'; // Import to register JSDoc comments

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SlideBanai API',
      version: '1.0.0',
      description: 'API for SlideBanai - AI-powered presentation platform',
      contact: {
        name: 'SlideBanai Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || 'https://api.slidebanai.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            status: {
              type: 'integer',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Presentation: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Presentation ID',
            },
            title: {
              type: 'string',
              description: 'Presentation title',
            },
            description: {
              type: 'string',
              description: 'Presentation description',
            },
            slides: {
              type: 'array',
              description: 'Array of slides',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
      },
    },
  },
  apis: [
    './server/routes/*.ts',
    './server/routes/**/*.ts',
  ],
};

export const specs = swaggerJsdoc(options);
