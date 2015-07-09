/**
 * Created by Kamaron on 6/30/2015.
 *
 * Manage the results, cache them for a set amount of time
 */

var config = require('../config');
var BuildResult = require('./buildResult').BuildResult;

var ERRORS = {
    BUILD_ID_TAKEN: 'The provided build ID has already been taken',
    BUILD_ID_UNKNOWN: 'The provided build ID has not been reported to the results store'
};

// TODO KAM: Check for timeout! If a build was notified, and hasn't been built after BUILD_TIMEOUT time, do error

/**
 * Used by ResultsStore._pendingResults, in case no request is waiting for a build to finish.
 */
function doNothing() {}

/**
 * Store results from builds, delete them after a set amount of time.
 * Also have getter methods for queries about builds.
 * @constructor
 */
var ResultsStore = function () {

    /**
     * @type {{string: BuildResult}}
     * @private
     */
    this._resultsStore = {};

    /**
     * Map of which results have been notified, but not yet received
     * @type {{string: function(err: Error=, rsl: BuildResult=)}}
     * @private
     */
    this._pendingResultsCallbacks = {};
};

/**
 * Notify the results store of a result. Keep result for amount of time specified in configuration.
 * @param buildID {string} Globally unique ID of this build. Throw an exception if this ID is already taken.
 * @param result {BuildResult} Result of the build
 */
ResultsStore.prototype.postResult = function(buildID, result) {
    var me = this;

    if (this._pendingResultsCallbacks[buildID]) {
        this._pendingResultsCallbacks[buildID](null, result);

        this._pendingResultsCallbacks[buildID] = null;
        delete this._pendingResultsCallbacks[buildID];
    }

    if (this._resultsStore[buildID]) {
        throw new Error(ERRORS.BUILD_ID_TAKEN)
    } else {
        this._resultsStore[buildID] = result;

        // If the resultsAvailabilityTimeout has been set, delete after that amount of time
        if (config.buildConstraints.resultsAvailabilityTimeout > 0) {
            setTimeout(function () {
                me._resultsStore[buildID] = null;
                delete me._resultsStore[buildID];
            }, config.buildConstraints.resultsAvailabilityTimeout);
        }
    }
};

/**
 * Notify the results store that a build has started, but the result has not been generated yet.
 * @param buildID {string} Globally unique build ID of the build in question
 */
ResultsStore.prototype.notifyBuildStart = function(buildID) {
    if (this._pendingResultsCallbacks[buildID] || this._resultsStore[buildID]) {
        throw new Error(ERRORS.BUILD_ID_TAKEN);
    } else {
        this._pendingResultsCallbacks[buildID] = doNothing;
    }
};

/**
 * Get the result of a given build. Invoke given callback when the result is ready. This may involve waiting.
 *  Instead of waiting, pass on the callback function to the _pendingResults array
 * @param buildID {string} Globally unique ID of this build
 * @param cb {function(err: Error=, result: BuildResult=)} Method to call when the result is available
 */
ResultsStore.prototype.getResult = function (buildID, cb) {
    if (this._resultsStore[buildID]) {
        // This is the easy case. The result is ready, just immediately provide it
        cb(null, this._resultsStore[buildID]);
    } else if (this._pendingResultsCallbacks[buildID]) {
        this._pendingResultsCallbacks[buildID] = cb;
    } else {
        cb(new Error(ERRORS.BUILD_ID_UNKNOWN));
    }
};

module.exports.ResultsStore = new ResultsStore();
module.exports.ERRORS = ERRORS;