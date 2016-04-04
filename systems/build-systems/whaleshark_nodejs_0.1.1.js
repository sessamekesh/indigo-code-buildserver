/**
 * Created by Kamaron Peterson on 4/4/16.
 * ID:     whaleshark_nodejs-5.9.*_0.1.1
 * NAME:   Node.JS (5.9.*)
 * NOTES:  Uses the installed Node.JS version to run the tests
 */

var BuildSystem = require('../../build/buildSystem').BuildSystem;
var BuildResult = require('../../build/buildResult').BuildResult;
var RESULTS = require('../../config').BUILD_RESULT;
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var ID = 'whaleshark_nodejs-5.9.*_0.1.1';
var NAME = 'Node.JS (5.10.*)';
var NOTES = 'Uses the installed Node.JS version to run the tests';

/**
 * Node.JS is interpreted, and needs no pre-build steps
 * @type {null}
 */
var beforeBuild = null;

/**
 * 'node --version' must begin with 'v5.9.' to use Node.JS 5.9
 * @return {boolean}
 */
var validateCanUseSync = function () {
    try {
        var child = spawnSync('node', ['--version'], { timeout: 4000 });
        var rsl = (child.stderr && child.stderr.toString().trim()) || (child.stdout && child.stdout.toString().trim());
        return rsl && (rsl.indexOf('v5.10.') >= 0);
    } catch (e) {
        console.error('Error checking availability of buildsystem '+ ID + ': ' + e.message);
        return false;
    }
};

/**
 * "node SOURCE_FILE < input > output"
 * Then feed output and expected to comparison system (specified in testCases)
 * @param sourceFile {File} Source file data
 * @param testCase {TestCaseDescription} Description of the test case to run
 * @param timeLimit {Number} Time, in milliseconds, that this test has to run. 0=unlimited
 * @param {string} originalFilename
 * @param optionalParams {Object|Null} (optional) Object with additional params to pass to this system
 * @param callback {function (result: BuildResult, outputFile: File, optionalParams: Object)}
 *  Sends the build result (Runtime Error or Answer Correct), with the outputted file which will be compared
 *  with the BuildSystem.performBuild method.
 */
var runTest = function (sourceFile, testCase, timeLimit, originalFilename, optionalParams, callback) {

    var outFileLocation = testCase.inFile.path + '-OUTPUT'; // Eh... Could be more elaborate, if I wasn't lazy.

    // Perform test at index i in the array...
    exec(
        'node ' + sourceFile.path + ' < ' + testCase.inFile.path + ' > ' + outFileLocation,
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
        fs.unlink(testCases[i].inFile.path + '-OUTPUT', function () {});
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