var express = require('express')
var router  = express.Router();

router.post('/', function(req, res) {
    
    res.json({
        success: true,
        message: 'User created'
    });
    
});

module.exports = router;