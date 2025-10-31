// reverse-proxy.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PROXY_PORT || 8000;
const S3_BASE = process.env.S3_BASE || 'https://vercel-project-clone.s3.ap-south-1.amazonaws.com/__outputs';

app.use('/:projectSlug', createProxyMiddleware({
  target: S3_BASE,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const slug = req.params.projectSlug;
    let filePath = path.replace(`/${slug}`, '');
    if (!filePath || filePath === '/') filePath = '/index.html';
    return `/${slug}${filePath}`; // final S3 path: /<slug>/index.html
  },
  onProxyReq: (proxyReq, req) => {
    console.log(`Proxying ${req.originalUrl} to S3 /__outputs/${req.params.projectSlug}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error');
  }
}));

app.listen(PORT, () => console.log(`Reverse Proxy running on port ${PORT}`));
