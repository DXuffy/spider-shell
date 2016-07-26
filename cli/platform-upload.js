var chalk = require('chalk');

var platform = require('../platform');

module.exports = function(program){
  program
  .command('platform-upload <dir>')
  .description(chalk.blue('将目录下的文件上传到运维平台, 并生成链接对照表'))
  .option('-r, --recursive', '递归目录匹配文件')
  .option('-h, --host <n>', '指定接口host, 默认是线上环境')
  .on('--help', function() {
    console.log('  Examples:\n');
    console.log('    $ spider platform-upload -r .');
    console.log('    $ spider platform-upload assets/img/test.png');
    console.log('    $ spider platform-upload . -h http://192.168.0.201:8303/api/Resources/');
  })
  .action(function(files, options){
    var recursive = options.recursive || false;
    var host = options.host;
    files = (files && [files]) || ['.'];
    platform.upload(host, files, recursive);
  });
};