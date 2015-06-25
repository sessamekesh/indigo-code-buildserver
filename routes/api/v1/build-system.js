/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../../models/route').Route;

var endpoint = new Route('/api/v1/build-system');

/**
 * Get metadata about the build systems on this machine
 * Optional parameter: name, the name of a specific build server
 */
endpoint.get([], null);

module.exports = endpoint;