/**
 * Created by Kamaron on 6/25/2015.
 *
 * The build queue stores up to a configurable number of builds waiting to be performed.
 *  Builds are added via POST requests from the REST api, where they sit in staging.
 *  Builds are removed via the build service, which then actually performs the build and
 *  posts the results.
 */

var config = require('../config');
var BuildEntry = require('./buildEntry').BuildEntry;

var ERRORS = {
    QUEUE_FULL: "Cannot add to build queue - queue is full",
    INVALID_ENTRY: "The BuildEntry object provided does not validate"
};

/**
 * @constructor
 */
var BuildQueue = function () {
    /**
     * @type {number}
     * @private
     */
    this._maxSize = config.buildConstraints.queueSize;

    /**
     * @type {Array<BuildEntry>}
     * @private
     */
    this._pendingBuilds = [];
};

/**
 * @param buildEntry {BuildEntry} The build entry to queue for use
 * @return {boolean|Error} True if the element was added to the queue, Error object otherwise
 */
BuildQueue.prototype.push = function (buildEntry) {
    if (buildEntry.isValid()) {
        if (this._pendingBuilds.length < this._maxSize) {
            this._pendingBuilds.push(buildEntry);
            return true;
        } else {
            return new Error(ERRORS.QUEUE_FULL);
        }
    } else {
        return new Error(ERRORS.INVALID_ENTRY);
    }
};

/**
 * Remove a build from the build queue. Used by the BuildManager object
 * @return {BuildEntry} The next build to perform
 */
BuildQueue.prototype.pop = function () {
    return this._pendingBuilds.shift();
};

/**
 * @return {Number}
 */
BuildQueue.prototype.getQueueLength = function () {
    return this._pendingBuilds.length;
};

// Expose data about possible errors...
module.exports.ERRORS = ERRORS;

// Create a singleton of sorts to use in the rest of the application:
module.exports.BuildQueue = new BuildQueue();