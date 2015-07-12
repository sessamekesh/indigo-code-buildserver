# Indigo Code Buildserver
Build server to be used with the Indigo Code coding competition framework. This is the default buildserver, and is maintained
in parallel with the [Indigo Code](https://github.com/sessamekesh/Indigo-Code) repository. The versions are necessarily
kept in sync - so be sure that you pay attention to which version of the Indigo Code Buildserver you are using when
installing Indigo Code, and make sure that they are compatible!

Like Indigo Code, this project is intended to be extended for your individual uses. It's designed with Indigo Code in mind,
and as such has special considerations for that project. It is, however, meant to build projects and run tests, so use
it however you'd like.

As of the writing of this file (July 11, 2015), the Indigo Code project in its current iteration (v0.3.1) is not yet
far enough along to be compatible with this buildserver version. I am anticipating a mid-September release date for
both products in stable form.

## General Ideas
Most of the API provides the developer with strong liberty in what they can do, lots of flexibility. However, there are
certain things that should remain constant, to prevent any collisions or confusion in configuration. Naming and version
definitions are important. All major versions of the buildserver should follow *at least* a minimum standard defined
for that major version. Minor versions may introduce additional features. Revision versions should only differ on which
modules are included.

You can run Indigo Code Buildserver as is, without any modifications (we use the namespace "whaleshark" on our server
and module names) or you can extend it for your own purposes. It is recommended that you pick a namespace unique to your
organization, and use it to identify your servers and modules.

# Version 0 specification
_Version 0 is the development version, and will not be stable. Version 1.0 is the first stable release. Until then,
this specification is subject to change without notice._

## Configuration
The configuration file, `config.js`, contains all the configuration used for an instance of your server.

The minimum information that must be present:

* `config.productNamespace`: Denotes the namespace under which this project works. Human readable. The namespace should also be used to name all build systems added by your organization to the build server. Not used by the buildserver.
* `config.version`: Used to identify the build server version. Problems created in the [Indigo Code](https://github.com/sessamekesh/Indigo-Code) system may specify which version of the build server they wish to use.
* `config.serverName`: Human readable, and not necessarily unique, name for your server. It should be unique, but this is not enforced or assumed.
* `config.serverUUID`: Unique identifier for the instance of this server. This must be unique to this server instance, and it is recommended that this is generated on server startup.
* `config.buildConstraints`:
  * `maxConcurrentTests`: How many tests can be handled simultaneously by this server?
  * `queueSize`: How many tests can be unpacked and prepared for testing on the server, while waiting for the ability to build?
  * `resultsAvailabilityTimeout`: When a result is reported, for how long should it remain in memory on the server?
* `config.port`: The port number on which the server should listen
* `config.hostname`: The hostname the server uses (used in reverse routing to form hypermedia content)
* `config.maxFields`: Maximum number of fields in a POST body passed to the build server
* `config.buildStagingDirectory`: Directory (relative or absolute) where all builds in the build queue will be placed.
* `config.buildSandboxDirectory`: Sandbox directory location, used by the builds. All generated files should go here.

This information is also included, though is not necessarily required by the v0 standard:

`config.endpoints`: Nicknames for required server endpoints.

## API Specification
_See [API specification](https://github.com/sessamekesh/indigo-code-buildserver/blob/master/API%20specification%20initial%20notes.md)_

## Adding new build systems
By default, the Indigo Code Buildserver comes with Python support. In this early development stage of the product, it's the only
language we could rapidly get working cross platform and without very much configuration required. Turns out it's sort of tricky
to do this kind of thing on Windows, which is the system under which this product is being developed primarily (though it is
intended to be used on a Linux machine, for simplicity of configuration).

To add a new build system...

1 - Add a new file (traditionally named the unique name of your build system) in the `/systems/build-systems` directory
2 - At the top of the system (either before or immediately after all `require` statements), place
  * The `ID` of the system (unique identifier, we use `whaleshark_<language>_<API_version>`
  * The `NAME` of the system. This is human readable, something like `Python 2.7` and is what users will see (Indigo Code)
  * Any `NOTES` you wish to include. This will be readable by competition admins, in deciding which systems to allow.
3 - Write the following methods:
  1 - `beforeBuild` - This is optional. Otherwise, the prototype is `function(sourceFile: File, testCases: Array<TestCaseDescription>, optionalParams: Object, callback: Function(result, optionalReturnParams))` Perform any pre-test steps necessary here - e.g., for C++, generate the executable file in this step. 
  2 - `runTest` - given test input and expected output, perform a single test, generating an output file. The prototype of this method is `function(sourceFile: File, testCase: TestCaseDescription, timeLimit: Number, optionalParams: Object|null, callback: function (result, outputParams))`
  3 - `afterBuild` - Release any assets here that were created in the `beforeBuild` and `runTest` steps. The prototype of this method is `function (sourceFile: File, testCases: Array.<TestCaseDescription>, optionalParams: Object|null, callback: function())`
4 - Create a BuildSystem.
  * If you've done steps one through three, it will look like this:
  
```
exports.System = new BuildSystem(ID, NAME, NOTES, beforeBuild, runTest, afterBuild);
exports.ID = ID;
```

5 - In systemsInit.js, register the system. This is done by invoking this code:

```
BuildManager.register(require('./systems/build-systems/<build-system-file>').System);
```