var fs = require('fs');
var glob = require('glob');
var minimatch = require('minimatch');
var arrayUniq = require('array-uniq');
var chalk = require('chalk');
var _ = require('lodash');

var config = require('../config');
var api = require('../api');
var log = require('../util/log');

var index = 0; // 文件写入计次
var filesLen = 0; // 待上传文件的个数

/**
 * 将生成的链接写入文件
 */

function writeLinkFile(fileName, link){
  var fileContent, filePath;

  index++;
  filePath = config.platform.linkFileName;

  // 针对图片链接区别写入

  if(minimatch(fileName, config.tinypng.imgReg)){
    fileContent = fileName + ' => ' + link.split('http:')[1] + '\n';
  }else{
    fileContent = fileName + ' => ' + link + '\n';
  }

  // 往文件后面添加内容
  
  fs.appendFile(filePath, fileContent, function(err){
    if(err){
      log.red('{} => 链接生成失败！', fileName);
    }else{
      log.green('{} => 链接生成成功！', fileName);
    }

    // 如果循环次数 = 上传文件总数
    // 那么文件全部上传并写入完成

    if(filesLen === index){

      // 重新计算
      index = 0;

      // 读取写入完成的文件内容, 准备进行排序

      var readFileContent = fs.readFileSync(filePath, 'utf-8').split('\n');

      // 数组最后一个元素为空格, 需移除
      readFileContent.pop();

      // 重新排序

      readFileContent = _.sortBy(readFileContent, function(o) {
        try{
          return Number(o.match(/\[前端\](\d*)\./)[1]);
        }catch(e){
          return o;
        }
      });

      // 重新写入
      // 整个流程执行完毕

      fs.writeFileSync(filePath, readFileContent.join('\n'));
    }

  });
}

module.exports = function (host, value, recursive){

  var files = [];

  value.forEach(function(file) {
    if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
          var r = file + (recursive ? '/**' : '');
          files = files.concat(glob.sync(r + '/' + config.platform.fileReg));
        } else if(minimatch(file, config.platform.fileReg, {
            matchBase: true
        })) {
            files.push(file);
        }
    }
  });

  // 去掉重复项

  files = arrayUniq(files);

  filesLen = files.length;

  host = host || config.platform.host;

  api.platform.upload(host, files, function(err, fileName, file){
    log.green('{} => 上传成功！', fileName);
    writeLinkFile(file.FileName, file.FileUrl);
  });
};