const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins with proper headers
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add JSON parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Proxy configuration for TMDb API with better error handling
const tmdbProxy = createProxyMiddleware({
  target: 'https://api.themoviedb.org',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api/tmdb': '/3'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[TMDb] Proxying: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    proxyReq.setHeader('User-Agent', 'MovieApp/1.0');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[TMDb] Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('[TMDb] Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'TMDb API proxy error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Proxy configuration for Internet Archive with timeout handling
const archiveProxy = createProxyMiddleware({
  target: 'https://archive.org',
  changeOrigin: true,
  secure: true,
  timeout: 30000, // 30 second timeout
  pathRewrite: {
    '^/api/archive': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Archive] Proxying: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Archive] Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('[Archive] Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Archive API proxy error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Apply proxy middlewares
app.use('/api/tmdb', tmdbProxy);
app.use('/api/archive', archiveProxy);

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 TMDb API: http://localhost:${PORT}/api/tmdb`);
  console.log(`📚 Archive API: http://localhost:${PORT}/api/archive`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});