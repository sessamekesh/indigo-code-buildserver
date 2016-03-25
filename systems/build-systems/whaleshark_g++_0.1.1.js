/**
 * Created by Kamaron on 11/9/2015
 * ID:    whaleshark_g++_0.1.1
 * NAME:  C++ 11 (g++)
 * NOTES: This build system does not care about
 *        which version of g++, so long as it supports c++11
 *
 */

var BuildSystem = require('../../build/buildSystem').BuildSystem;
var BuildResult = require('../../build/buildResult').BuildResult;
var RESULTS = require('../../config').BUILD_RESULT;
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var config = require('../../config');

var ID = 'whaleshark_g++_0.1.1';
var NAME = 'C++ 11 (g++)';
var NOTES = 'This build system does not care about which version of g++, so long as it supports c++11';

/**
 * BeforeBuild: Build the file to a temporary directory, with source
 *  name + '.exe' as the executable name.
 * @param sourceFile {File}
 * @param testCases {Array.<TestCaseDescription>}
 * @param {string} originalFilename
 * @param optionalParams {object}
 * @param callback {function (preBuildOptionalParams, result)}
 function(optionalParams: object, callback: Function)
 */
var beforeBuild = function (sourceFile, testCases, originalFilename, optionalParams, callback) {
	// Rename to source.cc
	var newLocation = sourceFile.path + '.cc';
	var sourceDest = fs.createWriteStream(newLocation);
	var sourceSource = fs.createReadStream(sourceFile.path);

	sourceSource.pipe(sourceDest);
	sourceSource.on('end', function () {
		fs.unlink(sourceFile.path, function(){});
		sourceFile.path = newLocation;

		// Move build to sandbox directory
		var executableDirectory = sourceFile.path + '.exe';
		exec(
			'g++ --std=c++11 ' + sourceFile.path + ' -o ' + executableDirectory,
			{
				timeout: 10000
			},
			function (rErr, stdout, stderr) {
				if (rErr) {
					callback({}, new BuildResult(
						RESULTS.BUILD_ERROR,
						rErr.message,
						{ executableFile: executableDirectory }
					));
				} else if (stderr && stderr.length > 0) {
					callback({}, new BuildResult(
						RESULTS.BUILD_ERROR,
						stderr,
						{ executableFile: executableDirectory }
					));
				} else {
					callback(
						{ executableFile: executableDirectory },
						new BuildResult(
							RESULTS.CORRECT_ANSWER,
							stdout,
							{ executableFile: executableDirectory }
						)
					);
				}
			}
		);
	});
};

/**
 * Run a single test
 * Then feed output and expected to comparison system (specified in testCase)
 * @param sourceFile {File}
 * @param testCase {TestCaseDescription}
 * @param timeLimit {Number}
 * @param {string} originalFilename
 * @param optionalParams {Object|null}
 * @param callback {function (result: BuildResult, outputFile: File, optionalParams: Object)}
 */
var runTest = function (sourceFile, testCase, timeLimit, originalFilename, optionalParams, callback) {
	var outFileLocation = testCase.inFile.path + '-OUTPUT';
	if (!optionalParams || !optionalParams.executableFile) {
		callback(new BuildResult(
			RESULTS.INTERNAL_SERVER_ERROR,
			"Could not find executable file in location " + outFileLocation
		));
	} else {
		exec (
			optionalParams.executableFile + ' < ' + testCase.inFile.path + ' > ' + outFileLocation,
			{
				timeout: timeLimit || 0
			},
			function (rErr, stdout, stderr) {
				if (rErr || stderr) {
					callback(new BuildResult(
						RESULTS.RUNTIME_ERROR,
						(rErr && rErr.message) || stderr
					));
				} else {
					callback(
						new BuildResult(
							RESULTS.CORRECT_ANSWER,
							stdout,
							{}
						),
						{ path: outFileLocation },
						optionalParams
					);
				}
			}
		);
	}
};

/**
 * Clean up any resources created during testing, from runTest or beforeBuild
 * @param sourceFile {File}
 * @param testCases {Array.<TestCaseDescription>}
 * @param optionalParams {Object}
 * @param callback {function=}
 */
var afterBuild = function (sourceFile, testCases, optionalParams, callback) {
	for (var i = 0; i < testCases.length; ++i) {
		fs.unlink(testCases[i].inFile.path + '-OUTPUT', function(){});
	}

	optionalParams && optionalParams.executableFile
		&& fs.unlink(optionalParams.executableFile, function(){});

	callback && callback();
};

/**
 * Create a sample file and attempt to build it using c++11
 * @return {boolean}
 */
var validateCanUseSync = function () {
	var finish = function () {
		fs.unlink(sourcename, function(){});
		fs.unlink(sourcename + '.exe', function () {});
	};

	try {
		var sourcename = config.buildSandboxDirectory + '/' + ID + '.cc';
		fs.writeFileSync(
			sourcename,
			'#include <iostream>\nusing namespace std;\n\nint main()'
			+ '\n{\n\tauto t = 3.3f;\n\tcout << "Hello, world! " << t << endl;\n\treturn 0;\n}'
		);
		var buildChild = spawnSync('g++', ['--std=c++11', sourcename, '-o', sourcename + '.exe'])
		if (buildChild.stderr.toString().indexOf('unrecognized command line option') >= 0) {
			console.log('C++11 not supported');
			finish();
			return false;
		}

		var runChild = spawnSync('./' + sourcename + '.exe', []);
		if (runChild.stdout.toString().trim().indexOf('Hello, world! 3.3') >= 0) {
			finish();
			return true;
		} else {
			console.log('Program did not properly run');
			finish();
			return false;
		}
	} catch (e) {
		console.log('Error checking for availability of buildsystem ' + ID + ': ' + e.message);
		return false;
	}
}

module.exports.System = new BuildSystem(
	ID, NAME, NOTES,
	validateCanUseSync,
	beforeBuild,
	runTest,
	afterBuild
);
module.exports.ID = ID;