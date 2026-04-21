const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const PORT = process.env.PROXY_PORT || 8000;
const S3_BASE = process.env.S3_BASE || 'https://vercel-bucker-99.s3.ap-south-1.amazonaws.com/__outputs';

app.use(createProxyMiddleware({
  target: S3_BASE,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const hostname = req.hostname;
    let slug = '';
    let filePath = path;

    // Subdomain routing detection (e.g. project-slug.localhost or project.domain.com)
    const hostnameParts = hostname.split('.');
    if (hostnameParts.length >= 2 && isNaN(hostnameParts[0]) && hostnameParts[0] !== 'www') {
       slug = hostnameParts[0];
       // Strip the slug from the path if assets naturally prefixed it (e.g. Vite base path)
       if (filePath.startsWith(`/${slug}/`)) {
           filePath = filePath.substring(slug.length + 1);
       } else if (filePath === `/${slug}`) {
           filePath = '/';
       }
    } else {
       // Support basic path routing /project-slug/...
       const parts = path.split('/');
       if (parts.length > 1 && parts[1] !== '') {
         slug = parts[1];
         filePath = path.substring(slug.length + 1);
       }
    }

    if (!filePath || filePath === '/') filePath = '/index.html';
    
    return `/${slug}${filePath}`; // final S3 destination
  },
  onProxyReq: (proxyReq, req) => {
    console.log(`[Proxy] Routing ${req.hostname}${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error');
  }
}));

app.listen(PORT, () => console.log(`Reverse Proxy running on port ${PORT}`));
