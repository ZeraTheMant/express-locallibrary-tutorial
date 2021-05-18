var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose
	.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => console.log("Database Connected"))
	.catch(err => console.log(err));

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

