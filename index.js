// Required Modules (Boilerplate)

var express = require('express');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var mongodb = require('mongodb');
var ObjectID = require("mongodb").ObjectId;
var db;
var app = express();

mongodb.MongoClient.connect('mongodb://localhost', function(err, database) {
	if (err) {
		console.log(err);
		return;
	}
	console.log("Connected to Database.");
	db = database;
	startListening();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(expressSession({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

// Authentication Endpoint
app.get('/api/authentication', function(req, res){
	if(!req.session.user){
		res.send("error");
	}
});

// New User Registration Endpoint
app.post('/api/register', function(req, res){
	// Checks to see if the username already exists:
	db.collection('users').findOne({
		username: req.body.username
	}, function(err, data){
		if(err){
			console.log(err);
			return;
		}
		if(data !== null){
			res.send('exists');
			return;
		}
		// If the username does not exist: adds user to database:
		db.collection('users').insertOne({
			username: req.body.username,
			password: req.body.password //todo: hash this
		}, function(err, data){
			if(err){
				console.log(err);
				res.status(500);
				res.send('error');
				return;
			}
			res.send(data);
		});
	});
});

// User Login Endpoint
app.post('/api/login', function(req, res){
	// Checks to see if the user profile exists
	db.collection('users').findOne({
		username: req.body.username,
		password: req.body.password
	}, function(err, data){
		if(data === null){
			res.send('error');
			return;
		}
		// If the user profile exists: associates this cookie (or session) with this user's profile
		req.session.user = {
			_id: data._id,
			username: data.username
		};
		res.send('success');
	});
});

// Chats Submission Endpoint
app.post('/api/newChats', function(req, res){
	// Checks to see if user is logged in
	if(!req.session.user){
		res.status(403);
		res.send('forbidden');
		return;
	}
	// If the user is logged in: inserts their chat in the database
	db.collection('chats').insertOne({
		timestamp: Date.now(),
		message: req.body.message,
		type: req.body.type,
		submitter: req.session.user._id,
		username: req.session.user.username //is this secure??
	});
	res.send("success");

});

// Display Chats Endpoint
app.get('/api/getChats', function(req, res){
	// Checks to see if user is logged in
	if(!req.session.user){
		res.status(403);
		res.send('forbidden');
		return;
	}
	// If the user is logged in: finds, formats, and sends chat history
	db.collection('chats').find({}).toArray(function(err, docs){
		if(err){
			return console.log(err);
		}
		res.send(docs);
	});
});

// Files to be served out of static public folder (Boilerplate)
app.use(express.static('public'));

// 404 Error (Boilerplate)
app.use(function(req, res, next) {
	res.status(404);
	res.send("File Not Found!");
});

// 500 Error (Boilerplate)
app.use(function(err, req, res, next) {
	console.log(err);
	res.status(500);
	res.send("Internal Server Error!");
	res.send(err);
});

// Start listening after connecting to the database
function startListening() {
	app.listen(8080, function() {
		console.log("Sever started at http://localhost:8080");
	});
}