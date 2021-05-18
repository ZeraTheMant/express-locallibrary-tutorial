var express = require('express');
var router = express.Router();

/* GET about listing. */
router.get('/', function(req, res, next) {
  res.send('<h1>Aboot</h1>');
});

module.exports = router;
