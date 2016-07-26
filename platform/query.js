var fs = require('fs');
var path = require('path');
var chalk = require('chalk');

var config = require('../config');
var api = require('../api');
var log = require('../util/log');

/**
 * 将生成的链接写入文件
 */

function writeLinkFile(data, output){
  var fileContent, filePath;

  filePath = path.join(output, config.platform.linkFileName);

  fileContent = JSON.stringify(data);
  
  // 写入
  
  fs.appendFile(filePath, fileContent, function(err){
    if(err){
      log.red('{} 文件生成失败！', '\u2718');
    }else{
      log.green('{} 文件生成成功！', '\u2714');
    }
  });
}

module.exports = function (){

  var output = arguments[4];

  api.platform.query.apply(null, arguments).then(function(data){
    console.log(data);
    if(output){
      writeLinkFile(data, output);
    }
  });
};