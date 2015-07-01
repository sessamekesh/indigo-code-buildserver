/**
 * Created by Kamaron on 6/24/2015.
 */

var url = require('url');
var Route = require('../../route').Route;
var ComparisonSystemManager = require('../../../build/comparisonManager').ComparisonSystemManager;

var endpoint = new Route('/api/v1/comparison-system');

/**
 * Get metadata about the comparison systems in use on this machine
 *  Optional parameter: name, the name of a specific comparison system
 */
endpoint.get([], function (req, res) {
    var queryparams = url.parse(req.url, true).query || {};

    if (queryparams.name === '') {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({error: 'Name parameter found, but contains invalid content (check to see if a name was actually provided?)'})); // See v0.1 spec
        res.end();
    } else if (queryparams.name) {
        if (ComparisonSystemManager.exists(queryparams.name)) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({
                comparisonSystemList: [ComparisonSystemManager.getMetadata(queryparams.name)]
            }));
            res.end();
        } else {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({error: 'Comparison system with given name not found'}));
            res.end();
        }
    } else {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({
            comparisonSystemList: ComparisonSystemManager.getIDs().map(function (id) {
                return ComparisonSystemManager.getMetadata(id);
            })
        }));
        res.end();
    }
});

module.exports = endpoint;