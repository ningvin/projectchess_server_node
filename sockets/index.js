var socketioJwt = require('socketio-jwt-auth');
var config      = require('../config');
var io;

exports.init = function(server) {
    io = require('socket.io')(server);
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
                id: socket.user.id,
                alias: socket.user.alias
            });
        });
        
        /**
         * Sent by user to leave the lobby room
         */
        socket.on('leave_lobby', function() {
            socket.broadcast.to('lobby').emit('leave_lobby', {
                id: socket.user.id,
                alias: socket.user.alias
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
                id: socket.user.id,
                alias: socket.user.alias,
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
                id: socket.user.id,
                alias: socket.user.alias,
                accepted: req.accepted
            });
        });
        
        socket.on('game_create', function(req) {
            io.to(req.id).emit('game_create', {
                id: socket.user.id,
                alias: socket.user.alias
            });
        });
        
        socket.on('game_launch', function(req) {
            console.log('Game Launch!');
            io.to(req.id).emit('game_launch', {
                id: socket.user.id,
                alias: socket.user.alias
            });
        });
        
        socket.on('move', function(req) {
            io.to(req.id).emit('move', {
                id: socket.user.id,
                alias: socket.user.alias,
                move: req.move
            });
        });
        
        socket.on('chat', function(req) {
            var message = {
                msg: req.msg,
                alias: socket.user.alias,
                id: socket.user.id,
            }
            socket.broadcast.to(req.room).emit('chat', message);
        });
        
        socket.on('swap_colors', function(req) {
            console.log('swap_colors');
            io.to(req.id).emit('swap_colors', {
                id: socket.user.id,
                alias: socket.user.alias,
                move: req.move
            });
        });
        
        socket.on('disconnect', function() {
            socket.leave('lobby');
            io.to('lobby').emit('lobby_leave', {
                id: socket.user.id,
                alias: socket.user.alias
            });
        });
        
    });
};

exports.get = function() {
    return io;
};