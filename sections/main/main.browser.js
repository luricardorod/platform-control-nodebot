/*jslint node: true, indent: 2, nomen:true */
'use strict';

function routeConfig(routeProvider) {
  routeProvider
    .when('/', {
      controller : 'MainController',
      templateUrl : '/html/main/main.html'
    });
}

module.exports = function (app) {
  app.config(routeConfig);
};

routeConfig.$inject = ['$routeProvider'];
