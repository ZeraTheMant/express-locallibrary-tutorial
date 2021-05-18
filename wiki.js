var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	res.send('Wiki home page');
});

router.get('/about', function (req, res) {
	res.send('About this wiki');
});

module.exports = router;