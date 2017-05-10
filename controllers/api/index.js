var express = require('express')
var router  = express.Router();

router.use(require('../../middlewares/auth'));
router.use('/users', require('./users'));

module.exports = router;