/**
 * Created by Kamaron on 6/30/2015.
 *
 * See the API specification file in the root of the project directory for more details on build result standard
 * Actual string values passed back to the client are set in configuration.
 */

var RESULT = require('../config').BUILD_RESULT;

/**
 * Defines the structure of a build result, as per this major version (v0.1 standard)
 * @param result {string} String (from configuration and major version specification) representing the ultimate result
 * @param notes {string} Some human-readable notes that justify the result given
 * @param optionalParams {{string: *}=} Object containing additional parameters. Optional.
 * @constructor
 */
var BuildResult = function (result, notes, optionalParams) {
    /** @type {string} */
    this.result = result || RESULT.INTERNAL_SERVER_ERROR;

    /** @type {string} */
    this.notes = notes || '';

    /** @type {{string:*}} */
    this.optionalParams = optionalParams || {};
};

exports.BuildResult = BuildResult;