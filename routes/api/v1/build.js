/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../route').Route;
var BuildEntry = require('../../../queue/buildEntry').BuildEntry;
var BuildQueue = require('../../../queue/buildQueue').BuildQueue;
var BuildQueueErrors = require('../../../queue/buildQueue').ERRORS;
var ResultsStore;
var ResultsStoreErrors;
var routesList;
var config = require('../../../config');
var fs = require('fs');
var url = require('url');

var endpoint = new Route('/api/v1/build');

/**
 * Post data for a new build, including all resources required to run all tests, etc.
 * Requires one file, the package file. It will be a tarball with all the required assets for the build.
 */
endpoint.post([], ["buildSystemName", "comparisonSystemsRequired"], ["buildPackage"], function (req, res, postData, files) {

    // Make sure that postData.comparisonSystemsRequired is an array, not just a string
    if (Object.prototype.toString.call(postData.comparisonSystemsRequired) === '[object String]') {
        postData.comparisonSystemsRequired = [postData.comparisonSystemsRequired];
    }

    /** @type {BuildEntry} */
    var buildEntry = new BuildEntry(postData.buildSystemName, postData.comparisonSystemsRequired, files['buildPackage']);

    /** @type {boolean|Error|number} */
    var result = BuildQueue.push(buildEntry);

    /** @type {number} */
    var i;

    if (result === true) {
        // Hooray! It has been added to the build queue!
        res.writeHead(202, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(
            {
                'success': true,
                'queueSize': BuildQueue.getQueueLength(),
                'results': routesList.getRoute(config.endpoints.BUILD).reverseRoute({ id: buildEntry.buildID })
            }));
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
endpoint.get(["id"], function (req, res) {
    var queryparams = url.parse(req.url, true).query || {};

    ResultsStore.getResult(queryparams.id, function (err, buildResult) {
        if (err) {
            if (err.message = ResultsStoreErrors.BUILD_ID_UNKNOWN) {
                // Error: build ID not recognized
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    'error': 'No build with the given ID found. Perhaps it timed out?'
                }));
                res.end();
            } else {
                // Error: Unknown
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    'error': 'An unknown error occurred. Please check the server logs.'
                }));
                res.end();
                console.log('routes/api/v1/build.js: Unexpected error occurred: ' + JSON.stringify(err));
            }
        } else {
            // Result found, buildResult available
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({
                resultCode: buildResult.result,
                result: getStandardEnumValue(buildResult.result),
                notes: buildResult.notes,
                optionalParams: buildResult.optionalParams
            }));
            res.end();
        }
    });
});

/**
 * Returns the API v0.1.1 standard value given the result from the build system.
 * @param resultVal {string} The shorthand code used, non-standard usually
 * @return {string} The proper, defined, value
 */
function getStandardEnumValue(resultVal) {
    switch (resultVal) {
        case config.BUILD_RESULT.BUILD_ERROR:
            return 'BUILD_ERROR';
        case config.BUILD_RESULT.CORRECT_ANSWER:
            return 'CORRECT_ANSWER';
        case config.BUILD_RESULT.INTERNAL_SERVER_ERROR:
            return 'INTERNAL_SERVER_ERROR';
        case config.BUILD_RESULT.RUNTIME_ERROR:
            return 'RUNTIME_ERROR';
        case config.BUILD_RESULT.TIME_LIMIT_EXCEEDED:
            return 'TIME_LIMIT_EXCEEDED';
        case config.BUILD_RESULT.WRONG_ANSWER:
            return 'WRONG_ANSWER';
        default:
            return 'UNKNOWN_CODE';
    }
}

module.exports = endpoint;

routesList = require('../../../index').routesList;
ResultsStore = require('../../../build/resultsStore').ResultsStore;
ResultsStoreErrors = require('../../../build/resultsStore').ERRORS;