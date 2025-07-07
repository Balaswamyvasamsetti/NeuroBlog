const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.NODE_ENV === 'production' ? 'https://neuroblog.com' : 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};