/**
 * Created by Kamaron on 7/5/2015.
 *
 * ID:     whaleshark_diff_0-1-1
 * NAME:   Line Diff
 * NOTES:  This comparison method simply looks through the required files, line by line.
 *         If all lines in both files are identical, a passing result is returned (via 0.1.1 standard)
 *         All leading and trailing newlines are ignored
 *         Leading and trailing whitespace on lines are ignored
 *         If two lines differ, a wrong answer result is given, with the notes containing information
 *           about which two lines differed (line numbers, expectd, actual)
 */

var ComparisonSystem = require('../../build/comparisonSystem').ComparisonSystem;
var async = require('async');

var BuildResult = require('../../build/results').BuildResult;
var ResultsEnum = require('../../config').BUILD_RESULT;
var fs = require('fs');

var ID = 'whaleshark_diff_0-1-1';
var NAME = 'Line Diff';
var NOTES = 'This comparison method simply looks through the required files, line by line.\n'
          + 'If all lines in both files are identical, a passing result is returned (via 0.1.1 standard)\n'
          + 'All leading and trailing newlines are ignored\n'
          + 'Leading and trailing whitespace on lines are ignored\n'
          + 'If two lines differ, a wrong answer result is given, with the notes containing information\n'
          + '  about which two lines differed (line numbers, expectd, actual)';

/**
 * Perform the actual comparison for the whaleshark diff
 * @param inFile {File} File information for the input file. Not actually used in this method
 * @param expectedFile {File} File information for the expected file (provided by test)
 * @param outputFile {File} File information for the output file (from submission output)
 * @param cb {function (rsl: BuildResult)} Callback function, consumes result of the comparison
 * @constructor
 */
function compare (inFile, expectedFile, outputFile, cb) {
    async.parallel({
        expectedData: function (callback) {
            fs.readFile(expectedFile.path, callback);
        },
        outputData: function (callback) {
            fs.readFile(outputFile.path, callback);
        }
    }, function (err, res) {
        var expectedLines, outputLines;
        var i, contents;
        var expectedLine, outputLine;
        var passed;

        if (err) {
            console.log(NAME + '.js: Unexpected error occurred: ' + JSON.stringify(err));
            cb(new BuildResult(
                ResultsEnum.INTERNAL_SERVER_ERROR,
                'Internal server error. Please check logs for system ' + NAME
            ));
        } else {
            // We now have res.expectedData, and res.outputData.
            //  They are the actual raw text information about the file.
            //  Use expectedData and outputData, line by line.
            expectedLines = res.expectedData.toString().split('\n');
            outputLines = res.outputData.toString().split('\n');

            // Trim all leading and trailing newlines
            for (i = 0; i < expectedLines.length && expectedLines[i].trim() == ''; expectedLines.shift()) {}
            for (i = 0; i < outputLines.length && outputLines[i].trim() == ''; outputLines.shift()) {}
            if (expectedLines.length > 0) {
                for (contents = expectedLines.pop(); contents.trim() == ''; contents = expectedLines.pop()) {}
                expectedLines.push(contents);
            }

            if (outputLines.length > 0) {
                for (contents = outputLines.pop(); contents.trim() == ''; contents = outputLines.pop()) {}
                outputLines.push(contents);
            }

            expectedLines = expectedLines.map(function (a) { return a.trim(); });
            outputLines = outputLines.map(function (a) { return a.trim(); });
            // For each line...
            passed = true;
            for (i = 0; passed && (i < expectedLines.length || i < outputLines.length); i++) {
                expectedLine = expectedLines[i] || '';
                outputLine = outputLines[i] || '';

                if (expectedLine !== outputLine) {
                    cb(new BuildResult(
                        ResultsEnum.WRONG_ANSWER,
                        'Line ' + i + '\nExpected: \'' + expectedLine + '\'\nActual: \'' + outputLine + '\''
                    ));
                    passed = false;
                }
            }

            // Made it through all lines without calling the callback... Impressive! We're done here.
            if (passed) {
                cb(null, new BuildResult(
                    ResultsEnum.CORRECT_ANSWER,
                    'All tests passed!'
                ));
            }
        }
    });
}

var LineDiff = new ComparisonSystem(ID, NAME, NOTES, compare);

module.exports.System = LineDiff;
module.exports.NAME = ID;