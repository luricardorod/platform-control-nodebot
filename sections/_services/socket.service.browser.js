/* jslint node: true */
'use strict';

function socket(socketFactory) {
  return socketFactory();
}

module.exports = function (app) {
  app.factory('Socket', socket);

  socket.$inject = ['socketFactory'];
};
