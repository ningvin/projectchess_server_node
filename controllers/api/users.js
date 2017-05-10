var express = require('express')
var router  = express.Router();
var db      = require('../../database/db');
var sockets = require('../../sockets');

router.get('/', function(req, res) {
    var io = sockets.get();
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

router.get('/:id', function(req, res) {
    var userId = req.params.id;
    if (userId === 'me' || userId === req.decoded.id) {
        res.json({
            success: true,
            message: 'User data',
            user: req.decoded
        });
    } else {
        db.query('SELECT alias, wins, draws, losses FROM user WHERE id = ?',
            [userId],
            function(results, fields) {
                var user = {};
                if (results != null && results.length > 0) {
                    user = results[0];
                }
                res.json({
                    success: true,
                    message: 'User data',
                    user: user
                });
            },
            function(dbError) {
                res.status(500).send({
                    success: false,
                    message: 'Internal server error',
                    details: dbError.toString()
                });
            }
        );
    }
});

module.exports = router;