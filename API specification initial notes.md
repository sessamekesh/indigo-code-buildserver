Description for API major version 0.1
Will be replaced by API version 1 after some order has been made


QUICK NOTE:
-All requests that are not from a certified competition server will be given a 403: Forbidden response.
-If you implement DoS protection on these servers, you should totally use 420: Enhance Your Calm response


* /api/v1/server-data (GET)
   * Get metadata about the server
   * Parameters: None
   * Response:
      * productNamespace: {string}
         * Vanilla is ‘whale shark’
         * Identify which version of the competition server with which this build server is intended to work. Usually the name of the organization. The default for ours is ‘Whale Shark’
      * version: <MAJOR>.<MINOR>.<BUILD>
         * Example: 0.1.1
         * Identify which major, minor, and build version this server is
         * All major versions should be cross-compatible
         * Minor versions may introduce new fields
      * serverName: {string}
         * Identify the server by a human-readable name. Used by team admins to accept or deny server connection requests.
         * Also used by admins to monitor server progress, in case something happens.
      * serverUUID: {uuid}
         * Identify the server by a unique key
         * This is generated at server start, not as part of configuration
      * buildConstraints: {object}
         * List of constraints imposed by the server. This is where minor versions may come to shine - additional constraints may be added here, if you want greater control over how they are to be used by the competition server.
         * maxConcurrentTests: {number} (default: 1)
            * How many tests can be performed simultaneously
         * queueSize: {number} (default: 1)
            * How many builds can be in queue, waiting to be performed?
         * resultsAvailability: {number}
            * For how long are results available after the build has finished? In milliseconds
            * The competition server can ask the build server about the results of a build for any amount of time after this
      * buildSystemList: {hypermedia}
         * Hypermedia reference to where a list of supported languages can be obtained
      * comparisonSystemList: {hypermedia}
         * Hypermedia reference to where a list of supported comparison systems can be obtained
* /api/v1/buildSystem (GET)
   * Get metadata about build systems in use on this machine
   * Parameters
      * name {string, optional}
         * The name of a specific build server in question. If this is provided, a successful response will have 1 element in buildSystemList
   * Response (200 OK)
      * buildSystemList: {array<object>}
         * Array of items, each describing a build system
         * If parameter ‘name’ was provided, this will have one element in it.
         * id: {string}
            * Unique name of the build system. A build server cannot have two systems by the same name.
            * DO NOT use names like c++, g++
            * Instead, use names like this: c++11_g++_4.18_0.1.1
            * Our naming convention: language_tool_version_uniqueinfo
         * name: {string}
            * Not necessarily unique name of the build system.
            * This should be something human-readable.
            * Example: C++ 11, Vigil, Python
         * description: {string}
            * Notes that may be valuable for an admin to know.
            * Example: “PHP cannot prevent fork bombs”
   * Response (404 Not Found)
      * Happens if the requested build system is not found
      * error: “Build system with given name not found”
   * Response (400 Bad Request)
      * Happens if the name parameter is given, but is empty
      * error: “Name parameter found, but contains invalid content (check to see if a name was actually provided?)”
* /api/v1/comparisonSystem (GET)
   * Get metadata about the comparison systems in use on this machine
   * Parameters
      * name {string, optional}
         * The name of a specific comparison system in question. If this is provided, a successful response will have 1 element in comparisonSystemList
   * Response (200 OK)
      * comparisonSystemList
         * Array of items, each describing a comparison system
         * If parameter ‘name’ was provided, this will have one element in it
         * id: {string}
            * Unique name of the comparison system. A build server cannot have two systems by the same name.
            * DO NOT use names like ‘basic’, ‘float-list’
            * Instead, use names like this:
               * unix_diff-0.1.1
               * diff_by_line_custom-0.1.1
            * Our naming convention: simple_name-uniqueinfo
               * For uniqueinfo, we just use server version
         * name: {string}
            * Not necessarily unique name of comparison system
            * This should be something human-readable
            * Examples:
               * UNIX diff
               * Float list comparator
         * description: {string}
            * Notes that may be valuable for an admin to use
            * Detailed description of this build system.
   * Response (404 Not Found)
      * Happens if a name was provided, but no system with that name was found
      * error: “Comparison system with given name not found”
   * Response (400 Bad Request)
      * Happens if the name parameter is given, but empty
      * error: “Name parameter found, but contains invalid content (check to see if a name was actually provided?)”
* /api/v1/buildStatus (GET)
   * Get the current status of the build server
   * Parameters: none
   * Response (200 OK)
      * Response will vary based on internal server status
      * status: {enum}
         * ‘READY’
            * Ready to accept new build requests
         * ‘WAITING_FOR_PROCESS_LOCK’
            * The server is ready for a new build request, but right now the maximum number of processes has been reached, and the build will not be scheduled until a process has finished
         * ‘BUSY’
            * The build queue is full, and the server is not accepting any more requests at this time.
      * queued: {number}
         * Number of builds currently waiting on server to be built
      * executing: {number}
         * Number of builds currently running on server
   * Response (420 Enhance Your Calm)
      * Occurs if build server has been requested too many times
      * Empty body
* /api/v1/build (POST)
   * Starts a build, sends back a hypermedia resource to where the build result can be found.
   * Parameters: none
   * Post Data:
      * buildSystemName: {string}
         * Name of the build system to use.
      * comparisonSystemsRequired: {Array<string>}
         * Names of all the comparison systems required by this build
      * packageFile: {file}
         * Encrypted tarball containing all the resources for the build
         * info.json
            * Contains metadata about the submission, in JSON format.
            * original_filename: original filename of the submission
            * test_cases: Array, with each element looking like…
               * id: Unique ID of the test case
               * comparisonSystemName
               * exposeData: {boolean}
                  * True if actual test case information can be used in error messages, e.g., “Failed on line 25: expected 3.2, got 32”
            * time_limit: Time, in milliseconds, that a test case has to run
         * source
            * Source code file from user. Only one is allowed.
         * test-cases (directory)
            * For each test case…
            * {id}.in
               * Input file of test case - piped to program
            * {id}.out
               * Expected output of test case
   * Response (420 Enhance Your Calm)
      * Send this response if a request for a build is made, but the server is not accepting build requests right now
   * Response (200 OK)
      * Send this response when you have a response ready.
      * results: {hypermedia}
         * Hypermedia resource that references the address at which the results of this build can be found.
         * The build can be polled some time after finishing, or before it finishes, at which point the request will take quite awhile.
      * queueSize: {number}
         * Length of the build queue
      * success: {boolean}
         * True if successfully started the build
   * Response (400 Invalid Request)
      * Send this response if the build request cannot be queued, because something is missing
      * errors: {Array<string>}
         * List of errors that occurred.
         * For example: [‘Must provide list of comparison systems required’, ‘Must provide a build system name’]
* /api/v1/build (GET)
   * Requests information about the given build
   * Parameters:
      * ID {number}
         * Id of the build in question
   * Response: (200 OK)
      * Send the results of the build, any notes, etc.
      * Note: If the build has not yet finished, wait for it to finish before sending this request.
      * NEXT VERSION: Perhaps it would be good to implement a timeout here…
      * resultCode: {string}
         * Irrelevant to the major standard, what the internal code result was
      * result: {enum}
         * CORRECT_ANSWER
         * TIME_LIMIT_EXCEEDED
         * BUILD_ERROR
         * INTERNAL_SERVER_ERROR
         * RUNTIME_ERROR
         * WRONG_ANSWER
         * UNKNOWN_CODE (used in minor version extensions only - DO NOT ADD TO ENUM for minor versions)
      * notes: {string}
         * Notes from the build server, human readable. May contain error messages from test cases.
      * optionalParams: {object}
         * Optional params (may be used in minor versions, unused in v0.1.1 standard)
      * NEXT VERSION: Also include badges awarded! Seriously, I think that’d be fun. But, again, I’m just trying to get this to work now.
   * Response: (404 Not Found)
      * Send if there is no build with the given ID found on the server
      * error: ‘No build with the given ID found. Perhaps it timed out?’
* /api/v1/coffee (ANY) or /api/v1/brew-coffee (ANY)
   * Not actually required in the v0.1 specification
   * Response (418 I’m a teapot)
      * error: “I’m a teapot”
      * reference: “https://tools.ietf.org/html/rfc2324”