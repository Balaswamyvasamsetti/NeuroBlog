require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const commentRoutes = require('./routes/comments');
const geminiRoutes = require('./routes/gemini');
const aiAgentRoutes = require('./routes/aiAgent');
const chatbotRoutes = require('./routes/chatbot');
const { Server } = require('ws');
const webpush = require('web-push');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 8080;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ],
});

// Environment variable validation
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'GEMINI_API_KEY'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    logger.error(`Missing required environment variable: ${env}`);
    process.exit(1);
  }
}

// Middleware
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com' 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests, please try again later' }
}));

// MongoDB Connection with Retry
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
    logger.info('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

// Web Push Setup
try {
  webpush.setVapidDetails(
    'mailto:support@neuroblog.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  logger.info('Web Push VAPID keys configured successfully.');
} catch (error) {
  logger.error('Error setting up VAPID keys:', error.message);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'NeuroBlog API v1.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      categories: '/api/categories',
      comments: '/api/comments',
      gemini: '/api/gemini'
    },
    documentation: 'https://github.com/yourusername/neuroblog#api-endpoints'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/chatbot', chatbotRoutes);

// WebSocket Server for Real-Time Collaboration
let wss;
try {
  wss = new Server({ port: process.env.WS_PORT || 8081 });
  wss.on('connection', ws => {
    logger.info('WebSocket client connected');
    ws.on('message', message => {
      try {
        const data = JSON.parse(message);
        // Broadcast to all connected clients except sender
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        logger.error('WebSocket message error:', error.message);
      }
    });
    ws.on('close', () => logger.info('WebSocket client disconnected'));
    ws.on('error', (error) => logger.error('WebSocket error:', error.message));
  });
  logger.info(`WebSocket server running on port ${process.env.WS_PORT || 8081}`);
} catch (error) {
  logger.error('Failed to start WebSocket server:', error.message);
}

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  res.status(status).json({ error: message });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (wss) wss.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (wss) wss.close();
  process.exit(0);
});

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));