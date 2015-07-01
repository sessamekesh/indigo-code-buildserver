/**
 * Created by Kamaron on 6/25/2015.
 *
 * Build Manager
 * This class will perform builds. Its responsibilities (self) are...
 * - Accept and validate builds
 * - Maintain a 'build executor pool', running up to the number of concurrent builds specified in config
 * - Manage all build modules
 * - Maintain a registry of valid buildSystems
 *
 * Its responsibilities (delegated) are...
 * - Report results of completed builds
 * - Cache build results
 * - Perform builds
 * - Maintain a registry of valid comparisonSystems
 */

var BuildSystem = require('./buildSystem').BuildSystem;
var ComparisonSystemManager = require('./comparisonManager').ComparisonSystemManager;
var BuildEntry = require('../queue/buildEntry').BuildEntry;

var COMPARISON_ERRORS = require('./comparisonManager').ERRORS;

var ERRORS = {
    ID_NOT_AVAILABLE: 'There is already a build system with the given ID',
    ID_NOT_RECOGNIZED: 'There is no build system found with the given ID'
};

/**
 * @constructor
 */
var BuildManager = function () {

    /**
     * Number of currently ongoing builds
     * @type {number}
     * @private
     */
    this._nBuilds = 0;

    /**
     * Map of the available build systems
     * @type {{string: BuildSystem}}
     * @private
     */
    this._buildSystemRegistry = {};

    /**
     * List of build system names held in _buildSystemRegistry
     * @type {Array<string>}
     * @private
     */
    this._buildSystemIDs = [];
};

/**
 * Register a build system with the build manager
 * @param buildSystem {BuildSystem}
 */
BuildManager.prototype.register = function (buildSystem) {
    if (this._buildSystemRegistry[buildSystem.getID()]) {
        throw new Error(ERRORS.ID_NOT_AVAILABLE);
    } else {
        this._buildSystemIDs.push(buildSystem.getID());
        this._buildSystemRegistry[buildSystem.getID()] = buildSystem;
    }
};

/**
 * @param buildSystemID {string}
 * @return {boolean} True if a build system with the given ID is registered, false otherwise
 */
BuildManager.prototype.exists = function (buildSystemID) {
    return !!this._buildSystemRegistry[buildSystemID];
};

/**
 * Provide metadata (useful for REST endpoints) about a build system in question
 * @param buildSystemID {string}
 * @return {{string: string}|null}
 */
BuildManager.prototype.buildSystemMetadata = function (buildSystemID) {
    if (this._buildSystemRegistry[buildSystemID]) {
        return {
            id: this._buildSystemRegistry[buildSystemID].getID(),
            name: this._buildSystemRegistry[buildSystemID].getName(),
            description: this._buildSystemRegistry[buildSystemID].getNotes()
        };
    } else {
        return null;
    }
};

/**
 * @return {Array<string>} List of build system names under this server instance
 */
BuildManager.prototype.getBuildSystemIDs = function () {
    return this._buildSystemIDs;
};

/**
 * Validates and performs build described in buildEntry
 * @param buildEntry {BuildEntry}
 * @param cb {function(err: Error=, buildID: string=)} Callback to invoke with the build ID when the build has begun
 */
BuildManager.prototype.performBuild = function (buildEntry, cb) {
    // TODO KAM: Implement this :-)

    cb(new Error('I actually have not implemented this yet! How exciting!'));

    // Step 1: Make sure the build system is registered
    // Step 2: Make sure the required comparison systems are present
    // Step 3: Unpack the package file

    // Step 4: Make sure that all test cases described in info.json are present, no more and no less
    //  Also make sure that all comparison systems are, in fact, valid.

    // Step 5: Perform build! Invoke callback with the build ID.
};

module.exports.BuildManager = new BuildManager();
module.exports.ERRORS = ERRORS;