/**
 * Created by Kamaron on 6/25/2015.
 */

/**
 * Build entry
 * Object used by the buildQueue, and then later by the buildManager. Represents all the required
 *  server information about a build.
 *  @param buildSystemName {string} Name of the build system, as agreed by this server and the requesting server
 *  @param comparisonSystemsRequired {Array<string>} List of comparison system names required to perform this build
 *  @param packageFileData {string} Location of the build package tarball
 * @constructor
 */
var BuildEntry = function(buildSystemName, comparisonSystemsRequired, packageFileData) {
    /** @type {string} */
    this.buildSystemName = buildSystemName;

    /** @type {Array<string>} */
    this.comparisonSystemsRequired = comparisonSystemsRequired;

    /** @type {string} */
    this.packageFileData = packageFileData;
};

/**
 * All requirements for a build must be placed here. If this function passes, that means that the build
 *  manager will be capable of at least accepting the request. So, make sure to ensure that
 *  - The language provided is supported
 *  - The comparison system is valid
 *  - All files and fields are present
 *  @returns {boolean}
 */
BuildEntry.prototype.isValid = function() {
    // TODO: Make sure that the buildManager supports all the requested build systems
    // TODO: Make sure that the buildManager supports all the requested comparison systems
    // TODO: Make sure that there is actually a file at the location packageFileURI

    // If all conditions pass, return true and carry on
    return true;
};

// Export for other Node modules...
module.exports.BuildEntry = BuildEntry;