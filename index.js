/**
 * Created by Kamaron on 6/24/2015.
 */

// This is the entry point for the server.

var http = require('http');
var url = require('url');

var config = require('./config');
var RoutesList = require('./models/routesList').RoutesList;

// Routes...
var routesList = new RoutesList();

// Expose the routes list globally, so that other modules can use it.
module.exports.routesList = routesList;

// V0.1 REQUIRED ROUTES
routesList.addRoute(require('./routes/api/v1/server-data'), config.endpoints.SERVER_DATA);
routesList.addRoute(require('./routes/api/v1/build-system'), config.endpoints.BUILD_SYSTEM);
routesList.addRoute(require('./routes/api/v1/comparison-system'), config.endpoints.COMPARISON_SYSTEM);
routesList.addRoute(require('./routes/api/v1/build-status'), config.endpoints.BUILD_STATUS);
routesList.addRoute(require('./routes/api/v1/build'), config.endpoints.BUILD);

// ADDITIONAL ROUTES
routesList.addRoute(require('./routes/api/v1/coffee'), config.endpoints.COFFEE);

var server = http.createServer(function (req, res) {
    var pathname = url.parse(req.url).pathname;

    // Send request out to routing system for further action...
    var route = routesList.getRoute(pathname);
    if (route) {
        if (req.method === 'POST') {
            route.routePost(req, res);
        } else if (req.method === 'GET') {
            route.routeGet(req, res);
        } else {
            console.log('Invalid method: ' + req.method + ' on request ' + pathname);
            res.writeHead(405, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({'error': 'Invalid method ' + req.method}));
            res.end();
        }
    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': '404: Not Found', 'endpoints': routesList.getAllRoutes()}));
        res.end();
    }
});

server.listen(config.port);

console.log('----------- INDIGO CODE BUILDSERVER -----------');
console.log('-- For product family: ' + config.productNamespace);
console.log('-- Version: ' + config.version);
console.log('-- Server UUID: ' + config.serverUUID);
console.log('-- Server Name: ' + config.serverName);
console.log('-----------------------------------------------');
console.log();
console.log('Listening on port ' + config.port + '! Errors will be reported in this window as they occur.');