var path = require('path');
var shell = require('shelljs');
var Q = require('q');
var fs = require('fs');
var _ = require('lodash');
var glob = require('glob');
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var util = require('./util');
var mail = require('./mail');
var log = require('../util/log');
var releaseConfigPath = path.join(__dirname, './config.json');
var releaseConfig;

exports.configSvnPath = util.configSvnPath;

exports.release = function (dirs, isSendMail){

  // 如果不存在, 提示用户配置

  if(!util.checkConfig()){
    log.red('请完成配置');
    return false;
  }

  var fisPaths = util.getFISPaths(dirs);

  if(dirs.length !== fisPaths.length){
    log.red('无法完成编译, 未找到fis配置文件');
    return false;
  }

  releaseConfig = require(releaseConfigPath);
  removeRelease();
  releaseProjects(fisPaths, dirs);

  // 获取待生成的SourceMap的js列表
  // 这里有一个约定:
  // 默认只对项目下的 /assets/js下的所有js文件生成SourceMap

  var jsList = glob.sync(releaseConfig.releasePath + '/**/assets/js/*.js');

  if(!_.isEmpty(jsList)){
    log.red('以下文件将会生成SourceMap文件\n{}', jsList.join('\n'));

    var index = 0;

    jsList.forEach(function(filePath){
      var filePathArr = filePath.split('/');
      var fileName = filePathArr[filePathArr.length - 1];

      index++;

      (function(index){
        gulp.src(filePath)
          .pipe(sourcemaps.init())
          .pipe(uglify({
            compress: { drop_console: true }
          }))
          .pipe(sourcemaps.write('.'))
          .pipe(gulp.dest(filePath.replace(fileName, '')))
          .on('end', function(){
            // 当循环最后一次时, 创建版本文件并提交SVN
            if(index === jsList.length){
              _createVersionFile();
            }
            log.green('生成成功 => {}', filePath + '.map');
          });
      }(index));
    });
  }else{
    _createVersionFile();
  }

  function _createVersionFile(){
    createVersionFile().then(function(v){
      commitSVN(v);

      log.green('发布完成, 如果选择了自动发送邮件请确保所有配置正常');
      log.green('现在会打开一个网页, 请点击对应按钮进行拉包');

      if(isSendMail){
        // 发送邮件
        mail.send(v);
      }
    });
  }
};

/**
 * 提交svn
 */

function commitSVN(version){

  log.red('准备提交代码至SVN');
  shell.cd(releaseConfig.releasePath);
  shell.exec('svn add * --force');
  shell.exec('svn commit -m "脚本自动上传"');

  log.green('版本号 => {}', version);
}

/**
 * 编译项目
 */

function releaseProjects(fisPaths, dirs){

  releaseConfig = require(releaseConfigPath);

  var mailFilePath = releaseConfig.mail && releaseConfig.mail.contentFile;

  fisPaths.forEach(function(filePath){
    log.red('{} => 正在编译', filePath);
    shell.cd(filePath);
    shell.exec('fis3 release pro');
  });

  // 判断是否有配置邮箱服务, 自动将要发布的项目名写入到配置文件中

  if(mailFilePath && fs.existsSync(mailFilePath)){
    var mailFile = require(mailFilePath);
    var projects = mailFile.projects;

    dirs.forEach(function(dir){

      if(_.find(projects, { name: dir }) === undefined){

        // 如果没有找到对象, 新增一个对象

        projects.push({
          name: dir,
          note: '',
          changelog: []
        });
      }
    });

    // 获取最终要发布的项目
    // 去掉不发布的项目

    mailFile.projects = _.xor(projects, _.filter(projects, function(o) {
      return ( _.indexOf(dirs, o.name) === -1 );
    }));

    // 写入文件

    fs.writeFile(mailFilePath, JSON.stringify(mailFile));
  }

  log.red('编译完成');
}

exports.getMaxVersion = function (){

  var deferred = Q.defer();

  releaseConfig = require(releaseConfigPath);

  // 挂载版本目录

  util.mountVersionDisk();

  // 进入版本目录
  shell.cd(releaseConfig.versionDir);

  var versions = shell.ls();


  versions = versions.map(function(varsion){
    return varsion.match(/\d+.\d+.\d+.\d+/)[0];
  });

  util.getMaxVersion(versions).then(function(v){
    deferred.resolve(v);
  });

  return deferred.promise;
};

/**
 * 生成版本号
 */

function createVersionFile(){
  var deferred = Q.defer();

  log.red('正在创建版本号');

  exports.getMaxVersion().then(function(v){
    var version = v.split('.');
    var lastNumber = Number(version[3]);
    var newVersion, versionFile;

    version[3] = lastNumber + 1;
    // 新版本号
    newVersion = version.join('.') + '.txt';
    versionFile = path.join(releaseConfig.releasePath, newVersion);
    shell.touch(versionFile);
    log.red('版本号创建完成');

    deferred.resolve(version.join('.'));
  });

  return deferred.promise;
}

/**
 * 删除release目录下的所有文件
 */

function removeRelease() {
  // 进入svn目录
  shell.cd(releaseConfig.svnPath);

  log.red('正在更新svn');
  // 更新svn
  shell.exec('svn update');

  log.red('svn更新完成');
  
  // 进入release目录
  shell.cd(releaseConfig.releasePath);

  if(shell.ls().length !== 0){
    // 删除目录
    shell.exec('svn delete ./*');
    // 提交代码    
    shell.exec('svn commit -m "脚本自动删除release目录下的所有文件"');

    log.red('初始化已完成, 准备生成版本文件');
  }
}
