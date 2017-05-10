var express = require('express')
var router  = express.Router();
var db      = require('../database/db');
var bcrypt  = require('bcrypt');
var shortid = require('shortid');

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function isValidUserData(user) {
    return !isBlank(user.name) && !isBlank(user.email)
            && !isBlank(user.alias) && !isBlank(user.password);
}

router.post('/', function(req, res) {
    
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
        
        db.query('INSERT INTO user VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
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

module.exports = router;