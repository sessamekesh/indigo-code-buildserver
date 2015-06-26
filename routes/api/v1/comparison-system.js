/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../route').Route;

var endpoint = new Route('/api/v1/comparison-system');

/**
 * Get metadata about the comparison systems in use on this machine
 *  Optional parameter: name, the name of a specific comparison system
 */
endpoint.get([], null);

module.exports = endpoint;