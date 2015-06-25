/**
 * Created by Kamaron on 6/24/2015.
 */

/*       This guy is majestic as fuck
                                   *     _
        /\     *            ___.       /  `)
       //\\    /\          ///\\      / /
      ///\\\  //\\/\      ////\\\    / /     /\
     ////\\\\///\\/\\.-~~-.///\\\\  / /     //\\
    /////\\\\///\\/         `\\\\\\/ /     ///\\
   //////\\\\// /            `\\\\/ /     ////\\
  ///////\\\\\//               `~` /\    /////\\
 ////////\\\\\/      ,_____,   ,-~ \\\__//////\\\
 ////////\\\\/  /~|  |/////|  |\\\\\\\\@//jro/\\
 //<           / /|__|/////|__|///////~|~/////\\
 ~~~     ~~   ` ~   ..   ~  ~    .     ~` `   '.
 ~ _  -  -~.    .'   .`  ~ .,    '.    ~~ .  '.
*/

// config.js - All of your buildserver configuration goes in here

// Global configuration object, holds configuration data.
var config = {};

/*
   REQUIRED FOR THE v0.1 SPECIFICATION
 */
/**
 * Product Namespace
 * (For the vanilla Indigo Code project, "Whale Shark")
 *  If you are extending and modifying Indigo Code and the Indigo Code Buildserver projects,
 *  be sure to use a different namespace (especially if you are publishing your results as well)
 *  Ideally, this should be the same name as your repository name, though codenames work too.
 * @type {string}
 */
config.productNamespace = "Whale Shark";

/**
 * Version
 * Follow the format major.minor.revision, as the Indigo Code project and the Buildserver project
 *  will not evolve at the same pace. All versions with the same major version number should follow
 *  a strict minimum API exposure. For example, an Indigo Code server written to support Buildserver v1
 *  should be able to use 1.0.0 just as well as 1.15.4
 * Minor versions may introduce new functionality, or remove optional functionality from a previous version.
 *  Any non-major functionality that Indigo Code expects should target a specific minor version or group of minor
 *  versions.
 * Revision versions may not introduce any new functionality, and are mainly intended for bug fixes, performance
 *  improvements, etc.
 * @type {string}
 */
config.version = "0.1.1";

/**
 * Server Name
 * This is a (not necessarily unique) name for the server. This is the name that competition admins will use
 *  to diagnose statuses, establish which build servers are acceptable for use, etc.
 * @type {string}
 */
config.serverName = "Hello World";

/**
 * Server UUID
 * Identify the buildserver by unique ID to the Indigo Code system. This must be unique across all instances
 *  of the buildserver, and is generated on server start. As a consequence, the server is expected to have the same
 *  blank state every time it starts up, and will be treated as an entirely new server instance.
 */
config.serverUUID = (Math.random() * 10000).toFixed() + '-' + (Math.random() * 100000).toFixed(); // TODO KAM: Make this an actual UUID

/**
 * Build Constraints
 * Set of build constraints imposed by this server. These can (and should) be modified based on the load you will
 *  be putting on the server, as well as the load that the server is able to handle.
 * @type {{string: *}}
 */
config.buildConstraints = {};

/**
 * Max Concurrent Tests
 * How many tests can be simultaneously on this server?
 * 0 = unlimited
 * @type {number}
 */
config.buildConstraints.maxConcurrentTests = 1;

/**
 * Queue Size
 * How many tests can be stored on this server while waiting for a build to finish?
 * 0 = unlimited
 * @type {number}
 */
config.buildConstraints.queueSize = 1;

/**
 * Results Availability Timeouts
 * After a build has finished, for how long should the results be cached before they are
 *  deleted from the system? In milliseconds.
 * @type {number}
 */
config.buildConstraints.resultsAvailabilityTimeout = 1000 * 60 * 15; // 15 minutes

/*
 NICKNAMES FOR REQUIRED SERVER ENDPOINTS
 */

config.endpoints = {};

config.endpoints.SERVER_DATA = 'ServerData';
config.endpoints.BUILD_SYSTEM = 'BuildSystem';
config.endpoints.COMPARISON_SYSTEM = 'ComparisonSystem';
config.endpoints.BUILD_STATUS = 'BuildStatus';
config.endpoints.BUILD = 'Build';

// This one isn't actually required by the v0.1 standard. It is included to show how additional endpoints may be added.
//  To see everywhere this endpoint affects, search the word 'Coffee' throughout the repository.
config.endpoints.COFFEE = 'Coffee';

/*
  SERVER CONFIGURATION DATA
 */
config.port = "8080";
config.hostname = require('os').hostname().split('.').shift();
config.maxFields = 1000; // Maximum number of fields in a POST body

config.maxFieldsSize = 2 * 1024 * 1024; // Maximum size of all fields combined (excluding files) in a POST body

// Expose the configuration object to any Node source file that uses this one
module.exports = config;