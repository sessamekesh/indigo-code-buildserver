/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../../models/route').Route;

var endpoint = new Route('/api/v1/build');

/**
 * Post data for a new build, including all resources required to run all tests, etc.
 * Requires one file, the package file. It will be a tarball with all the required assets for the build.
 */
endpoint.post([], ["buildSystemName", "comparisonSystemsRequired"], 1, null);

/**
 * Request information about the given build.
 */
endpoint.get(["id"], null);

module.exports = endpoint;