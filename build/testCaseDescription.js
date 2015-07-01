/**
 * Created by Kamaron on 6/25/2015.
 *
 * Describes a test case for the build system
 */

/**
 * Just a struct that holds information about a test case... The input and output files, the name of the comparison
 *  system, and whether or not to hide sensitive data. This should all be provided in the request.
 * @param inFile {File}
 * @param outFile {File}
 * @param comparisonSystemName {string}
 * @param hideData {boolean} True if you want the data to be hidden (and not included in any error messages)
 * @constructor
 */
var TestCaseDescription = function (inFile, outFile, comparisonSystemName, hideData) {
    this.inFile = inFile;
    this.outFile = outFile;
    this.comparisonSystemName = comparisonSystemName;
    this.hideData = hideData;
};

module.exports.TestCaseDescription = TestCaseDescription;