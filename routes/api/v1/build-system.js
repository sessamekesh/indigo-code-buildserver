/**
 * Created by Kamaron on 6/24/2015.
 */

var url = require('url');
var Route = require('../../route').Route;
var BuildManager = require('../../../build/buildManager').BuildManager;

var endpoint = new Route('/api/v1/build-system');

/**
 * Get metadata about the build systems on this machine
 * Optional parameter: name, the name of a specific build server
 */
endpoint.get([], function (req, res) {
    var queryparams = url.parse(req.url, true).query || {};
    var responseData = {};

    if (queryparams.name === '') {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({error: 'Name parameter found, but contains invalid content (check to see if a name was actually provided?)'}));
        res.end();
    } else if (queryparams.name) {
        if (BuildManager.exists(queryparams.name)) {
            responseData.buildSystemList = [BuildManager.buildSystemMetadata(queryparams.name)];

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(responseData));
            res.end();
        } else {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({error: 'Build system with given name not found'}));
            res.end();
        }
    } else {
        responseData.buildSystemList = BuildManager.getBuildSystemIDs().map(function (id) {
            return BuildManager.buildSystemMetadata(id);
        });

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(responseData));
        res.end();
    }
});

module.exports = endpoint;