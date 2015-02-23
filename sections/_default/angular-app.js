/*jslint node: true, indent: 2, nomen:true, stupid:true */
'use strict';
var di, angular, app, uiModules, injector;

di = require('di');
angular = require('angular');
require('angular-resource');
require('angular-route');
require('angular-socket');
require('bootstrap');
require('angular-google-chart');


app = angular.module('platform-control-nodebot', [
  'ngRoute',
  'ngResource',
  'btford.socket-io',
  'googlechart'
]);
app.config(function ($routeProvider) {
  $routeProvider.otherwise({ redirectTo : '/' });
});

uiModules = {
  angular   : [ 'value', angular ],
  app       : [ 'value', app ]
};
uiModules.uiModules = [ 'value', uiModules ];

injector = new di.Injector([uiModules]);

/* modules browserify */
