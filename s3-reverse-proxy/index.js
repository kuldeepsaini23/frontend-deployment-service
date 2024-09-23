const express = require('express');
const httpProxy = require('http-proxy');
const dotenv = require('dotenv')
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000

const BASE_PATH = process.env.BASE_PATH
const proxy = httpProxy.createProxyServer();



app.use((req, res, next) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    //CUSTOm DOmain - DB Query

    // Proxy to the correct bucket
    const resolveTo = `${BASE_PATH}/${subdomain}`

    // create a proxy server to the correct bucket
    return proxy.web(req, res, { target: resolveTo, changeOrigin: true});
});
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    const url = req.url;
    if(url === '/'){
      proxyReq.path += 'index.html';
    }
  });
app.listen(PORT, ()=> console.log(`Reverse Proxy Server is running on port ${PORT}`));