var chalk = require('chalk');

var release = require('../release');
var log = require('../util/log');
var mail = require('../release/mail');
var util = require('../release/util');

module.exports = function(program){
  program
  .command('release [dir...]')
  .description(chalk.blue('项目编译, 目录不区分大小写'))
  .option('--configSVNPath <n>', '配置SVN目录')
  .option('--configMail', '配置邮件')
  .option('--initMailContent', '初始化邮件内容格式文件')
  .option('--openMailContent', '打开邮件内容配置')
  .option('--openMailConfig', '打开邮件配置')
  .option('--query', '获取服务器最新版本号')
  .option('--mail', '自动发送邮件, 需要配置')
  .on('--help', function() {
    console.log('  Examples:\n');
     console.log('    $ spider release --configSVNPath E:\\svn\\Inkey.Spider');
     console.log('    $ spider release --query');
     console.log('    $ spider release weixinpay');
  })
  .action(function(dirs){
    var param = program.commands[3];

    // 配置

    if(param.configSVNPath){
      return util.configSvnPath(param.configSVNPath);
    }

    if(param.configMail){
      return mail.config();
    }

    if(param.initMailContent){
      return mail.initMailContentJSON();
    }

    if(param.openMailContent){
      return util.openMailContent();
    }

    if(param.openMailConfig){
      return util.openMailConfig();
    }

    if(param.query){
      return release.getMaxVersion().then(function(v){
        log.green('当前服务器最新版本号: {}', v);
      });
    }

    if(dirs.length === 0){
      log.red('项目路径不能为空');
    }else{
      return release.release(dirs, param.mail);
    }

    if(param.mail){
      return release.getMaxVersion().then(function(v){
        mail.send(v);
      });
    }

  });
};