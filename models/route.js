/**
 * Created by kamaron on 11/15/15.
 */

/**
 *
 * @param endpoint {string} Endpoint which this route services (e.g., '/api/v1/serverData')
 * @constructor
 */
var Route = function (endpoint) {
    this.endpoint = endpoint;

    this._pathBase = 'http://localhost:8000' + endpoint;

    this._get = function (req, res) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': 'No resource found at this endpoint'}));
        res.end();
    };

    this._post = function (req, res) {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({'error': 'No resource found at this endpoint'}));
        res.end();
    };
};

/**
 *
 * @param method {function (req : Object, res : Object)} The HTTP listener method to invoke on a GET request
 */
Route.prototype.defineGet = function (method) {
    if (method) {
        this._get = method;
    }
};

/**
 *
 * @param method {function (req : Object, res : Object)} The HTTP listener method to invoke on a POSt request
 */
Route.prototype.definePost = function (method) {
    if (method) {
        this._post = method;
    }
};

Route.prototype.get = function (req, res) {
    this._get(req, res);
};

Route.prototype.post = function (req, res) {
    this._post(req, res);
};

exports.Route = Route;