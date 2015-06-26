/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../route').Route;

var endpoint = new Route('/api/v1/build-status');

/**
 * Return the current status of the build server
 */
endpoint.get([], null);

module.exports = endpoint;