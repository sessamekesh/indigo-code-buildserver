/**
 * Created by Kamaron on 6/24/2015.
 *
 * route.js: Define model for a route that will be used in the REST API. This includes
 *  - On which endpoint it listens
 *  - To which methods it responds (GET, POST, HEAD...)
 *  - Methods for generating hypermedia GET endpoints
 */

var config = require('../config');
var http = require('http');
var querystring = require('querystring');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');

/**
 * @param endpoint {string} Endpoint on which this route will listen. Example: '/api/v1/status'
 * @constructor
 */
var Route = function (endpoint) {
    /**
     * @type {string}
     */
    this.endpoint = endpoint;

    /**
     * @type {string}
     * @private
     */
    this._pathBase = 'http://' + config.hostname + ':' + config.port + endpoint;

    /**
     * Function to call if this route encounters a get request
     * By default, 404
     * @param req {object} Request object
     * @param res {object} Response object
     * @private
     */
    this._get = function (req, res) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': 'No resource found at this endpoint'}));
        res.end();
    };

    /**
     * Expected parameters for a get request
     * The get request will fail as malformed if any of these parameters are not present
     * @type {Array<string>}
     * @private
     */
    this._getExpectedParams = [];

    /**
     * Function to call if this route encounters a post request
     * By default, 404
     * @param req {object} Request object
     * @param res {object} Response object
     * @private
     */
    this._post = function (req, res, fields, files) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': 'No resource found at this endpoint'}));
        res.end();
    };

    /**
     * Expected paramters for a post request
     * The post request will fail as malformed if any of these parameters are not present
     * @type {Array<string>}
     * @private
     */
    this._postExpectedParams = [];

    /**
     * Expected data in the post request body
     * The post request will fail as malformed if any of these are not present
     * @type {Array<string>}
     * @private
     */
    this._postExpectedData = [];

    /**
     * Name of fields containing uploaded files that is expected
     * @type {Array<string>}
     * @private
     */
    this._postExpectedFileFields = [];
};

/**
 * Define functionality if this route is hit with a 'get' method
 * @param expectedParams {Array<string>=}
 * @param method {function(req: object, res: object)}
 */
Route.prototype.get = function (expectedParams, method) {
    this._getExpectedParams = expectedParams;
    this._get = method;
};

/**
 * Define functionality if this route is hit with a 'post' method
 * @param expectedParams {Array<string>=}
 * @param expectedData {Array<string>=}
 * @param numFiles {number}
 * @param method {function(req: object, res: object, fields: Array<string>, files: Array<string>)}
 */
Route.prototype.post = function (expectedParams, expectedData, numFiles, method) {
    this._postExpectedParams = expectedParams;
    this._postExpectedData = expectedData;
    this._postExpectedFileFields = numFiles;
    this._post = method;
};

/**
 * @param paramList {{string: *}=} Key-value set for the parameters that are passed to this route
 * @returns {string} URL that can be referenced to get the information described by paramList
 */
Route.prototype.reverseRoute = function (paramList) {
    paramList = paramList || {};
    return this._pathBase + '?' + querystring.stringify(paramList);
};

/**
 * Routes a get request via the specification of this router
 * @param req {http.IncomingMessage}
 * @param res {http.ServerResponse}
 */
Route.prototype.routeGet = function (req, res) {
    var i; /** @type {number} */
    var missingParams = []; /** @type {Array<string>} */
    if (this._get) {
        queryparams = url.parse(req.url, true).query;
        req.queryparams = queryparams;
        for (i = 0; i < this._getExpectedParams.length; i++) {
            if (!queryparams.hasOwnProperty(this._getExpectedParams[i])) {
                missingParams.push(this._getExpectedParams[i]);
            }
        }

        if (missingParams.length === 0) {
            this._get(req, res);
        } else {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({'error': 'Missing required parameters', 'missingParams': missingParams}));
            res.end();
        }
    } else {
        // If the get endpoint is null, that means it was specifically set as null... So, the programmer
        //  has something in mind that they are going to use later, but it is not available right now.
        res.writeHead(501, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': 'Feature is not implemented at this endpoint, but will be in the future'}));
        res.end();
    }
};

/**
 * Routes a post request via the specification of this router
 * @param req {http.IncomingMessage}
 * @param res {http.ServerResponse}
 */
Route.prototype.routePost = function (req, res) {
    var i; /** @type {number} */
    var queryparams; /** @type {{string: *}} */
    var missingParams = []; /** @type {Array<string>} */
    var unexpectedFiles = []; /** @type {Array<{string: File}>} */
    var me = this; /** @this {Route} */

    /**
     * If an error occurs, use this function to clean up files that were uploaded and not needed
     * @param files {{string: File}}
     */
    function deleteFiles(files) {
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                fs.unlink(files[file].path, function (uerr) {
                    uerr && console.log('/routes/route.js: Error deleting file "' + files[file].path + '" from POST request: ' + uerr.message);
                });
            }
        }
    }

    if (this._post) {
        queryparams = url.parse(req.url, true).query;
        for (i = 0; i < this._postExpectedParams.length; i++) {
            if (!queryparams.hasOwnProperty(this._postExpectedParams[i])) {
                missingParams.push(this._postExpectedParams[i]);
            }
        }

        if (missingParams.length === 0) {

            var form = new formidable.IncomingForm();
            form.uploadDir = config.buildStagingDirectory;
            form.maxFieldsSize = 2 * 1024 * 1024; // 2MB max
            form.multiples = true;

            form.parse(req, function (err, fields, files) {
                if (err) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify({'error': 'Internal server error (check logs)'}));
                    res.end();
                    deleteFiles(files);
                    console.log('An error occurred in route ' + me.endpoint + ': ' + err.message);
                } else {
                    // Make sure all files are in place...
                    for (i = 0; i < me._postExpectedFileFields.length; i++) {
                        if (!files.hasOwnProperty(me._postExpectedFileFields[i])) {
                            missingParams.push(me._postExpectedFileFields[i]);
                        }
                    }

                    // Unlike the other systems, no additional files are accepted, and will cause the request to fail
                    for (var file in files) {
                        if (files.hasOwnProperty(file)) {
                            var isContained = false;
                            for (i = 0; i < me._postExpectedFileFields.length; i++) {
                                if (me._postExpectedFileFields[i] === file) {
                                    isContained = true;
                                }
                            }

                            if (!isContained) {
                                unexpectedFiles.push({paramName: file, offender: file});
                            }
                        }
                    }

                    if (unexpectedFiles.length > 0) {
                        for (i = 0; i < unexpectedFiles.length; i++) {
                            fs.unlink(unexpectedFiles[i].offender.path, function (uerr) {
                                uerr && console.log('/routes/route.js: Error deleting unexpected file with param name ' + unexpectedFiles[i].paramName + ': ' + uerr.message);
                            });
                        }
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify({
                            'error': 'Unexpected file uploads received',
                            'offender_list': unexpectedFiles.map(function (a) { return a.paramName })
                        }));
                        res.end();
                    } else {
                        if (missingParams.length === 0) {
                            for (i = 0; i < me._postExpectedData.length; i++) {
                                if (!fields.hasOwnProperty(me._postExpectedData[i])) {
                                    missingParams.push(me._postExpectedData);
                                }
                            }

                            if (missingParams.length === 0) {
                                me._post(req, res, fields, files);
                            } else {
                                res.writeHead(400, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify({
                                    'error': 'Missing required data in POST body',
                                    'missingData': missingParams
                                }));
                                res.end();
                                deleteFiles(files);
                            }
                        } else {
                            res.writeHead(400, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify({
                                'error': 'Missing required file uploads', 'missingFiles': missingParams
                            }));
                            res.end();
                            deleteFiles(files);
                        }
                    }
                }
            });

        } else {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({'error': 'Missing required parameters', 'missingParams': missingParams}));
            res.end();
            deleteFiles(files);
        }
    } else {
        // If the post endpoint is null, that means it was specifically set as null... So, the programmer
        //  has something in mind that they are going to use later, but it is not available right now.
        res.writeHead(501, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': 'Feature is not implemented at this endpoint, but will be in the future'}));
        res.end();
    }
};

module.exports.Route = Route;

// If extended to allow PUT, HEAD, etc... put those here. BREW...