var express = require('express')
var router  = express.Router();
var jwt     = require('jsonwebtoken');
var config  = require('../../config');
var shortid = require('shortid');

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
    
    var user = {
        alias: loginData.alias,
        email: 'peter.pan@web.de',
        name: 'Peter Pan',
        id: shortid.generate(),
        wins: 0,
        draws: 0,
        losses: 0
    };
    
    var token = jwt.sign(user, config.secret, {
        expiresIn: '1d'
    });
    
    res.json({
        success: true,
        message: 'Login successful',
        token: token
    });
    
});

module.exports = router;