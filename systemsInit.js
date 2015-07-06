/**
 * Created by Kamaron on 7/5/2015.
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

//
// BUILD SYSTEMS
//
BuildManager.register(require('./systems/build-systems/whaleshark_python-2.7.9_0.1.1').System);

//
// COMPARISON SYSTEMS
//
ComparisonSystemManager.registerComparisonSystem(require('./systems/comparison-systems/whaleshark_diff_0.1.1').System);