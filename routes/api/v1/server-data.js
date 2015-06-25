/**
 * Created by Kamaron on 6/24/2015.
 */

var config = require('../../../config');
var Route = require('../../../models/route').Route;
var endpoint = new Route('/api/v1/server-data');
var routesList = require('../../../index').routesList;

/**
 * Get metadata about the server
 */
endpoint.get([], function (req, res) {
    var toSend = {};

    toSend.productNamespace = config.productNamespace;
    toSend.version = config.version;
    toSend.serverName = config.serverName;
    toSend.serverUUID = config.serverUUID;
    toSend.buildConstraints = config.buildConstraints;
    toSend.buildSystemsList = routesList.getRoute(config.endpoints.BUILD_SYSTEM).reverseRoute();
    toSend.comparisonSystemsList = routesList.getRoute(config.endpoints.COMPARISON_SYSTEM).reverseRoute();

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(toSend));
    res.end();
});

module.exports = endpoint;