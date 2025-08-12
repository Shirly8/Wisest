const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/wisest',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.log('Backend server not running. API calls will fail gracefully.');
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          error: 'Backend server not available',
          message: 'Please start the backend server to use AI features'
        }));
      },
      logLevel: 'silent'
    })
  );
}; 