/**
 * Created by Kamaron on 7/5/2015.
 * ID:    whaleshark_python-2.7.9_0.1.1
 * NAME:  Python 2.7
 * NOTES:
 */

var BuildSystem = require('../../build/buildSystem').BuildSystem;
var BuildResult = require('../../build/buildResult').BuildResult;
var RESULTS = require('../../config').BUILD_RESULT;
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var ID = 'whaleshark_python-2.7.9_0.1.1';
var NAME = 'Python 2.7';
var NOTES = '';

/**
 * Python doesn't actually require anything to happen before the build...
 * @type {null}
 */
var beforeBuild = null;

/**
 * 'python --version' must equal 'Python 2.7.9' to use Python 2.7.9
 * @return {boolean}
 */
var validateCanUseSync = function () {
    try {
        // Hack - Python 2.7.9 outputs version to stderr, not stdout.
        //  See
        var child = spawnSync('python', ['--version'], { timeout: 4000 });
        return child.stderr && child.stderr.toString().trim().indexOf('Python 2.7.') >= 0;
    } catch (e) {
        console.log('Error checking for availability of buildsystem ' + ID + ': ' + e.message);
        return false;
    }
};

/**
 * "python SOURCE_FILE < input > output"
 * Then feed output and expected to comparison system (specified in testCases)
 * @param sourceFile {File} Source file data
 * @param testCase {TestCaseDescription} Description of the test case to run
 * @param timeLimit {Number} Time, in milliseconds, that this test has to run. 0=unlimited
 * @param optionalParams {Object|Null} (optional) Object with additional params to pass to this system
 * @param callback {function (result: BuildResult, outputFile: File, optionalParams: Object)}
 *  Sends the build result (Runtime Error or Answer Correct), with the outputted file which will be compared
 *  with the BuildSystem.performBuild method.
 */
var runTest = function (sourceFile, testCase, timeLimit, optionalParams, callback) {

    var outFileLocation = testCase.inFile.path + '-OUTPUT'; // Eh... Could be more elaborate, if I wasn't lazy.

    // Perform test at index i in the array...
    exec(
        'python ' + sourceFile.path + ' < ' + testCase.inFile.path + ' > ' + outFileLocation,
        {
            timeout: timeLimit || 0
        },
        function (rErr, stdout /*, stderr */) {
            if (rErr) {
                // Right now, I'm using the BuildResult object to pass back data to the calling function...
                //  It only contains information about the error, it should be changed before going on to the user.
                callback(new BuildResult(
                    RESULTS.RUNTIME_ERROR,
                    rErr.message
                ));
            } else {
                // optionalParams.customMessage = 'Python is a pretty fantastic language, no?'
                callback(
                    new BuildResult(
                        RESULTS.CORRECT_ANSWER,
                        stdout,
                        {}
                    ),
                    { path: outFileLocation }, // TODO KAM: You really need a File object, this bothers me.
                    optionalParams
                );
            }
        }
    );
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
    validateCanUseSync,
    beforeBuild,
    runTest,
    afterBuild
);
module.exports.ID = ID;
