/*jslint node: true, indent: 2, nomen:true, stupid:true */
/*global every */
'use strict';
/*jslint unparam:true*/
var Cylon = require('cylon');

module.exports = function (server, io) {
  io.on('connection', function (socket) {
    console.log('coneccion');
    socket.on('yolo', function (params) {
      console.log('yolo', params);
    });
  });

  Cylon.robot({
    connections: {
      arduino: { adaptor: 'firmata', port: '/dev/ttyACM0' }
    },

    devices: {
      led: { driver: 'led', pin: 13 }
    },

    work: function (my) {
      every((5).second(), function () {
        my.led.toggle();
      });
    }
  }).start();

};
/*jslint unparam:false*/
