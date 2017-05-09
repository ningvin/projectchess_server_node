var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var server      = require('http').createServer(app);
var io          = require('socket.io')(server);

var jwt         = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt-auth');
var config      = require('./config');

var mysql       = require('mysql');
var bcrypt      = require('bcrypt');
var shortid     = require('shortid');

// ===========================
// configuration =============
// ===========================

var port = process.env.PORT || 8080;

app.set('secret', config.secret);

//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:8000');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    next();
});

var pool = mysql.createPool({
    connectionLimit : 100, //important
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    debug:  false
});

// ===========================
// routes ====================
// ===========================

app.get('/', function(req, res) {
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({
                success: false,
                message: err.toString()
            });
            return;
        }
        
        res.json({
            success: true,
            message: connection.threadId
        });
        
        connection.release();
    });
});

app.post('/login', function(req, res) {
    
    var loginData = req.body;
    
    if (loginData.alias == null || loginData.password == null) {
        res.status(400).send({
            success: false,
            message: 'Bad request',
            details: '"alias" or "password" field missing'
        });
        return;
    }
    
    queryDB('SELECT * FROM user WHERE alias = ?',
        [loginData.alias],
        function(results, fields) {
            
            if (results == null || results.length == 0) {
                res.status(401).send({
                    success: false,
                    message: 'Invalid user credentials',
                    details: 'User does not exist'
                });
                return;
            }
            
            var user = results[0];
            bcrypt.compare(loginData.password, user.password.toString(),
                function(err, result) {
                    if (result) {
                        delete user.password;
                        var token = jwt.sign(user, app.get('secret'), {
                            expiresIn: '1d'
                        });
                        res.json({
                            success: true,
                            message: 'Login successful',
                            token: token
                        });
                    } else {
                        res.status(401).send({
                            success: false,
                            message: 'Invalid user credentials',
                            details: 'Wrong password'
                        });
                    }
                }
            );
        },
        function(error) {
            res.status(500).send({
                success: false,
                message: 'Internal server error',
                details: error.toString()
            });
        }
    );
    
});

app.post('/register', function(req, res) {
    var user = req.body;
    
    if (!isValidUserData(user)) {
        res.status(400).send({
            success: false,
            message: 'Bad request',
            details: 'One or more required field is missing or invalid'
        });
        return;
    }
    
    user.id = shortid.generate();
    bcrypt.hash(user.password, 10, function(hashError, hash) {
        
        if (hashError) {
            res.status(500).send({
                success: false,
                message: 'Internal server error',
                details: hashError.toString()
            });
            return;
        }
        
        queryDB('INSERT INTO user VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, user.alias, user.name, user.email, hash, 0, 0, 0],
            function(results, fields) {
                res.json({
                    success: true,
                    message: 'User created'
                });
            },
            function(dbError) {
                res.status(400).send({
                    success: false,
                    message: 'Bad request',
                    details: dbError.toString()
                });
            }
        );
    });
    
    
    
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

apiRoutes.get('/games/:id', function(req, res) {
    
});

apiRoutes.post('/games', function(req, res) {
    
});

apiRoutes.get('/users', function(req, res) {
    io.of('/').in('lobby').clients(function(error, clients) {
        var users = [];
        for (var i = 0; i < clients.length; i++) {
            users.push(io.sockets.connected[clients[i]].user.id);
        }
        res.json({
            users: users
        });
    });
});

apiRoutes.get('/users/:id', function(req, res) {
    
});

app.use('/api', apiRoutes);

// ===========================
// socket.io =================
// ===========================

io.use(socketioJwt.authenticate({
    secret: config.secret
}, function(payload, done) {
    return done(null, payload);
}));

io.sockets.on('connection', function(socket) {
    console.log('New socket connected: ' + socket.request.user.id);
    socket.user = socket.request.user;
    socket.invited = null;
    socket.accepted = null;
    socket.game = null;
    
    // Join room identified by user id
    socket.join(socket.user.id);
    
    socket.on('subscribe', function(room) {
        socket.join(room);
    });
    
    socket.on('unsubscribe', function(room) {
        socket.leave(room);
    });
    
    /**
     * Sent by user to join the lobby room
     */
    socket.on('join_lobby', function() {
        socket.join('lobby');
        socket.broadcast.to('lobby').emit('join_lobby', {
            id: socket.user.id
        });
    });
    
    /**
     * Sent by user to leave the lobby room
     */
    socket.on('leave_lobby', function() {
        socket.broadcast.to('lobby').emit('leave_lobby', {
            id: socket.user.id
        });
        socket.leave('lobby');
    });
    
    /**
     * Sent by user to invite another user to a game
     * req := {
     *     id: id of the user that should receive this invite
     * }
     */
    socket.on('game_invite', function(req) {
        if (socket.invited !== null) {
            // Cancel pending invites
            io.to(socket.invited).emit('game_invite_cancel', {
                reason: 'Invite withdrawn'
            });
        }
        // Store invite in socket object 
        socket.invited = req.id;
        // Invite new user
        io.to(req.id).emit('game_invite', {
            userId: socket.user.id,
            socketId: socket.id
        });
    });
    
    /**
     * Sent by user to cancel current game invite initiated
     * by the user himself
     * req := {
     *     id: id of the user that received the initial invite
     * }
     */
    socket.on('game_invite_withdraw', function(req) {
        if (socket.invited === req.id) {
            io.to(req.id).emit('game_invite_withdraw', {
                reason: 'Invite withdrawn'
            });
        }
    });
    
    /**
     * Sent by invited user to accept or decline
     * the game invite
     */
    socket.on('game_response', function(req) {
        console.log('game_response');
        console.log(req);
        io.to(req.id).emit('game_response', {
            accepted: req.accepted
        });
    });
    
    socket.on('game_start', function(req) {
        //io.to(req.id).emit('game_start'), 
    });
    
    socket.on('game_launch', function(req) {
        console.log('Game Launch!');
        io.to(req.id).emit('game_launch', {
            id: socket.user.id
        });
    });
    
    socket.on('move', function(req) {
        io.to(req.id).emit('move', {
            id: socket.user.id,
            move: req.move
        });
    });
    
    socket.on('chat', function(req) {
        var message = {
            msg: req.msg,
            user: socket.user.alias,
            id: socket.user.id,
        }
        socket.broadcast.to(req.room).emit('chat', message);
    });
    
    socket.on('disconnect', function() {
        socket.leave('lobby');
        io.to('lobby').emit('lobby_leave', {
            id: socket.user.id
        });
    });
    
});

// ===========================
// utility functions =========
// ===========================

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function isValidUserData(user) {
    return !isBlank(user.name) && !isBlank(user.email)
            && !isBlank(user.alias) && !isBlank(user.password);
}

function queryDB(query, values, onSuccess, onError) {
    pool.getConnection(function(err, connection) {
        if (err) {
            onError(err);
            return;
        }
        
        connection.query(query, values, function(err, results, fields) {
            connection.release();
            if (err) {
                onError(err);
            } else {
                onSuccess(results, fields);
            }
        });
    });
}

// ===========================
// start =====================
// ===========================

server.listen(port);
console.log('Listening on http://localhost:' + port);