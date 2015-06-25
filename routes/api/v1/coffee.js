/**
 * Created by Kamaron on 6/24/2015.
 */

var Route = require('../../../models/route').Route;

var endpoint = new Route('/api/v1/coffee');

/**
 * Get method. Respond with "I'm a teapot".
 *  If you are not implementing the Indigo Code Buildserver in a teapot,
 *  please consider using a more appropriate response code.
 * The assumption, however, is that you are using a teapot, as per tradition.
 */
endpoint.get([], function (req, res) {
    res.writeHead(418, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({'error': "I'm a teapot", "reference": "https://tools.ietf.org/html/rfc2324"}));
    res.end();
});

/**
 * Post method. Respond with "I'm a teapot".
 * See notes on GET method for notes on non-teapot based buildservers
 */
endpoint.post([], [], 0, function (req, res, fields, files) {
    res.writeHead(418, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({'error': "I'm a teapot", "reference": "https://tools.ietf.org/html/rfc2324"}));
    res.end();
});

module.exports = endpoint;