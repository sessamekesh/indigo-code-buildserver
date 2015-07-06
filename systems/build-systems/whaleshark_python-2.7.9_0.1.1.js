/**
 * Created by Kamaron on 7/5/2015.
 * ID:    whaleshark_python-2.7.9_0.1.1
 * NAME:  Python 2.7
 * NOTES:
 */

var BuildSystem = require('../../build/buildSystem').BuildSystem;
var BuildResult = require('../../build/results').BuildResult;
var RESULTS = require('../../config').BUILD_RESULT;
var ComparisonSystemManager = require('../../build/comparisonManager').ComparisonSystemManager;
var CompareErrors = require('../../build/comparisonManager').ERRORS;
var exec = require('child_process').exec;
var fs = require('fs');

var ID = 'whaleshark_python-2.7.9_0.1.1';
var NAME = 'Python 2.7';
var NOTES = '';

/**
 * Python doesn't actually require anything to happen before the build...
 * @type {null}
 */
var beforeBuild = null;

// TODO KAM: You can, and really should, make the _runTests method in a buildSystem into just _generateOutput,
//  since really all you need is an input file. Here, you shouldn't even need the comparison method
/**
 * "python SOURCE_FILE < input > output"
 * Then feed output and expected to comparison system (specified in testCases)
 * @param sourceFile {File} Source file data
 * @param testCases {Array.<TestCaseDescription>} Array containing all test case metadata needed
 * @param optionalParams {object|null} (optional) Object with additional params to pass to this system
 * @param callback {function (result: BuildResult, optionalParams: object)} Send the result of ALL tests
 */
var runTests = function (sourceFile, testCases, optionalParams, callback) {

    // Run all test cases. If each passes successfully, callback a success
    runTest();

    /**
     * @param i {number=} The index of the test case that is currently being attempted
     */
    function runTest(i) {
        i = i || 0;

        if (i >= testCases.length) {
            finish();
        } else {
            // Perform test at index i in the array...
            exec(
                'python ' + sourceFile.path + ' < ' + testCases[i].inFile.path + ' > ' + testCases[i].inFile.path + '-OUTPUT',
                {
                    timeout: optionalParams.timeLimit || 1000
                },
                function (rErr /*, stdout, stderr */) {
                    if (rErr) {
                        callback(new BuildResult(
                            RESULTS.RUNTIME_ERROR,
                            'Runtime error on test #' + i + (testCases[i].hideData ? '' : ': ' + rErr.message)
                        ));
                        if (testCases[i].hideData) {
                            console.log(ID + ' Runtime Error on test ' + testCases[i].inFile.path + ': ' + rErr.message);
                        }
                    } else {
                        // Perform the comparison...
                        ComparisonSystemManager.performComparison(
                            testCases[i].comparisonSystemName,
                            testCases[i].inFile,
                            testCases[i].outFile,
                            { path: testCases[i].inFile.path + '-OUTPUT' }, // TODO KAM: Create a File class that stores file data that we need
                            function (waerr, bres) {
                                if (waerr) {
                                    if (waerr.message === CompareErrors.ID_NOT_RECOGNIZED) {
                                        callback(new BuildResult(
                                            RESULTS.INTERNAL_SERVER_ERROR,
                                            'Malformed test case metadata - invalid comparison system ID - notify administrator to check logs!'
                                        ));
                                        console.log(ID + ' ERROR: Malformed test case data, no comparison system by name \'' + testCases[i].comparisonSystemName + '\'');
                                        console.log('-- Test Case Data: ' + JSON.stringify(testCases[i]));
                                    } else {
                                        callback(new BuildResult(
                                            RESULTS.INTERNAL_SERVER_ERROR,
                                            'Unknown error performing test. Notify administrator to check logs!'
                                        ));
                                        console.log(ID + ' ERROR: Unknown error performing test');
                                        console.log('-- Error data: ' + JSON.stringify(waerr));
                                        console.log('-- Test Case Data: ' + JSON.stringify(testCases[i]));
                                    }
                                } else {
                                    // If the compare result was a pass, continue on to the next test case...
                                    if (bres.result === RESULTS.CORRECT_ANSWER) {
                                        runTest(i + 1);
                                    } else {
                                        // Pass the result back up the line...
                                        callback(bres);
                                    }
                                }
                            }
                        );
                    }
                }
            );
        }
    }

    /**
     * Call after all test cases have successfully run
     */
    function finish() {
        callback(new BuildResult(
            RESULTS.CORRECT_ANSWER,
            'Successfully ran ' + testCases.length + ' tests'
        ));
    }
};

/**
 * Clean up any resources created during testing, from the runTest method (again, CHANGE THIS)
 * @param sourceFile {File}
 * @param testCases {Array.<TestCaseDescription>}
 * @param optionalParams {Object}
 * @param callback {function=}
 */
var afterBuild = function (sourceFile, testCases, optionalParams, callback) {

    for (var i = 0; i < testCases.length; i++) {
        fs.unlink(testCases[i].inFile.path + '-OUTPUT');
    }

    callback && callback();
};

module.exports.System = new BuildSystem(
    ID,
    NAME,
    NOTES,
    beforeBuild,
    runTests,
    afterBuild
);
module.exports.ID = ID;