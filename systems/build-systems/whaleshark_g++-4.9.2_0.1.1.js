/**
 * Created by Kamaron on 10/20/2015.
 * ID:    whaleshark_g++-4.9.2_0.1.1
 * NAME:  C++11
 * NOTES: (G++ 4.9.2)
 */

var BuildSystem = require('../../build/buildSystem').BuildSystem;
var BuildResult = require('../../build/buildResult').BuildResult;
var RESULTS = require('../../config').BUILD_RESULT;
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var ID = 'whaleshark_g++-4.9.2_0.1.1';
var NAME = 'C++11';
var NOTES = '(G++ 4.9.2)';

/**
 * Compile the files, and generate the output used in the actual test running
 * @param sourceFile {File}
 * @param testCases {Array.<TestCaseDescription>}
 * @param optionalParams {Object}
 * @param callback {Function}
 */
var beforeBuild = function(sourceFile, testCases, optionalParams, callback) {
    exec(
        'g++ -o ' + sourceFile.path + '.exe ' + sourceFile.path,
        {
            timeout: 5000
        },
        function (buildError, stdout, stderr) {
            if (buildError) {
                console.log('Error performing C++ build:', buildError);
                callback(null, new BuildResult());
            } else {
            }
        }
    );
};

/**
 * 'g++ --version' must contain '4.9.2' on the first line
 * @return {boolean}
 */
var validateCanUseSync = function () {
    try {
        var child = spawnSync('g++', ['--version'], { timeout: 4000 });
        return child.stderr && child.stderr.toString().trim().indexOf('4.9.2') >= 0;
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
