/**
 * Created by Kamaron on 3/24/16.
 * ID:    whaleshark_java-8_0.1.1
 * NAME:  Java 8
 * NOTES: Java version 8, OpenJDK
 */

var BuildSystem = require('../../build/buildSystem').BuildSystem;
var BuildResult = require('../../build/buildResult').BuildResult;
var RESULTS = require('../../config').BUILD_RESULT;
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var ID = 'whaleshark_java-8_0.1.1';
var NAME = 'Java 8';
var NOTES = '';

/**
 * Copy a file from a source location to a destination location
 * @param {string} source
 * @param {string} target
 * @param {function(err: Error=)} cb
 */
function moveFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            if (!err) {
                fs.unlink(source, function () {});
            }
            cb(err);
            cbCalled = true;
        }
    }
}

/**
 * Compile the file, and generate the output used in the actual test running
 * @param {File} sourceFile
 * @param {Array.<TestCaseDescription>} testCases
 * @param {string} originalFilename
 * @param {Object} optionalParams
 * @param {function(optionalParams: Object, result: BuildResult)} callback
 */
var beforeBuild = function (sourceFile, testCases, originalFilename, optionalParams, callback) {
    // Rename file into what fucking Java expects to see
    var renameStart = sourceFile.path.indexOf('/source') + 1;
    var cwd = sourceFile.path.substr(0, renameStart);
    var newSourceName = cwd + originalFilename;

    var extStart = originalFilename.indexOf('.java');
    if (extStart < 0) {
        return callback({}, new BuildResult(RESULTS.BUILD_ERROR, 'Must provide a .java file', {}));
    }
    var className = originalFilename.substr(0, extStart);

    moveFile(sourceFile.path, newSourceName, function (mvErr) {
        if (mvErr) {
            return callback({}, new BuildResult(
                RESULTS.INTERNAL_SERVER_ERROR,
                'Failed to move file to correct location',
                { }
            ));
        }

        exec(
            'javac ' + className + '.java',
            {
                timeout: 10000,
                cwd: cwd
            },
            function (buildError, stdout, stderr) {
                if (buildError) {
                    callback({}, new BuildResult(
                        RESULTS.BUILD_ERROR,
                        buildError.message,
                        { executableFile: cwd, className: className }
                    ));
                } else if (stderr && stderr.length > 0) {
                    callback({}, new BuildResult(
                        RESULTS.BUILD_ERROR,
                        stderr,
                        { executableFile: cwd, className: className }
                    ));
                } else {
                    callback({ executableFile: cwd, className: className }, new BuildResult(
                        RESULTS.CORRECT_ANSWER,
                        stdout,
                        { executableFile: cwd, className: className }
                    ));
                }
            }
        )
    })
};

/**
 * Run a single test
 * Then, feed output and expected to comparison system (specified in testCase)
 * @param {File} sourceFile
 * @param {TestCaseDescription} testCase
 * @param {number} timeLimit
 * @param {string} originalFilename
 * @param {Object|null} optionalParams
 * @param {function (result: BuildResult, outputFile: File, optionalParams: Object)} callback
 */
var runTest = function (sourceFile, testCase, timeLimit, originalFilename, optionalParams, callback) {
    var outFileLocation = testCase.inFile.path + '-OUTPUT';
    if(!optionalParams || !optionalParams.executableFile) {
        return callback(new BuildResult(
            RESULTS.INTERNAL_SERVER_ERROR,
            'Could not find executable file in location ' + outFileLocation
        ));
    }

    var extStart = originalFilename.indexOf('.java');
    if (extStart < 0) {
        return callback(new BuildResult(RESULTS.BUILD_ERROR, 'Must provide a .java file', {}));
    }
    var className = originalFilename.substr(0, extStart);

    exec(
        'java ' + className + ' < ' + '../../' + testCase.inFile.path + ' > ' + '../../' + outFileLocation,
        {
            timeout: timeLimit || 0,
            cwd: optionalParams.executableFile
        },
        function (rErr, stdout, stderr) {
            if (rErr || stderr) {
                callback(new BuildResult(
                    RESULTS.RUNTIME_ERROR,
                    (rErr && rErr.message) || stderr
                ));
            } else {
                callback(new BuildResult(
                    RESULTS.CORRECT_ANSWER,
                    stdout,
                    {}
                ), { path: outFileLocation }, optionalParams);
            }
        }
    )
};

/**
 * Clean up any resources created during testing, from runTest or beforeBuild
 * @param {File} sourceFile
 * @param {Array.<TestCaseDescription>} testCases
 * @param {Object} optionalParams
 * @param {function=} callback
 */
var afterBuild = function (sourceFile, testCases, optionalParams, callback) {
    for (var i = 0; i < testCases.length; i++) {
        fs.unlink(testCases[i].inFile.path + '-OUTPUT', function () {});
    }
    
    if (optionalParams && optionalParams.executableFile && optionalParams.className) {
        fs.unlink(optionalParams.executableFile + optionalParams.className + '.class', function () {});
    }

    callback && callback();
};

var validateCanUseSync = function () {
    try {
        var child = spawnSync('javac', ['-version'], { timeout: 4000 });
        var javacVersion = child.stderr && child.stderr.toString().trim().indexOf('javac 1.8') >= 0;

        var child2 = spawnSync('java', ['-version'], { timeout: 4000 });
        var javaVersion = child2.stderr && child2.stderr.toString().trim().indexOf('"1.8') >= 0;

        return javacVersion && javaVersion;
    } catch(e) {
        console.error('Error checking availability of buildsystem ' + ID + ': ' + e.message);
        return false;
    }
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