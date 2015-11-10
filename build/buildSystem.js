/**
 * Created by Kamaron on 6/25/2015.
 *
 * Build System
 * This class will be ready to actually perform a build, and to do so will call methods provided by the programmer.
 *  The object itself will have ownership of the name, methods to perform the build, and a method to obtain the results.
 */

var TestCaseDescription = require('./testCaseDescription').TestCaseDescription;
var BuildResult = require('./buildResult').BuildResult;

/** @type {ResultsStore} */
var ResultsStore;
var BuildResults = require('../config').BUILD_RESULT;

/** @type {BuildManager} */
var BuildManager;
var config = require('../config');

/** @type {ComparisonSystemManager} */
var ComparisonSystemManager;
var CompareErrors = require('./comparisonManager').ERRORS;

/**
 * All build systems should be instances of this class
 * @param buildSystemID {string} Unique build system name (e.g., c++11_g++_4.18_whaleshark_0.1.1)
 * @param buildSystemName {string} Human readable build system name (e.g., C++11)
 * @param buildSystemNotes {string=} Notes that may be valuable for an admin to know. Included in v0.1 standard.
 * @param validateCanUseSync {function(): boolean} Synchronous test to see if the build systems is supported on the server
 * @param beforeBuild {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object, callback: Function)|Null}
 *  Method to call to prepare the build (compile steps, etc)
 * @param runTest {function(sourceFile: File, testCase: TestCaseDescription, timeLimit: Number, optionalParams: Object=, callback: Function)}
 *  Method to call to run a single test. Optional parameters may be passed from the beforeBuild method
 * @param afterBuild {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: Object=, callback: Function)|Null}
 *  Method to call after the build. Optional parameters may be passed from the afterBuild method
 * @constructor
 */
var BuildSystem = function(buildSystemID, buildSystemName, buildSystemNotes, validateCanUseSync, beforeBuild, runTest, afterBuild) {
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
     * @type {function(): boolean}
     */
    this.validateSync = validateCanUseSync;

    /**
     * @type {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: Object, callback: Function)|Null}
     * @private
     */
    this._beforeBuild = beforeBuild;

    /**
     * @type {function(sourceFile: File, testCase: TestCaseDescription, timeLimit: Number, optionalParams: Object=, callback: Function)}
     * @private
     */
    this._runTest = runTest;

    /**
     * @type {function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: object=, callback: Function)|Null}
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
 * @param buildID {String} Build ID of this build (used for many things, directory, hypermedia, result caching)
 * @param sourceFile {File} Object containing file data about the source file
 * @param testCases {Array<TestCaseDescription>} Array of TestCaseDescription objects. Contains all files used for testing.
 * @param timeLimit {number} Time, in milliseconds, that an individual test case has to run
 * @param onFinish {Function=} Callback to be invoked at the finish of the function. Contains the result. Optional.
 * @param optionalParams {object=} Put whatever here. This is for minor version additions - no major version functionality
 *                                should depend on this field. "Achievements", whatever, can go here.
 * @return {string} The Build ID of the build that is being performed
 */
BuildSystem.prototype.performBuild = function (buildID, sourceFile, testCases, timeLimit, onFinish, optionalParams) {
    /** @type {BuildSystem} Unique ID for this build - used in debugging only */
    var me = this;
    console.log('(' + buildID + ') Build started using build system ' + this._buildSystemName + ' (' + this._buildSystemID + ')');

    ResultsStore.notifyBuildStart(buildID);
    BuildManager.notifyBuildStart();

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
     * @param result {BuildResult=}            Result of the build (so far)
     */
    function afterFinishBeforeBuild (preBuildOptionalParams, result) {
        /** @type {BuildResult|null} */
        var lastTestResult;

        /** @type {Object|null} */
        var testOptionalParams;

        if (!result || (result && result.result == BuildResults.CORRECT_ANSWER)) {
            console.log('(' + buildID + ') Beginning tests...');
            testOptionalParams = preBuildOptionalParams;
            performNextTest();
        } else {
            console.log('(' + buildID + ') Build failed! ' + result.notes);
            ResultsStore.postResult(buildID, result);
            BuildManager.notifyBuildEnd();
        }

        function performNextTest(i) {
            i = i || 0;

            if (i >= testCases.length) {
                // It would seem all tests have succeeded.
                afterRunTests(
                    new BuildResult(
                        config.BUILD_RESULT.CORRECT_ANSWER,
                        'Passed ' + i + '/' + testCases.length + ' test cases!'
                            + (!!(testOptionalParams || {})['customMessage'] ? ('\n' + testOptionalParams['customMessage']) : '') // TODO KAM: I loved having ownership of message generation in the specific build module... Put it back!
                    ),
                    testOptionalParams || {}
                );
            } else {
                me._runTest(
                    sourceFile,
                    testCases[i],
                    timeLimit,
                    testOptionalParams,
                    function (runtimeResult, outputFile, resultOptionalParams) {
                        if (runtimeResult.result === config.BUILD_RESULT.RUNTIME_ERROR) {
                            // A runtime error occurred, send back appropriate error message
                            console.log('(' + buildID + ') Test failed (runtime error): ' + runtimeResult.notes);
                            afterRunTests(
                                new BuildResult(
                                    config.BUILD_RESULT.RUNTIME_ERROR,
                                    'Error on test ' + i + ' of ' + testCases.length
                                    + testCases[i].hideData
                                        ? ' (no data available, please review logs)'
                                        : ': ' + runtimeResult.notes,
                                    runtimeResult.optionalParams
                                ),
                                testOptionalParams || {}
                            );
                        } else if (runtimeResult.result === config.BUILD_RESULT.INTERNAL_SERVER_ERROR) {
                            console.log('(' + buildID + ') Test failed (internal server error): ' + runtimeResult.notes);
                            afterRunTests(
                                new BuildResult(
                                    config.BUILD_RESULT.INTERNAL_SERVER_ERROR,
                                    'Error on test ' + i + ' of ' + testCases.length  + ' - please review logs',
                                    runtimeResult.optionalParams
                                ),
                                testOptionalParams || {}
                            );
                        } else {
                            // No error, perform comparison
                            ComparisonSystemManager.performComparison(
                                testCases[i].comparisonSystemName,
                                testCases[i].inFile,
                                testCases[i].outFile,
                                outputFile,
                                function (comparisonErr, comparisonResult) {
                                    if (comparisonErr) {
                                        if (comparisonErr.message === CompareErrors.ID_NOT_RECOGNIZED) {
                                            lastTestResult = new BuildResult(
                                                config.BUILD_RESULT.INTERNAL_SERVER_ERROR,
                                                'Malformed test case metadata - invalid comparison system ID - notify administrator to check logs!'
                                            );
                                            console.log('(' + buildID + ') ERROR: Malformed test case data, no comparison system by name \'' + testCases[i].comparisonSystemName + '\'')
                                            console.log('-- Test case data: ' + JSON.stringify(testCases[i]));
                                        } else {
                                            lastTestResult = new BuildResult(
                                                config.BUILD_RESULT.INTERNAL_SERVER_ERROR,
                                                'Unknown error performing tests. Notify administrator to check logs!'
                                            );
                                            console.log('(' + buildID + ') Unknown error performing test!');
                                            console.log('-- Error data: ' + JSON.stringify(comparisonErr));
                                            console.log('-- Test case data: ' + JSON.stringify((testCases[i])));
                                        }
                                        afterRunTests(lastTestResult, testOptionalParams);
                                    } else {
                                        // If the result was a pass, continue on to the next test case...
                                        //  Otherwise, pass the result back up the line.
                                        if (comparisonResult.result === config.BUILD_RESULT.CORRECT_ANSWER) {
                                            testOptionalParams = resultOptionalParams || testOptionalParams;
                                            lastTestResult = runtimeResult;
                                            performNextTest(i + 1);
                                        } else {
                                            // Raw configuration message will be sent here.
                                            //  Perhaps in future versions, you should limit this (maybe an optionalParam?)
                                            afterRunTests(
                                                comparisonResult,
                                                (lastTestResult && lastTestResult.optionalParams) || testOptionalParams
                                            );
                                        }
                                    }
                                }
                            );
                        }
                    }
                );
            }
        }
    }

    /**
     * "There are two hard problems in computer science: Cache invalidation, naming things, and off-by-one errors"
     *  -Phil Karlton, Leon Brambick (maybe, couldn't find original source)
     * @param result {BuildResult} The result of this build
     * @param optionalParamsFromTest {object} Paramters that may be useful to the _afterBuild method.
     */
    function afterRunTests (result, optionalParamsFromTest) {
        console.log('(' + buildID + ') Beginning post-build steps and notifying the results store');
        console.log('(' + buildID + ') Result: ' + JSON.stringify(result));
        me._afterBuild && me._afterBuild(sourceFile, testCases, optionalParamsFromTest);

        ResultsStore.postResult(buildID, result);
        BuildManager.notifyBuildEnd();

        // Also clean up the submission and staging areas here, now that we're done with the data...
        onFinish && onFinish(result, optionalParamsFromTest);
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

ResultsStore = require('./resultsStore').ResultsStore;
BuildManager = require('./buildManager').BuildManager;
ComparisonSystemManager = require('./comparisonManager').ComparisonSystemManager;