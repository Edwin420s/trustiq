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