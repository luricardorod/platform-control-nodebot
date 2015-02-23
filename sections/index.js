/*jslint node: true, indent: 2, nomen: true, stupid:true */
'use strict';
var fs = require('fs');

module.exports = function (server, io) {
  fs.readdirSync(__dirname).forEach(function (file) {
    var fullpath,
      isDirectory,
      invisible;

    fullpath = __dirname + '/' + file;
    isDirectory = fs.lstatSync(fullpath).isDirectory();
    invisible = (file.indexOf('_') === 0);

    if (isDirectory && !invisible && fs.existsSync(fullpath + '/index.js')) {
      require(fullpath + '/index.js')(server, io);
    }
  });
};
