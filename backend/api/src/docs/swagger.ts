import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from '@trustiq/shared-config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrustIQ API',
      version: '1.0.0',
      description: 'Decentralized AI Reputation Network API',
      contact: {
        name: 'TrustIQ Support',
        email: 'support@trustiq.xyz',
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
    },
    servers: [
      {
        url: env.NODE_ENV === 'production' 
          ? 'https://api.trustiq.xyz/api/v1'
          : `http://localhost:${env.API_PORT}/api/v1`,
        description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            walletAddress: {
              type: 'string',
              example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            did: {
              type: 'string',
              example: 'did:trustiq:sui:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            trustScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 85.5,
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
        TrustScore: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 85.5,
            },
            breakdown: {
              type: 'object',
              properties: {
                consistency: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                },
                skillDepth: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                },
                peerValidation: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                },
                engagementQuality: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                },
                anomalyFactor: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                },
              },
            },
            insights: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            calculatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LinkedAccount: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            provider: {
              type: 'string',
              enum: ['github', 'linkedin', 'twitter', 'upwork'],
            },
            username: {
              type: 'string',
            },
            verified: {
              type: 'boolean',
            },
            verificationDate: {
              type: 'string',
              format: 'date-time',
            },
            metadata: {
              type: 'object',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            details: {
              type: 'object',
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Authentication required',
                message: 'No valid authentication token provided',
              },
            },
          },
        },
        Forbidden: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Access denied',
                message: 'You do not have permission to access this resource',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Resource not found',
                message: 'The requested resource was not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation failed',
                message: 'The request data is invalid',
                details: {
                  field: ['Error message'],
                },
              },
            },
          },
        },
        RateLimitExceeded: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Rate limit exceeded',
                message: 'You have exceeded the rate limit for this endpoint',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TrustIQ API Documentation',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('Swagger documentation available at /api-docs');
};