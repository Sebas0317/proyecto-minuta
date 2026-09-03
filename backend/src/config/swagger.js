/**
 * Swagger/OpenAPI configuration for Proyecto Minuta.
 * Auto-generates API documentation from JSDoc comments.
 */
'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('node:path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Proyecto Minuta API',
      version: '1.0.0',
      description:
        'REST API para Control de Portería, Minuta Digital de Vigilancia, Censo de Apartamentos, Paquetería y Accesos.',
      contact: {
        name: 'Proyecto Minuta',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor local de desarrollo',
      },
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
        Room: {
          type: 'object',
          required: ['numero', 'tipo', 'camas', 'capacidad', 'piso'],
          properties: {
            id: { type: 'string', description: 'Unique room ID' },
            numero: { type: 'string', description: 'Room number' },
            tipo: { type: 'string', description: 'Room type' },
            camas: { type: 'string', description: 'Bed configuration' },
            capacidad: { type: 'integer', description: 'Maximum capacity' },
            piso: { type: 'integer', description: 'Floor number' },
            estado: {
              type: 'string',
              enum: [
                'disponible',
                'reservada',
                'ocupada',
                'limpieza',
                'mantenimiento',
                'fuera_servicio',
              ],
            },
            huesped: {
              type: 'string',
              nullable: true,
              description: 'Guest name',
            },
            pin: {
              type: 'string',
              nullable: true,
              description: '4-digit room PIN',
            },
            checkIn: { type: 'string', format: 'date-time', nullable: true },
            checkOut: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Consumo: {
          type: 'object',
          required: ['roomId', 'descripcion', 'categoria', 'precio'],
          properties: {
            id: { type: 'string', description: 'Unique consumption ID' },
            roomId: { type: 'string', description: 'Room ID' },
            descripcion: {
              type: 'string',
              description: 'Consumption description',
            },
            categoria: {
              type: 'string',
              enum: ['restaurante', 'bar', 'servicios'],
            },
            precio: {
              type: 'integer',
              description: 'Price in COP (Colombian Pesos)',
            },
            fecha: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            details: {
              type: 'array',
              items: { type: 'object' },
              description: 'Validation error details',
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Rooms', description: 'Room management operations' },
      { name: 'Consumos', description: 'Consumption tracking' },
      { name: 'History', description: 'Check-in/out history' },
      { name: 'State History', description: 'Room state change history' },
      {
        name: 'Prices',
        description: 'Room rates and product prices (admin only)',
      },
    ],
  },
  // Path to API docs in route files
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
