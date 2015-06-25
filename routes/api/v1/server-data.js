/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../../models/route').Route;

var endpoint = new Route('/api/v1/server-data');

/**
 * Get metadata about the server
 */
endpoint.get([], null);

module.exports = endpoint;