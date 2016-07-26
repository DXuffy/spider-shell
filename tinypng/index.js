var fs = require('fs');
var glob = require('glob');
var minimatch = require('minimatch');
var arrayUniq = require('array-uniq');

var config = require('../config');
var api = require('../api');

module.exports = function (files, recursive){

  var images = [];
  var promises = [];

  files.forEach(function(file) {
    if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
          var r = file + (recursive ? '/**' : '');
          images = images.concat(glob.sync(r + '/' + config.tinypng.imgReg));
        } else if(minimatch(file, config.tinypng.imgReg, {
            matchBase: true
        })) {
            images.push(file);
        }
    }
  });

  // 去掉重复项

  images = arrayUniq(images);
  images.forEach(function(image){
    promises.push(api.tinypng.upload(image));
  });

  return promises;
};