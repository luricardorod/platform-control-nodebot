/*jslint node: true, indent: 2,nomen:true */
'use strict';

function mainController(scope, Socket) {
  Socket.emit('yolo', { lu: 'hola'});
  console.log(scope);
}

module.exports = function (app) {
  app.controller('MainController', mainController);
  mainController.$inject = ['$scope', 'Socket'];
};
