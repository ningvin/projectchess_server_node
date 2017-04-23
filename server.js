var express 	= require('express');
var app 		= express();
var bodyParser 	= require('body-parser');
var server		= require('http').createServer(app);
var io			= require('socket.io')(server);

var jwt 		= require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var config 		= require('./config');

// ===========================
// configuration =============
// ===========================

var port = process.env.PORT || 8080;

app.set('secret', config.secret);

//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// ===========================
// routes ====================
// ===========================

app.get('/', function(req, res) {
	res.json({
		message: 'Main'
	});
});

app.post('/login', function(req, res) {
	var user = req.body;
	
	console.log(user);
	
	if (!isValidUserData(user)) {
		res.json({
			success: false,
			message: 'Invalid User Data'
		});
	} else {
		var token = jwt.sign(user, app.get('secret'), {
			expiresIn: '1d'
		});
		
		res.json({
			success: true,
			message: 'Login successful',
			token: token
		});
	}
	
});

app.post('/register', function(req, res) {
	
});

var apiRoutes = express.Router();

apiRoutes.use(function(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	
	if (token != null) {
		jwt.verify(token, app.get('secret'), function(err, decoded) {
			if (err) {
				return res.json({
					success: false,
					message: 'Failed to authenticate: invalid token'
				});
			} else {
				console.log(decoded);
				req.decoded = decoded;
				next();
			}
		});
	} else {
		return res.status(403).send({
			success: false,
			message: 'No token provided'
		});
	}
});

apiRoutes.get('/test', function(req, res) {
	res.json({
		message: 'Super Secret'
	});
});

app.use('/api', apiRoutes);

// ===========================
// socket.io =================
// ===========================

io.set('authorization', socketioJwt.authorize({
	secret: config.secret,
	handshake: true
}));

io.sockets.on('connection', function(socket) {
	console.log('New socket connected: ' + socket.handshake.decoded_token.id);
	var token = socket.handshake.decoded_token;
	socket.user = token;
	
	// Join room identified by user id
	socket.join(token.id);
	
	socket.on('subscribe', function(room) {
		socket.join(room);
	});
	
	socket.on('unsubscribe', function(room) {
		socket.leave(room);
	});
	
	socket.on('game_invite', function(req) {
		io.to(req.id).emit('game_invite', { id: socket.user.id });
	});
	
	socket.on('move', function(req) {
		var move = {
			move: req.move,
			user: socket.user.alias,
			id: socket.user.id
		};
		socket.broadcast.to(req.room).emit('move', move);
	});
	
	socket.on('chat', function(req) {
		var message = {
			msg: req.msg,
			user: socket.user.alias,
			id: socket.user.id,
		}
		socket.broadcast.to(req.room).emit('chat', message);
	});
	
});

// ===========================
// functions =================
// ===========================

function isValidUserData(user) {
	return typeof user.name !== 'undefined'
			&& typeof user.email !== 'undefined'
			&& typeof user.alias !== 'undefined'
			&& typeof user.id !== 'undefined';
}

// ===========================
// start =====================
// ===========================

server.listen(port);
console.log('Listening on http://localhost:' + port);