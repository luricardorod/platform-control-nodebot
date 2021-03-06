/*jslint node: true, indent: 2, nomen:true, stupid:true */
/*global every */
'use strict';
/*jslint unparam:true*/
var Cylon = require('cylon'),
  Kalman = require('../kalman/kalman'),
  R = require('ramda'),

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
  },
  salidasArduino = {
    pin8: false,
    pin5: false,
    pin4: false,
    pin3: false,
    modo: 'manual'
  },

  inicio = 0,
  acelerometro = {
    posicionX : 0
  },
  matrizXPromedio = [],
  matrizYPromedio = [],
  promedioX = 0,
  promedioY = 0,
  posicionX = 0,

  flagPosicion = 0;

module.exports = function (server, io) {
  io.on('connection', function (socket) {
    console.log('coneccion');
    socketActive = socket;
    socket.on('estadoSalidas', function (presiones, salidas) {
      console.log('Informacion recibida');
      console.log(presiones);
      console.log(salidas);
      salidasArduino = salidas;
      presiones.presionX = parseInt(presiones.presionX, 10);
      presiones.presionY = parseInt(presiones.presionY, 10);
    });
  });


  server.get('/posiciones/:posicionX', function (req, res) {
    console.log('holll');
    flagPosicion = 0;
    posicionX = parseInt(req.params.posicionX, 10);
    res.send('Hello World! x= ' + posicionX);
  });

  Cylon.robot({
    connections: {
      arduino: { adaptor: 'firmata', port: '/dev/ttyACM0' }
    },

    devices: {
      mpu6050: { driver: 'mpu6050' },
      presion7: { driver: 'led', pin: 7 },
      presion6: { driver: 'led', pin: 6 },
      pin3: { driver: 'led', pin: 3},
      pin4: { driver: 'led', pin: 4},
      pin5: { driver: 'led', pin: 5},
      pin8: { driver: 'led', pin: 8}
    },

    work: function (my) {
      every(10, function () {
        inicio = inicio + 1;
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
            dt = 0.1;

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
            acelerometro.posicionX = data.kalmanX;
            if (inicio < 51) {
              console.log(inicio);
              matrizXPromedio.push(data.kalmanX);
              matrizYPromedio.push(data.kalmanY);
              acelerometro.posicionX = data.kalmanX;
            } else {
              promedioX = R.reduce(function (a, b) {
                return a + b;
              }, 0, matrizXPromedio);
              promedioX = promedioX / 50;

              promedioY = R.reduce(function (a, b) {
                return a + b;
              }, 0, matrizYPromedio);
              promedioY = promedioY / 50;

              if (data.kalmanX < promedioX + 400 && data.kalmanX > promedioX - 400) {
                promedioX = (promedioX + data.kalmanX) / 2;
                matrizXPromedio.push(data.kalmanX);
                matrizYPromedio.push(data.kalmanY);
                matrizXPromedio.shift();
                matrizYPromedio.shift();
              }
              acelerometro.posicionX = promedioX;
              data.kalmanX = promedioX;
              //ARREGLAR
              data.kalmanY = promedioX;
            }
          }
          data.posicionX = posicionX;
          informacionGrafica = data;
          if (socketActive) {
            socketActive.emit('data', informacionGrafica);
          }
          if (posicionX > (acelerometro.posicionX - 25) && posicionX < (acelerometro.posicionX + 25)) {
            my.pin3.turnOff();
            my.pin4.turnOff();
          } else {
            if (inicio === 294) {
              my.pin3.turnOff();
              my.pin4.turnOff();
            }
            if (inicio > 300) {
              inicio = 285;
              my.presion6.brightness(150);
              if (posicionX > (acelerometro.posicionX + 60)) {
                my.pin3.turnOn();
                my.pin4.turnOff();
              } else if (posicionX < (acelerometro.posicionX - 60)) {
                my.pin4.turnOn();
                my.pin3.turnOff();
              }
            }
          }
        });
      });
    }
  }).start();

};
/*jslint unparam:false*/
