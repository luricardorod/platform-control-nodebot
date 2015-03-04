/*jslint node: true, indent: 2, nomen: true, stupid:true */
'use strict';

var express     = require('express'),
  sections      = require('./sections'),
  http          = require('http'),
  path          = require('path'),
  socketIO      = require('socket.io'),



// Middleware
  bodyParser      = require('body-parser'),
  compression     = require('compression'),
  expressLess     = require('express-less'),
  methodOverride  = require('method-override'),
  morgan          = require('morgan'),

// Create server
  app             = express(),
  io,
  server;


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/sections');
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(compression());
app.use(methodOverride());
app.use(bodyParser.json());
app.use('/css', expressLess(__dirname + '/sections/_default/less'));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/vendor', express.static(__dirname + '/bower_components'));

/**
 * Routes
 */

server = http.createServer(app);
io = socketIO(server);

// Add the routes from the sections
sections(app, io);

// serve index and view partials
/*jslint unparam:true*/
app.get('/', function (req, res) {
  res.render('_default/index');
});
/*jslint unparam:false*/
app.get(/\/html\/([\w\/]+)\.html/, function (req, res) {
  var name = req.params[0];
  res.render(name);
});
/*

 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express app listening on port ' + app.get('port'));
});
