/*jslint node: true, indent: 2, nomen:true, stupid:true */
'use strict';
/*jslint unparam:true*/
module.exports = function (server, io) {
  io.on('connection', function (socket) {
    console.log('coneccion');
    socket.on('yolo', function (params) {
      console.log('yolo', params);
    });
  });
};
/*jslint unparam:false*/
