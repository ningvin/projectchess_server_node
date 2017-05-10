var config              = require('../config');

var originPort          = config.accessControl.port;
var accessControlOrigin = 'http://'
        + config.accessControl.host
        + ':'
        + originPort.toString();

module.exports = function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', accessControlOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    next();
};