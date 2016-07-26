var fs = require('fs');
var path = require('path');
var whichOs = require('which-os');
var Q = require('q');
var shell = require('shelljs');
var file = require('file');
var glob = require('glob');
var _ = require('lodash');
var open = require('open');

var log = require('../util/log');
var config = require('../config').release;
var releaseConfigPath = path.join(__dirname, './config.json');

/**
 * 打开邮箱内容配置
 */

exports.openMailContent = function(){
  // 文件不存在
  if(!fs.existsSync(releaseConfigPath)){
    log.red('无法打开: 邮箱尚未配置');
  }else{
    try{
      var c = require(releaseConfigPath);
      if(!fs.existsSync(c.mail.contentFile)){
        log.red('无法打开: 邮箱内容尚未配置');
      }else{
        log.green('文件路径 => {}', c.mail.contentFile);
        open(c.mail.contentFile);
      }
    }catch(e){
      log.red('无法打开: 邮箱尚未配置');
    }
  }
};

/**
 * 打开邮箱配置
 */

exports.openMailConfig = function(){
  // 文件不存在
  if(!fs.existsSync(releaseConfigPath)){
    log.red('无法打开: 邮箱尚未配置');
  }else{
    log.green('文件路径 => {}', releaseConfigPath);
    open(releaseConfigPath);
  }
};

exports.mountVersionDisk = function(){
  var os = whichOs();
  var command, remote;

  remote = config.remote;

  switch(os){
    case 'Windows_NT':
      command = 'net use ' + config.disk.win + ' \\\\' + remote.ip + '\\' + remote.dir + ' "' + remote.password + '" /user:' + remote.user;
      break;
    case 'Linux':
      // 创建待挂载的目录
      file.mkdirsSync(config.disk.linux);
      command = 'mount -t cifs -o username=' + remote.user + ',password="' + remote.password + '" //'+ remote.ip +'/' + remote.dir + ' ' + config.disk.linux;
      break;
    default:
      // 创建待挂载的目录
      file.mkdirsSync(config.disk.linux);
      command = 'mount -t smbfs //'+ remote.user +':"' + remote.password + '"@' + remote.ip +'/' + remote.dir + ' ' + config.disk.linux;
      break;
  }

  // 获取文件数量
  if(!fs.existsSync(require(releaseConfigPath).versionDir)){
    log.red('正在挂载版本磁盘');
    // 挂载目录到文件夹
    shell.exec(command);
  }

  log.red('版本磁盘已挂载');
};

/**
 * 获取最大版本号
 */

exports.getMaxVersion = function(versions){

  var deferred = Q.defer();

  versions = versions || [];

  function size(){
    // 判断是否只有1个版本 并返回 
    if(versions.length <= 1){
      return deferred.resolve(versions[0]);
    }

    // 取第一个和第二个比较
    // result = 0 相等, 1 比第二个大, -1 比第二个小
    var result = exports.compareVersion(versions[0], versions[1]);

    switch(result){
      case -1:
        versions.splice(0, 1);
        break;
      case 1:
      case 0:
        versions.splice(1, 1);
        break;
    }

    size();
  }

  size();

  return deferred.promise;
};

/**
 * 版本号比较
 */

exports.compareVersion = function (v1, v2) {
  if (v1 === v2) return 0;

  var arr1 = v1.split('.');
  var arr2 = v2.split('.');

  arr1 = arr1.map(function(value) {
    return parseInt(value);
  });

  arr2 = arr2.map(function(value) {
    return parseInt(value);
  });

  var x = arr1[0] - arr2[0];
  var y = arr1[1] - arr2[1];
  var z = arr1[2] - arr2[2];
  var q = arr1[3] - arr2[3];

  if (x > 0) {
    return 1;
  } else if(x === 0 && y > 0) {
    return 1;
  } else if(x === 0 && y === 0 && z > 0) {
    return 1;
  }else if(x === 0 && y === 0 && z === 0 && q > 0){
    return 1;
  }

  return -1;
};

/**
 * 获取完整的fis配置文件所在路径
 */

exports.getFISPaths = function(dirs){
  var releaseConfig = require(releaseConfigPath);
  var projects = [];
  var os = whichOs();
  
  dirs.forEach(function(dir){
    var file = path.join(releaseConfig.svnPath, dir, 'fis-conf.js');

    // linux要区分大小写 这里要针对linux特殊处理
    if(os !== 'Windows_NT'){
      file = glob.sync(file, {
        // 不区分大小写
        nocase: true
      })[0];
    }

    if(fs.existsSync(file)){
      // 将fis配置文件所在的完整路径加入项目列表
      projects.push(path.join(file, '..'));
    }
  });

  return projects;
};

/**
 * 判断是否存在release的配置文件
 */

exports.checkConfig = function() {
  if(fs.existsSync(releaseConfigPath)){
    try{
      return !!require(releaseConfigPath).svnPath;
    }catch(e){
      return false;
    }
  }else{
    return false;
  }
};

/**
 * 配置本地svn项目目录
 */

exports.configSvnPath = function (svnPath){
  
  if(!svnPath){
    log.red('配置失败, svn地址不能为空');
    return false;
  }

  if(!fs.existsSync(svnPath)){
    log.red('配置失败, 地址不存在');
    return false;
  }

  if(!fs.existsSync(path.join(svnPath, '.svn'))){
    log.red('配置失败, 不是有效的svn地址');
    return false;
  }

  var content = {
    // svn目录
    svnPath: svnPath,
    // 编译目录
    releasePath: path.join(svnPath, 'release'),
    // 版本目录
    versionDir: path.join(whichOs() === 'Windows_NT' ? config.disk.win : config.disk.linux, config.versionDir)
  };

  try{
    content = _.assign(require(releaseConfigPath), content);
  }catch(e){}


  fs.writeFile(releaseConfigPath, JSON.stringify(content), function(err){
    if(!err){
      log.green('配置成功');
    }
  });
};