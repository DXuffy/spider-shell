var request = require('request');
var config = require('./config');
var chalk = require('chalk');
var fs = require('fs');
var pretty = require('prettysize');
var Q = require('q');
var format = require('string-format');
var _ = require('lodash');

var log = require('./util/log');
var tinypng = exports.tinypng = {};
var platform = exports.platform = {};

/**
 * 上传运维平台
 */

platform.upload = function upload(host, files, callback){
  
  files = files || [];

  function _u(){

    if(files.length === 0){
      return false;
    }

    // 取第一个文件

    var file = files[0];

    // 删除第一个元素
    
    files.splice(0, 1);

    var fileName = file.match(/\w+\.\w+/)[0];

    request.post({url: host + config.platform.api.upload, formData: {
      file: fs.createReadStream(file),
      FileName: format('[前端]{0}', fileName),
      FileDesc: ''
    }}, function optionalCallback(err, httpResponse, body) {
      
      if (err) {
        callback(err);
        return log.red('上传失败: {}', err);
      }
      
      var data = JSON.parse(body);

      if(data.Code === 100){
        callback(null, fileName, data.Data);
        _u();
      }else{
        log.red(body);
      }
    
    });
  }

  return _u();
};

/**
 * 在线压缩图片
 */

tinypng.upload = function(file){

  var deferred = Q.defer();

  fs.createReadStream(file).pipe(request.post(config.tinypng.host + config.tinypng.api.upload, {
    auth: {
      'user': 'api',
      'pass': config.tinypng.key
    }
  }, function (error, response, body) {
    try {
      body = JSON.parse(body);
    } catch(e) {
      log.red('\u2718 Not a valid JSON response for `{}`', file);
    }

    if(response !== undefined) {
      if (response.statusCode === 201) {
        if (body.output.size < body.input.size) {
          console.log(chalk.green('\u2714 Panda just saved you ' + chalk.bold(pretty(body.input.size - body.output.size) + ' (' + Math.round(100 - 100 / body.input.size * body.output.size) + '%)') + ' for `' + file + '`'));
          return request
          .get(body.output.url)
          .on('response', deferred.resolve)
          .pipe(fs.createWriteStream(file));
        } else {
          log.yellow('\u2718 Couldn’t compress `{}` any further', file);
        }
      } else {
        if (body.error === 'TooManyRequests') {
          log.red('\u2718 Compression failed for `{}` as your monthly limit has been exceeded', file);
        } else if (body.error === 'Unauthorized') {
          log.red('\u2718 Compression failed for `{}` as your credentials are invalid', file);
        } else {
          log.red('\u2718 Compression failed for `{}`', file);
        }
      }
    } else {
      log.red('\u2718 Got no response for `{}`', file);
    }

     return deferred.reject();
  }));
  
  return deferred.promise;
};

/**
 *  查询运维平台文件
 */

platform.query = function (resourceId, name, pageIndex, pageSize){
  var api, deferred, qs;

  deferred = Q.defer();
  pageIndex = pageIndex || config.platform.pageIndex;
  pageSize = pageSize || config.platform.pageSize;
  name = name || '';
  resourceId = resourceId || '';

  if(resourceId){
    api = config.platform.host + config.platform.api.getOne;
    qs = {
      ResourceId: resourceId
    };
  }else{
    api = config.platform.host + config.platform.api.getList;
    qs = {
      PageIndex: pageIndex,
      PageSize: pageSize,
      name: name
    };
  }

  request.get({
    url: api,
    qs: qs
  }, function (err, httpResponse, body) {
    if (err) {
      deferred.reject(body);
      return log.red('上传失败: {}', err);
    }

    body = JSON.parse(body);

    if(body.Code === 100){
      deferred.resolve(body.Data);
    }else{
      log.red(body);
      deferred.reject(body);
    }
  });

  return deferred.promise;
};