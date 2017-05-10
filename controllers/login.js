var express = require('express')
var router  = express.Router();
var jwt     = require('jsonwebtoken');
var config  = require('../config');
var db      = require('../database/db');
var bcrypt  = require('bcrypt');

router.post('/', function(req, res) {
    
    var loginData = req.body;
    
    if (loginData.alias == null || loginData.password == null) {
        res.status(400).send({
            success: false,
            message: 'Bad request',
            details: '"alias" or "password" field missing'
        });
        return;
    }
    
    db.query('SELECT * FROM user WHERE alias = ?',
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
                        var token = jwt.sign(user, config.secret, {
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

module.exports = router;