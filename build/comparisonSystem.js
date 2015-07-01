/**
 * Created by Kamaron on 6/30/2015.
 *
 * Comparison system, used to compare actual versus expected test results
 */

var BuildResult = require('./results').BuildResult;

/**
 * An instance of this class will compare actual versus expected test results using the 'compare' method provided
 * @param comparisonSystemID {string} Globally unique ID, used to identify this comparison system
 * @param comparisonSystemName {string} Human readable comparison system name
 * @param notes {string} Human readable notes about this comparison system. Required by v0.1 standard
 * @param compare {function (in: File, expected: File, out: File, cb: function(rsl: BuildResult))}
 *                Performs the actual comparison, posts results to callback method
 *                Uses the BuildResults class - this allows for more control here with runtime errors, etc.
 *                Use a correct answer result to indicate that the test passed
 *                Use a wrong answer result to indicate most test failures
 *                Depending on the test, a "runtime error" may be appropriate. This will be defined by the standard
 *                  in the major release version.
 * @constructor
 */
var ComparisonSystem = function (comparisonSystemID, comparisonSystemName, notes, compare) {
    /** @type {string} */
    this.comparisonSystemID = comparisonSystemID;

    /** @type {string} */
    this.comparisonSystemName = comparisonSystemName;

    /** @type {string} */
    this.comparisonSystemNotes = notes;

    /** @type {function} */
    this.compare = compare;
};

module.exports.ComparisonSystem = ComparisonSystem;