var express = require('express')
var router  = express.Router();

router.use('/login',    require('./login'));
router.use('/register', require('./register'));
router.use('/api',      require('../api'));

module.exports = router;