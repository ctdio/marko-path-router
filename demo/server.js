require('app-module-path').addPath(__dirname);
require('marko/node-require').install();
require('lasso/node-require-no-op').enable('.less', '.css');

require('marko/browser-refresh').enable();
require('lasso/browser-refresh').enable('*.marko *.css *.less');

var express = require('express');
var compression = require('compression');
var serveStatic = require('serve-static');

var isProduction = process.env.node_env === 'production';


require('lasso').configure({
    plugins: [
        'lasso-marko' // Allow Marko templates to be compiled and transported to the browser
    ],
    outputDir: __dirname + '/static', // Place all generated JS/CSS/etc. files into the "static" dir
    bundlingEnabled: isProduction, // Only enable bundling in production
    minify: isProduction, // Only minify JS and CSS code in production
    fingerprintsEnabled: isProduction // Only add fingerprints to URLs in production
});

var app = express();

var port = process.env.PORT || 8080;

app.use(compression());

app.use('/static', serveStatic(__dirname + '/static'));

app.get('/**', require('pages/home'));

app.listen(port, function() {
    if (process.send) {
        process.send('online');
    }
});
