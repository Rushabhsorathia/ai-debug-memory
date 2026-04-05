require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectMongo } = require('./services/mongo.service');
const bugRoutes = require('./routes/bugs.routes');
const searchRoutes = require('./routes/search.routes');
const statsRoutes = require('./routes/stats.routes');
const { setupMCPServer } = require('./mcp/index');
const limiter = require('./middleware/rateLimit');
const logger = require('./utils/logger');
const config = require('../config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api/', limiter);

// Routes
app.use('/api/v1/bugs', bugRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    service: 'AI Debug Memory',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root info
app.get('/', (req, res) => {
  res.json({
    service: 'AI Debug Memory',
    version: '1.0.0',
    description: 'Personal bug fix database - never debug the same bug twice',
    endpoints: {
      health: '/health',
      api: '/api/v1/bugs, /api/v1/search, /api/v1/stats',
      mcp: '/mcp'
    }
  });
});

// MCP Server
setupMCPServer(app);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start
const start = async () => {
  await connectMongo();
  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`AI Debug Memory running on port ${config.PORT} [${config.NODE_ENV}]`);
    logger.info(`MCP endpoint: http://localhost:${config.PORT}/mcp`);
    logger.info(`REST API: http://localhost:${config.PORT}/api/v1/`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  const { disconnectMongo } = require('./services/mongo.service');
  await disconnectMongo();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  const { disconnectMongo } = require('./services/mongo.service');
  await disconnectMongo();
  process.exit(0);
});

start();
