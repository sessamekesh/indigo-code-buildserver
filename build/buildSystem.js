/**
 * Created by Kamaron on 6/25/2015.
 *
 * Build System
 * This class will be ready to actually perform a build, and to do so will call methods provided by the programmer.
 *  The object itself will have ownership of the name, methods to perform the build, and a method to obtain the results.
 */

var TestCaseDescription = require('./testCaseDescription').TestCaseDescription;
var BuildResult = require('./results').BuildResult;
var ResultsStore = require('./resultsStore').ResultsStore;
var ResultsErrors = require('./resultsStore').ERRORS;

/**
 * All build systems should be instances of this class
 * @param buildSystemID {string} Unique build system name (e.g., c++11_g++_4.18_whaleshark_0.1.1)
 * @param buildSystemName {string} Human readable build system name (e.g., C++11)
 * @param buildSystemNotes {string=} Notes that may be valuable for an admin to know. Included in v0.1 standard.
 * @param beforeBuild {function(sourceFile: File, testCases: Array<TestCaseDescription>, callback: function )|null} Method to call to prepare the build (compile steps, etc)
 * @param runTests {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object=, callback: function)}
 *  Method to call to execute the build. Optional parameters may be passed from the beforeBuild method
 * @param afterBuild {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object=, callback: function)|null}
 *  Method to call after the build. Optional parameters may be passed from the afterBuild method
 * @constructor
 */
var BuildSystem = function(buildSystemID, buildSystemName, buildSystemNotes, beforeBuild, runTests, afterBuild) {
    /**
     * @type {string}
     * @private
     */
    this._buildSystemID = buildSystemID;

    /**
     * @type {string}
     * @private
     */
    this._buildSystemName = buildSystemName;

    /**
     * @type {string}
     * @private
     */
    this._buildSystemNotes = buildSystemNotes;

    /**
     * @type {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object, callback: function )|null}
     * @private
     */
    this._beforeBuild = beforeBuild;

    /**
     * @type {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object, callback: function)}
     * @private
     */
    this._runTests = runTest;

    /**
     * @type {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object=, callback: function)|null}
     * @private
     */
    this._afterBuild = afterBuild;
};

/**
 * Performs a build! By design, this function does not return anything or call any callbacks.
 *  Those results must be obtained from the separate resultsManager. Results will be posted according
 *  to the specification of this MAJOR version of the Indigo Code build server.
 * Additional logic may also be implemented via which callbacks are given to the build system for the
 *  beforeBuild, runTest and afterBuild methods
 * TODO KAM: Right now, this interface is pretty bare-bones - it doesn't do automatic clean up or anything. You should do that.
 * @param sourceFile {File} Object containing file data about the source file
 * @param testCases {Array<TestCaseDescription>} Array of TestCaseDescription objects. Contains all files used for testing.
 * @param optionalParams {object=} Put whatever here. This is for minor version additions - no major version functionality
 *                                should depend on this field. "Achievements", whatever, can go here.
 * @return {string} The Build ID of the build that is being performed
 */
BuildSystem.prototype.performBuild = function (sourceFile, testCases, optionalParams) {
    /** @type {string} Unique ID for this build - used in debugging only */
    var buildID = 'BUILD_' + (Math.random() * 8675309).toFixed(); // TODO KAM: You can do better at making a unique ID...
    var me = this;
    console.log('(' + buildID + ') Build started using build system ' + this._buildSystemName + ' (' + this._buildSystemID + ')');

    ResultsStore.notifyBuildStart(buildID);

    optionalParams = optionalParams || {};

    console.log('(' + buildID + ') Beginning pre-build steps...');

    if (this._beforeBuild) {
        this._beforeBuild(sourceFile, testCases, optionalParams, afterFinishBeforeBuild);
    } else {
        afterFinishBeforeBuild(optionalParams);
    }

    /**
     * This is the before after before build after before during meanwhile in spite of before during while after call.
     * @param preBuildOptionalParams {object} Parameters that are useful from after the _beforeBuild method is called.
     *                                        What is in this depends entirely on the implementation of _beforeBuild.
     *                                        It is recommended to augment the optionalParams object.
     */
    function afterFinishBeforeBuild (preBuildOptionalParams) {
        console.log('(' + buildID + ') Beginning tests...');
        me._runTests(sourceFile, testCases, preBuildOptionalParams, afterRunTests);
    }

    /**
     * "There are two hard problems in computer science: Cache invalidation, naming things, and off-by-one errors"
     *  -Phil Karlton, Leon Brambick (maybe, couldn't find original source)
     * @param result {BuildResult} The result of this build
     * @param optionalParamsFromTest {object} Paramters that may be useful to the _afterBuild method.
     */
    function afterRunTests (result, optionalParamsFromTest) {
        console.log('(' + buildID + ') Beginning post-build steps and notifying the results store');
        me._afterBuild && me._afterBuild(sourceFile, testCases, optionalParamsFromTest);

        ResultsStore.postResult(buildID, result);

        // TODO KAM: Notify buildManager of finished build
    }

    return buildID;
};

/**
 * @return {string}
 */
BuildSystem.prototype.getID = function() {
    return this._buildSystemID;
};

/**
 * @return {string}
 */
BuildSystem.prototype.getName = function() {
    return this._buildSystemName;
};

/**
 * @return {string}
 */
BuildSystem.prototype.getNotes = function() {
    return this._buildSystemNotes;
};

module.exports.BuildSystem = BuildSystem;