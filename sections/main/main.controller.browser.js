/*jslint node: true, indent: 2,nomen:true */
'use strict';

function mainController(scope, Socket) {

  console.log(scope);
  console.log('hola');
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

  scope.modoSistema = 'manual';

  scope.cambioModo = function () {
    scope.modoSistema = scope.modoSistema === 'automatico' ? 'manual' : 'automatico';
    scope.salidas.modo = scope.modoSistema;
    scope.enviarEstadoSalidas();
  };

  scope.salidas = {
    pin8: false,
    pin5: false,
    pin4: false,
    pin3:  false,
    modo: scope.modoSistema
  };

  scope.posicionX = 0;
  scope.posicionY = 0;

  scope.enviarEstadoSalidas = function () {
    var presiones = {};
    presiones.presionX = scope.posicionX;
    presiones.presionY = scope.posicionY;
    Socket.emit('estadoSalidas', presiones, scope.salidas);
    console.log(presiones);
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
