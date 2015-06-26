/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../route').Route;
var BuildEntry = require('../../../queue/buildEntry').BuildEntry;
var BuildQueue = require('../../../queue/buildQueue').BuildQueue;
var BuildQueueErrors = require('../../../queue/buildQueue').ERRORS;
var routesList = require('../../../index').routesList;
var config = require('../../../config');
var fs = require('fs');

var endpoint = new Route('/api/v1/build');

/**
 * Post data for a new build, including all resources required to run all tests, etc.
 * Requires one file, the package file. It will be a tarball with all the required assets for the build.
 */
endpoint.post([], ["buildSystemName", "comparisonSystemsRequired"], ["buildPackage"], function (req, res, postData, files) {
    /** @type {boolean|Error|number} */
    var result = BuildQueue.push(new BuildEntry(postData.buildSystemName, postData.comparisonSystemsRequired, files['buildPackage']));

    /** @type {number} */
    var i;

    if (result === true) {
        // Hooray! It has been added to the build queue!
        res.writeHead(202, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'success': true, 'queueSize': BuildQueue.getQueueLength()}));
        res.end();
    } else {
        // Something went wrong. Success is type error in this case

        // Delete any uploaded files...
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                fs.unlink(files[file].path, function (uerr) {
                    if (uerr) {
                        console.log('/routes/api/v1/build.js: Error deleting file ' + files[0].path + ': ' + uerr.message);
                    }
                });
            }
        }

        // Notify user of error
        if (result.message === BuildQueueErrors.QUEUE_FULL) {
            res.writeHead(420, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({'error': 'Build queue is full', 'statusCode': 420, 'statusMessage': 'Enhance Your Calm'}));
            res.end();
        } else if (result.message === BuildQueueErrors.INVALID_ENTRY) {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({
                'error': 'The entry provided was invalid. Please check the specification for the build server',
                'buildServerDescription': routesList.getRoute(config.endpoints.SERVER_DATA).reverseRoute()
                }
            ));
            res.end();
        } else {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({
                'error': 'An unknown error occurred on the server. Check logs'
            }));
            res.end();
            console.log('/routes/api/v1/build.js: Unrecognized error processing build request: ' + result.message);
        }
    }
});

/**
 * Request information about the given build.
 */
endpoint.get(["id"], null);

module.exports = endpoint;