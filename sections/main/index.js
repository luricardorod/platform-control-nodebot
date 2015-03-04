/*jslint node: true, indent: 2, nomen:true, stupid:true */
/*global every */
'use strict';
/*jslint unparam:true*/
var Cylon = require('cylon'),
  Kalman = require('../kalman/kalman'),
  posicionX = 255,

  // Create the Kalman instances
  kalmanX = new Kalman(),
  kalmanY = new Kalman(),

  //my vars
  flag_setup = 1,
  accX,
  accY,
  accZ,
  gyroX,
  gyroY,
  gyroZ,

  gyroXangle,
  gyroYangle, // Angle calculate using the gyro only
  compAngleX,
  compAngleY, // Calculated angle using a complementary filter
  kalAngleX,
  kalAngleY, // Calculated angle using a Kalman filter
  gyroXrate,
  gyroYrate,

  socketActive,
  dt,
  informacionGrafica,

  presiones = {
    presionX : 0,
    presionY : 0
  },
  presionesAnteriores = {
    presionX : 0,
    presionY : 0
  };

module.exports = function (server, io) {
  io.on('connection', function (socket) {
    console.log('coneccion');
    socketActive = socket;
    socket.on('estadoSalidas', function (params) {
      console.log('Informacion recibida');
      console.log(params);
      posicionX = parseInt(params.x, 10);
      presiones.presionX = parseInt(params.presionX, 10);
      presiones.presionY = parseInt(params.presionY, 10);
    });
  });

  Cylon.robot({
    connections: {
      arduino: { adaptor: 'firmata', port: '/dev/ttyACM0' }
    },

    devices: {
      mpu6050: { driver: 'mpu6050' },
      presion7: { driver: 'led', pin: 7 },
      presion6: { driver: 'led', pin: 6 }
    },

    work: function (my) {
      every(250, function () {
        my.mpu6050.getAcceleration(function (data) {
          if (flag_setup === 1) {
            accX = data.ax;
            accY = data.ay;
            accZ = data.az;

            // Source: http://www.freescale.com/files/sensors/doc/app_note/AN3461.pdf eq. 25 and eq. 26
            // atan2 outputs the value of -π to π (radians) - see http://en.wikipedia.org/wiki/Atan2
            // It is then converted from radians to degrees

            data.roll  = Math.atan2(accY, accZ) * 57.2958;
            data.pitch = Math.atan2(-accX, accZ) * 57.2958;

            kalmanX.setAngle(data.roll); // Set starting angle
            kalmanY.setAngle(data.pitch);
            gyroXangle = data.roll;
            gyroYangle = data.pitch;
            compAngleX = data.roll;
            compAngleY = data.pitch;
            flag_setup = 0;
          } else {
            dt = 0.5;

            accX = data.ax;
            accY = data.ay;
            accZ = data.az;

            data.roll  = Math.atan2(accY, accZ) * 57.2958;
            data.pitch = (Math.atan2(-accX, accZ) * 57.2958) - 28;

            gyroXrate = data.gx; // Convert to deg/s
            gyroYrate = data.gy; // Convert to deg/s

            if ((data.roll < -90 && kalAngleX > 90) || (data.roll > 90 && kalAngleX < -90)) {
              kalmanX.setAngle(data.roll);
              compAngleX = data.roll;
              kalAngleX = data.roll;
              gyroXangle = data.roll;
            } else {
              kalAngleX = kalmanX.getAngle(data.roll, gyroXrate, dt); // Calculate the angle using a Kalman filter
            }
            if (Math.abs(kalAngleX) > 90) {
              gyroYrate = -gyroYrate; // Invert rate, so it fits the restriced accelerometer reading
            }
            kalAngleY = kalmanY.getAngle(data.pitch, gyroYrate, dt);

            gyroXangle += gyroXrate * dt; // Calculate gyro angle without any filter
            gyroYangle += gyroYrate * dt;
            //gyroXangle += kalmanX.getRate() * dt; // Calculate gyro angle using the unbiased rate
            //gyroYangle += kalmanY.getRate() * dt;

            compAngleX = 0.93 * (compAngleX + gyroXrate * dt) + 0.07 * data.roll; // Calculate the angle using a Complimentary filter
            compAngleY = 0.93 * (compAngleY + gyroYrate * dt) + 0.07 * data.pitch;

            // Reset the gyro angle when it has drifted too much
            if (gyroXangle < -180 || gyroXangle > 180) {
              gyroXangle = kalAngleX;
            }
            if (gyroYangle < -180 || gyroYangle > 180) {
              gyroYangle = kalAngleY;
            }

            data.gx = 0;
            data.gy = 0;

            data.kalmanX = kalAngleX * 100;
            data.kalmanY = kalAngleY * 100;
          }
          data.posicionX = posicionX;
          informacionGrafica = data;
          if (socketActive) {
            socketActive.emit('data', informacionGrafica);
          }
        });

        if (presionesAnteriores.presionX !== presiones.presionX && presionesAnteriores.presionY !== presiones.presionY) {
          console.log(presiones);
          my.presion7.brightness(presiones.presionX);
          my.presion6.brightness(presiones.presionY);
          presionesAnteriores.presionX = presiones.presionX;
          presionesAnteriores.presionY = presiones.presionY;
        }
      });
    }
  }).start();

};
/*jslint unparam:false*/
