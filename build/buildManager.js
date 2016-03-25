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

var BuildSystem;
var ComparisonSystemManager = require('./comparisonManager').ComparisonSystemManager;
var BuildEntry = require('../queue/buildEntry').BuildEntry;
var config = require('../config');
var tar = require('tar-fs');
var fs = require('fs');
var rimraf = require('rimraf');
var TestCase = require('./testCaseDescription').TestCaseDescription;
var BuildQueue;

var COMPARISON_ERRORS = require('./comparisonManager').ERRORS;

var ERRORS = {
    ID_NOT_AVAILABLE: 'There is already a build system with the given ID',
    ID_NOT_RECOGNIZED: 'There is no build system found with the given ID',
    TOO_MANY_BUILDS: 'Too many builds are currently running. Please wait',
    COMPARE_ID_NOT_RECOGNIZED: 'A comparison system was not recognized',
    MALFORMED_PACKAGE: 'The package tarball received was malformed'
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

    /**
     * Whether or not to notify automagically fetch from the build queue again when the number
     *  of builds goes down (aka, when a build finishes)
     * @type {boolean}
     * @private
     */
    this._notifyWhenDecreased = false;
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
 * @private
 */
BuildManager.prototype._performBuild = function (buildEntry, cb) {
    /** @type {number} */
    var i;
    /** @type {boolean} */
    var passing;
    /** @type {string} */
    var dir = config.buildSandboxDirectory + '/' + buildEntry.buildID;

    var tarSource, tarDest;
    var me = this;

    // Step 0: Make sure we aren't already over-building, and if we are, reject the build
    if (this._nBuilds >= config.buildConstraints.maxConcurrentTests) {
        cb(new Error(ERRORS.TOO_MANY_BUILDS));
        return;
    }

    // Step 1: Make sure the build system is registered
    if (!this.exists(buildEntry.buildSystemName)) {
        cb(new Error(ERRORS.ID_NOT_RECOGNIZED));
        return;
    }

    // Step 2: Make sure the required comparison systems are present
    passing = true;
    for (i = 0; passing && i < buildEntry.comparisonSystemsRequired.length; i++) {
        passing = passing && ComparisonSystemManager.exists(buildEntry.comparisonSystemsRequired[i]);
        if (!passing) {
            console.log('BuildManager: Invalid comparison system required: ' + buildEntry.comparisonSystemsRequired[i]);
        }
    }

    if (!passing) {
        cb(new Error(ERRORS.COMPARE_ID_NOT_RECOGNIZED));
        return;
    }

    // Step 3: Unpack the package file
    fs.mkdir(dir);
    tarSource = fs.createReadStream(buildEntry.packageFileData.path);
    tarDest = tar.extract(dir);
    tarSource.pipe(tarDest);
    tarDest.on('finish', function () {
        step4();
    });

    // Step 4: Make sure that all test cases described in info.json are present, no more and no less
    function step4() {
        var infoStream = fs.createReadStream(dir + '/info.json');
        var infoData = '';
        var info = {};

        infoStream.on('error', function (err) {
            console.log('Error opening ' + dir + '/info.json: ' + JSON.stringify(err));
            cb(new Error(ERRORS.MALFORMED_PACKAGE));
        });
        infoStream.on('data', function (chunk) {
            infoData += chunk.toString();
        });
        infoStream.on('end', function () {
            try {
                info = JSON.parse(infoData);
                checkFile();
            } catch (e) {
                console.log('Error parsing ' + dir + '/info.json: ' + JSON.stringify(e));
                cb(new Error(ERRORS.MALFORMED_PACKAGE));
            }

            // Go through test cases, make sure they exist...
            function checkFile(i) {
                i = i || 0;

                if (i >= info.test_cases.length) {
                    fs.stat(dir + '/source', function (err) {
                        if (err) {
                            console.log('Could not find source data in ' + dir);
                            cb(new Error(ERRORS.MALFORMED_PACKAGE));
                        } else {
                            step5(info);
                        }
                    });
                } else {
                    fs.stat(dir + '/test-cases/' + info.test_cases[i].id + '.in', function (err) {
                        if (err) {
                            console.log('Test case input with id ' + info.test_cases[i].id + ' not found in ' + dir);
                            cb(new Error(ERRORS.MALFORMED_PACKAGE));
                        } else {
                            fs.stat(dir + '/test-cases/' + info.test_cases[i].id + '.out', function (err2) {
                                if (err2) {
                                    console.log('Test case output with id ' + info.test_cases[i].id + ' not found!');
                                    cb(new Error(ERRORS.MALFORMED_PACKAGE));
                                } else {
                                    checkFile(i + 1);
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    // Step 5: Perform build! Invoke callback with the build ID.
    function step5(info) {
        cb(null, me._buildSystemRegistry[buildEntry.buildSystemName].performBuild(
            buildEntry.buildID,
            { path: dir + '/source' },
            info.test_cases.map(function (tc) {
                // TODO: Return test case
                return new TestCase(
                    { path: dir + '/test-cases/' + tc.id + '.in' },
                    { path: dir + '/test-cases/' + tc.id + '.out' },
                    tc.comparisonSystemName,
                    !tc.exposeData
                );
            }),
            info.time_limit,
            function (buildResult, optionalParams) {
                // Delete the things!
                rimraf(dir, function (err) { err && console.log('(' + buildEntry.buildID + ') Error deleting staging directory - ' + err.message); });
                fs.unlink(buildEntry.packageFileData.path, function (err) { err && console.log('(' + buildEntry.buildID + ') Error deleting package file - ' + err.message); });
            },
            info.original_filename
        ));
    }
};

/**
 * Return the number of currently executing builds
 * @return {number}
 */
BuildManager.prototype.numExecutingBuilds = function () {
    return this._nBuilds;
};

/**
 * Call when a build has started in the system
 */
BuildManager.prototype.notifyBuildStart = function () {
    this._nBuilds++;
};

/**
 * Call when a build has finished in the system
 */
BuildManager.prototype.notifyBuildEnd = function () {
    this._nBuilds--;

    if (this._notifyWhenDecreased) {
        this.notifyBuildReady();
        this._notifyWhenDecreased = BuildQueue.getQueueLength() > 0;
    }
};

/**
 * Used by the build queue. Notify the build manager
 *  that there is a build ready to be performed.
 */
BuildManager.prototype.notifyBuildReady = function () {
    if (this._nBuilds < config.buildConstraints.maxConcurrentTests) {
        /** @type {BuildEntry} */
        var toBuild = BuildQueue.pop();
        this._performBuild(toBuild, function (err, res) {
            // TODO KAM: What am I supposed to do here?
        });
    } else {
        // TODO KAM: You know what you should also have? You should have a job run every so often that just makes
        //  sure that everything is in line - that we haven't reached deadlock of some sort
        this._notifyWhenDecreased = true;
    }
};

module.exports.BuildManager = new BuildManager();
module.exports.ERRORS = ERRORS;

BuildQueue = require('../queue/buildQueue').BuildQueue;
BuildSystem = require('./buildSystem').BuildSystem;