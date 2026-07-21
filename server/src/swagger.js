import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwiftMatch API',
      version: '1.0.0',
      description: 'Dating app REST API documentation',
    },
    servers: [
      { url: process.env.SWAGGER_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 3002}`, description: 'API' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            display_name: { type: 'string' },
            age: { type: 'integer' },
            bio: { type: 'string' },
            gender: { type: 'string' },
            city: { type: 'string' },
            photos: { type: 'array', items: { $ref: '#/components/schemas/Photo' } },
            interests: { type: 'array', items: { $ref: '#/components/schemas/Interest' } },
          },
        },
        Photo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            url: { type: 'string' },
            sort_order: { type: 'integer' },
            is_avatar: { type: 'boolean' },
          },
        },
        Interest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name_ru: { type: 'string' },
            name_en: { type: 'string' },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            tier: { type: 'string', enum: ['plus', 'gold', 'platinum'] },
            duration_months: { type: 'integer' },
            price: { type: 'number' },
            started_at: { type: 'string', format: 'date-time' },
            expires_at: { type: 'string', format: 'date-time' },
            is_active: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./server/src/routes/*.js', './server/src/routes/**/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SwiftMatch API Docs',
  }))

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.json(swaggerSpec)
  })
}
