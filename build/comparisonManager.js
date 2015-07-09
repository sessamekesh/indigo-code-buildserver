/**
 * Created by Kamaron on 6/30/2015.
 */

var ComparisonSystem = require('./comparisonSystem').ComparisonSystem;
var BuildResult = require('./buildResult').BuildResult;

var ERRORS = {
    ID_NOT_AVAILABLE: 'The comparison system ID has already been taken',
    ID_NOT_RECOGNIZED: 'The comparison system ID is not recognized'
};

/**
 * Manages comparison systems, used to compare actual versus expected results
 * @constructor
 */
var ComparisonSystemManager = function () {
    /**
     * Map of all comparison systems known by this manager
     * @type {{string: ComparisonSystem}}
     * @private
     */
    this._comparisonSystems = {};

    /**
     * List of IDs of comparison systems, should match keys of _comaprisonSystems
     * @type {Array<string>}
     * @private
     */
    this._comparisonSystemIDs = [];
};

/**
 * Register a comparison system with this manager
 * @param system {ComparisonSystem}
 */
ComparisonSystemManager.prototype.registerComparisonSystem = function (system) {
    if (this._comparisonSystems[system.comparisonSystemID]) {
        throw new Error(ERRORS.ID_NOT_AVAILABLE);
    } else {
        this._comparisonSystemIDs.push(system.comparisonSystemID);
        this._comparisonSystems[system.comparisonSystemID] = system;
    }
};

/**
 *
 * @param systemID {string} Globally unique ID of the comparison system to use
 * @param inFile {File} Input file information
 * @param expectedFile {File} Expected output file information
 * @param outFile {File} Output file information
 * @param cb {function (err: Error, result: BuildResult)} Callback to invoke on result received
 */
ComparisonSystemManager.prototype.performComparison = function (systemID, inFile, expectedFile, outFile, cb) {
    if (this._comparisonSystems[systemID]) {
        this._comparisonSystems[systemID].compare(inFile, expectedFile, outFile, cb);
    } else {
        throw new Error(ERRORS.ID_NOT_RECOGNIZED);
    }
};

/**
 * @param systemID {string}
 * @return {boolean} True if a comparison system with the given ID is registered, false otherwise
 */
ComparisonSystemManager.prototype.exists = function (systemID) {
    return !!this._comparisonSystems[systemID];
};

/**
 * @param systemID {string}
 * @return {null|object}
 */
ComparisonSystemManager.prototype.getMetadata = function (systemID) {
    if (this._comparisonSystemIDs[systemID]) {
        return {
            id: this._comparisonSystems[systemID].comparisonSystemID,
            name: this._comparisonSystemIDs[systemID].comparisonSystemName,
            description: this._comparisonSystemIDs[systemID].comparisonSystemNotes
        };
    } else {
        return null;
    }
};

/**
 * @return {Array.<string>}
 */
ComparisonSystemManager.prototype.getIDs = function () {
    return this._comparisonSystemIDs;
};

module.exports.ComparisonSystemManager = new ComparisonSystemManager();
module.exports.ERRORS = ERRORS;