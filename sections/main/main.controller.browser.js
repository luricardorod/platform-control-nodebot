/*jslint node: true, indent: 2,nomen:true */
'use strict';

function mainController(scope, Socket) {

  console.log(scope);
  scope.chartObject = {
    "type": "LineChart",
    "displayed": true,
    "data": {
      "cols": [
        {
          "id": "time",
          "label": "Tiempo",
          "type": "string",
          "p": {}
        },
        /*{
        "id": "x",
        "label": "X",
        "type": "number",
        "p": {}
        },
      {
      "id": "y",
      "label": "Y",
      "type": "number",
      "p": {}
      },
      {
      "id": "gx",
      "label": "GX",
      "type": "number",
      "p": {}
      },
      {
      "id": "gy",
      "label": "GY",
      "type": "number",
      "p": {}
      },*/
        {
          "id": "posicionX",
          "label": "PosicionX",
          "type": "number",
          "p": {}
        },
        {
          "id": "kalmanX",
          "label": "KalX",
          "type": "number",
          "p": {}
        },
        {
          "id": "kalmanY",
          "label": "kalY",
          "type": "number",
          "p": {}
        }
      ],
      "rows": []
    },
    "options": {
      "title": "Posicion",
      "displayExactValues": true,
      "vAxis": {
        "title": "Valor",
        "gridlines": {
          "count": 20
        }
      },
      "hAxis": {
        "title": "Tiempo"
      }
    },
    "formatters": {}
  };

  scope.modoSistema = 'automatico';

  scope.cambioModo = function () {
    scope.modoSistema = scope.modoSistema === 'automatico' ? 'manual' : 'automatico';
    scope.salida.modo = scope.modoSistema;
    scope.enviarEstadoSalidas();
  };

  scope.salida = {
    pin17: false,
    pin16: false,
    pin15: false,
    pin14: false,
    pin13: false,
    pin12: false,
    pin11: false,
    pin10: false,
    pin9:  false,
    pin8: false,
    pin7: false,
    pin6:  false,
    pin5: false,
    pin4: false,
    pin3:  false,
    modo: scope.modoSistema
  };

  scope.enviarEstadoSalidas = function () {
    scope.salida.pin9 = scope.posicionX.charAt(0);
    scope.salida.pin8 = scope.posicionX.charAt(1);
    scope.salida.pin7 = scope.posicionX.charAt(2);
    scope.salida.pin6 = scope.posicionX.charAt(3);
    scope.salida.pin5 = scope.posicionX.charAt(4);
    scope.salida.pin4 = scope.posicionX.charAt(5);
    scope.salida.pin3 = scope.posicionX.charAt(6);
    Socket.emit('estadoSalidas', scope.posicionX);
  };

  scope.cssStyle = "height:100%; width:100%;";

  Socket.on('data', function (data) {
    scope.chartObject.data.rows.push({
      c: [
        {v: null },
        /*
        {v: data.roll},
        {v: data.pitch},
        {v: data.gx},
        {v: data.gy},*/
        {v: data.posicionX},
        {v: data.kalmanX},
        {v: data.kalmanY}
      ]
    });
    console.log(data);
    console.log(scope.chartObject.data.rows.length);

    if (scope.chartObject.data.rows.length > 100) {
      scope.chartObject.data.rows.shift();
    }
  });
}

module.exports = function (app) {
  app.controller('MainController', mainController);
  mainController.$inject = ['$scope', 'Socket'];
};
