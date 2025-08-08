
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Accept-Encoding']
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept, Accept-Encoding');
  res.sendStatus(200);
});

// Direct download API endpoint for Internet Archive files
app.post('/api/download', async (req, res) => {
  try {
    const { url, filename } = req.body;
    
    if (!url || !url.includes('archive.org/download/')) {
      return res.status(400).json({
        error: 'Invalid or missing archive.org download URL'
      });
    }

    console.log('=== DIRECT DOWNLOAD REQUEST ===');
    console.log('Archive URL:', url);
    console.log('Filename:', filename);
    
    // Set headers for download
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://archive.org/'
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      console.error('=== ARCHIVE.ORG ERROR ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      
      let errorMessage = '';
      if (response.status === 404) {
        errorMessage = 'File not found on Internet Archive. The file may have been removed or the URL is incorrect.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. The file may have restricted access.';
      } else if (response.status === 503) {
        errorMessage = 'Internet Archive service temporarily unavailable. Please try again later.';
      } else {
        errorMessage = `Archive.org returned ${response.status}: ${response.statusText}`;
      }
      
      return res.status(response.status).json({
        error: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: url
        }
      });
    }
    
    // Set appropriate headers for download
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Disposition');
    
    // Set content headers
    res.header('Content-Type', contentType);
    
    if (contentLength) {
      res.header('Content-Length', contentLength);
    }
    
    // Extract filename from URL or use provided filename
    const urlParts = url.split('/');
    const originalFilename = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]);
    const downloadFilename = filename || originalFilename;
    res.header('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    // Stream the response
    response.body.pipe(res);
    
    // Handle stream errors
    response.body.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred' });
      }
    });
    
  } catch (error) {
    console.error('Download API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Download server error',
        details: error.message
      });
    }
  }
});

// Proxy endpoint for Internet Archive downloads (legacy)
app.get('/proxy/archive/*', async (req, res) => {
  try {
    // Extract the original URL from the request path
    const originalUrl = req.params[0];
    
    console.log('=== PROXY REQUEST ===');
    console.log('Original request path:', req.path);
    console.log('Extracted URL path:', originalUrl);
    
    // Ensure the URL has the download parameter
    let fullUrl;
    if (originalUrl.includes('?download=1')) {
      fullUrl = `https://archive.org/${originalUrl}`;
    } else if (originalUrl.includes('?')) {
      fullUrl = `https://archive.org/${originalUrl}&download=1`;
    } else {
      fullUrl = `https://archive.org/${originalUrl}?download=1`;
    }
    
    console.log('Final archive.org URL:', fullUrl);
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Forward range headers for streaming support
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://archive.org/'
    };
    
    // Forward range header if present (for streaming)
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      console.error('=== ARCHIVE.ORG ERROR ===');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));
      
      // Try to read the response body for more details
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error('Response Body:', errorBody.substring(0, 500));
      } catch (bodyError) {
        console.error('Could not read error response body:', bodyError.message);
      }
      
      // Provide specific error messages based on status
      let errorMessage = '';
      if (response.status === 404) {
        errorMessage = 'File not found on Internet Archive. The file may have been removed or the URL is incorrect.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. The file may have restricted access.';
      } else if (response.status === 503) {
        errorMessage = 'Internet Archive service temporarily unavailable. Please try again later.';
      } else {
        errorMessage = `Archive.org returned ${response.status}: ${response.statusText}`;
      }
      
      return res.status(response.status).json({
        error: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl
        }
      });
    }
    
    // Set appropriate headers for download
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    const contentRange = response.headers.get('content-range');
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Accept-Ranges, Content-Range, Content-Type, Content-Disposition, ETag, Last-Modified');
    res.header('Access-Control-Allow-Credentials', 'false');
    
    // Set content headers
    res.header('Content-Type', contentType);
    
    if (contentLength) {
      res.header('Content-Length', contentLength);
    }
    
    if (acceptRanges) {
      res.header('Accept-Ranges', acceptRanges);
    }
    
    if (contentRange) {
      res.header('Content-Range', contentRange);
    }
    
    // Extract filename from URL for download
    const urlParts = fullUrl.split('/');
    const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Set status code (206 for partial content, 200 for full)
    res.status(response.status);
    
    // Stream the response
    response.body.pipe(res);
    
    // Handle stream errors
    response.body.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred' });
      }
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Proxy server error',
        details: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Proxy endpoint: http://localhost:${PORT}/proxy/archive/`);
});

module.exports = app;
