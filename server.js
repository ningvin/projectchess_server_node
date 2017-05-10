var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var config      = require('./config');
var server      = require('http').createServer(app);

var port = process.env.PORT || config.port;

// ===========================
// Initialize Sockets ========
// ===========================

require('./sockets').init(server);

// ===========================
// Setup Middleware & Routes =
// ===========================

app.use(bodyParser.json());
app.use(require('./middlewares/access_control'));
if (process.argv.length > 2 && process.argv[2] === '--mock') {
    app.use(require('./controllers/mock'));
} else {
    app.use(require('./controllers'));
}

// ===========================
// Start =====================
// ===========================

server.listen(port);
console.log('Listening on http://localhost:' + port);