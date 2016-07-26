var Q = require('q');
var prompt = require('prompt');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var nodemailer = require('nodemailer');
var format = require('string-format');
var open = require('open');

var log = require('../util/log');
var config = require('../config').release;
var releaseConfigPath = path.join(__dirname, './config.json');

function ask(schema){
  var deferred = Q.defer();

  prompt.start();

  prompt.get(schema, function (err, result) {

    if(err){
      deferred.reject(err);
      return err;
    }

    deferred.resolve(result);
  });

  return deferred.promise;
}

exports.config = function(){

  var schema = {
    properties: {
      contentFile: {
        description: '请指定格式为JSON的邮件配置路径(例: E:\\autoMail.json), 可以用命令生成',
        required: true
      },
      user: {
        pattern:  /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        description: '请输入邮箱用户名(例: a@inkey.com)',
        required: true
      },
      password: {
        hidden: true,
        description: '请输入邮箱密码',
        required: true
      },
      mailTo: {
        description: '请输入收件人列表, 支持多个(例: b@inkey.com, c@inkey.com)',
        default: 'yibinglan@inkey.com',
        required: true
      },
      mailCC: {
        description: '请输入抄送人列表, 支持多个(例: b@inkey.com, c@inkey.com)',
        default: 'pf@inkey.com',
        required: true
      }
    }
  };

  ask(schema).then(function(results){

    if(!fs.existsSync(results.contentFile)){
      return log.red('配置失败: mail配置文件不存在');
    }else{
      if(fs.lstatSync(results.contentFile).isDirectory()){
        return log.red('配置失败: 不是有效配置文件');
      }
    }

    var mail = {
      mail: {
        user: results.user,
        password: results.password,
        mailTo: results.mailTo,
        mailCC: results.mailCC,
        contentFile: results.contentFile
      }
    };

    try{
      mail = _.assign(require(releaseConfigPath), mail);
    }catch(e){}


    fs.writeFile(releaseConfigPath, JSON.stringify(mail), function(err){
      if(!err){
        log.green('配置成功');
      }
    });
  });
};

/**
 *  在当前目录下生成邮件内容配置
 */

exports.initMailContentJSON = function () {
  fs.writeFile('./autoMail.json', JSON.stringify(config.mail.content), function(err){
    if(!err){
      log.green('文件生成成功');
    }
  });
};

/**
 * 邮件发送
 */

exports.send = function (version) {
  var releaseConfig = require(releaseConfigPath);

  var mailConfig = releaseConfig.mail;
  var mailServer = config.mail.server;
  var contentFile, schema;

  schema = {
    properties: {
      isSend: {
        type: 'boolean',
        description: '发送前, 确认没有什么异常情况吗? 确认已经拉包了吗? 确认发送吗? (t/f)',
        message: '请输入 true or false',
        required: true
      }
    }
  };

  // 判断配置文件

  if(_.isEmpty(mailConfig)){
    return log.red('邮件发送服务尚未配置, 请先配置再发送');
  }

  // 判断邮件内容文件

  if(!fs.existsSync(mailConfig.contentFile)){
    return log.red('发送失败: 邮件内容文件不存在, 请检查配置');
  }else{
    contentFile = require(mailConfig.contentFile);
    contentFile.version = version;
  }

  var smtpTransport = nodemailer.createTransport('SMTP',{
    host: mailServer.host, // 主机
    secureConnection: mailServer.secureConnection, // 使用 SSL
    port: mailServer.port, // SMTP 端口
    auth: {
      user: mailConfig.user,
      pass: mailConfig.password
    }
  });

  var mailOptions = {
    from: mailConfig.user, // 发件地址
    to: mailConfig.mailTo, // 收件列表
    cc: mailConfig.mailCC,
    subject: '前端项目发布申请',
    html: editContent(contentFile)
  };

  // 确认是否发送
  ask(schema).then(function(results){
    if(!results.isSend){
      return false;
    }

    log.red('正在发送邮件! 请稍等');

    smtpTransport.sendMail(mailOptions, function(error){
      if(error){
        log.green('邮件发送失败!');
      }else{
        log.green('邮件发送成功!');
        open('http://172.16.0.116:8090/ViewFarmReport.aspx');
      }
      smtpTransport.close(); // 如果没用，关闭连接池
    });
  });
};

/**
 * 编辑邮件正文
 */

function editContent(content){

  var head = '<table style="width:100%;text-align:center" cellpadding="2" cellspacing="0" border="1" bordercolor="#000000">';
  var foot = '</table>';
  var fmt = '<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td style="text-align: left">{}</td></tr>';

  content.projects = content.projects || [];

  var table = [];

  content.projects.forEach(function(p){

    var table2 = [
      head
    ];
    var l = '';

    table2.push('<tr>' +
      '<td style="color: #E53333">版本号</td>' +
      '<td style="color: #E53333">域名</td>' +
      '<td style="color: #E53333">协议</td>' +
      '<td style="color: #E53333">项目名</td>' +
      '<td style="color: #E53333">备注</td>' +
      '<td style="color: #E53333">更新点</td>' +
      '</tr>');

    p.changelog.forEach(function(log,i){
      l += i+1 + '.' + log + '<br/>';
    });

    table2.push(format(fmt, content.version, content.host, content.protocol, p.name, p.note, l));

    table2.push(foot);
    table2.push('<br/><br/>');

    table = table.concat(table2);

  });

  return table.join('');
}