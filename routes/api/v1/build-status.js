/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../route').Route;

var BuildManager = require('../../../build/buildManager').BuildManager;
var BuildQueue = require('../../../queue/buildQueue').BuildQueue;
var config = require('../../../config');

var endpoint = new Route('/api/v1/build-status');

/**
 * Return the current status of the build server
 */
endpoint.get([], function (req, res) {
    var isBuildQueueReady = BuildQueue.isReady();
    var queueLength = BuildQueue.getQueueLength();
    var nBuildsRunning = BuildManager.numExecutingBuilds();

    if (isBuildQueueReady && nBuildsRunning < config.buildConstraints.maxConcurrentTests) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({
            status: 'READY',
            queued: queueLength,
            executing: nBuildsRunning
        }));
        res.end();
    } else if (isBuildQueueReady) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({
            status: 'WAITING_FOR_PROCESS_LOCK',
            queued: queueLength,
            executing: nBuildsRunning
        }));
        res.end();
    } else {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({
            status: 'BUSY',
            queued: queueLength,
            executing: nBuildsRunning
        }));
        res.end();
    }
});

module.exports = endpoint;