/**
 * Created by Kamaron on 7/5/2015.
 *
 * TODO KAM: Have each build system and comparison system also have a "prereq" method, so it can make sure that the build server can load that module.
 *    For instance, a C++ system will require g++ or MVCC installed. So, check to see if g++ --version or mvcc
 *
 * This file initializes all of the build and comparison systems that this server supports.
 *
 * TO EXTEND THIS SERVER TO SUPPORT A LANGUAGE OR COMPARISON METHOD:
 * 1) Add any required configuration files/etc. to the "systems/modules" folder (e.g., Java binaries, etc.)
 * 2) Add the Node.JS source file that will actually perform the build/comparison to the appropriate subdirectory
 *       of the "systems" folder
 * 3) Add it to the build/comparison manager below
 */

var BuildManager = require('./build/buildManager').BuildManager;
var ComparisonSystemManager = require('./build/comparisonManager').ComparisonSystemManager;

/**
 * @type {number|null}
 */
var i;

/**
 * @type {string|null}
 */
var buildSystemId;

/**
 * @type {BuildSystem|null}
 */
var buildSystem;

//
// BUILD SYSTEMS
//
var buildSystemPaths = [
    './systems/build-systems/whaleshark_python-2.7.9_0.1.1',
    './systems/build-systems/whaleshark_g++_0.1.1',
    './systems/build-systems/whaleshark_java_0.1.1',
    './systems/build-systems/whaleshark_nodejs_0.1.1',
    './systems/build-systems/whaleshark_go-1.4_0.1.1'
];

// Load all build systems...p
for (i = 0; i < buildSystemPaths.length; i++) {
    buildSystem = /** @type {BuildSystem} */ require(buildSystemPaths[i]).System;
    buildSystemId = /** @type {string} */ require(buildSystemPaths[i]).ID;
    console.log('Testing support for build system ' + buildSystemId + '...');
    if (buildSystem.validateSync()) {
        console.log('... Supported!');
        BuildManager.register(buildSystem);
    } else {
        console.log('... Not supported');
    }
}

//
// COMPARISON SYSTEMS (No validation required for comparison systems)
//
ComparisonSystemManager.registerComparisonSystem(require('./systems/comparison-systems/whaleshark_diff_0.1.1').System);