/**
 * Created by Kamaron on 6/24/2015.
 *
 * Serves as a map of routes to use by the server index file.
 * Pretty much just a glorified key-value map.
 */

/**
 * @constructor
 */
var RoutesList = function () {
    /** @type {Array<string>} */
    this._routeNames = [];

    /** @type {{string: Route}} */
    this._routesMap = {};

    /** @type {{string: Route}} */
    this._nicknamesMap = {};
};

/**
 * @param route {Route}
 * @param nickname {string=}
 */
RoutesList.prototype.addRoute = function (route, nickname) {
    this._routeNames.push(route.endpoint);

    if (this._routesMap[route.endpoint]) {
        throw new Error('A route with endpoint ' + route + ' already exists in the server. Aborting');
    }
    this._routesMap[route.endpoint] = route;

    if (nickname) {
        if (this._nicknamesMap[nickname]) {
            throw new Error('A route with the nickname ' + nickname + ' already exists in the server. Aborting');
        } else {
            this._nicknamesMap[nickname] = route;
        }
    }
};

/**
 * @param routeName {string} Either the endpoint value or the programmer-given nickname of the endpoint
 */
RoutesList.prototype.getRoute = function (routeName) {
    return this._routesMap[routeName];
};

/**
 * @returns {Array.<string>}
 */
RoutesList.prototype.getAllRoutes = function () {
    return this._routeNames;
};

module.exports.RoutesList = RoutesList;