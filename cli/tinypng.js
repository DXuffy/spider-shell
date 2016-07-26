var chalk = require('chalk');
var Q = require('q');

var tinypng = require('../tinypng');
var platform = require('../platform');

module.exports = function(program){
  program
  .command('tinypng <dir>')
  .description(chalk.blue('将目录下的图片在线压缩, 并替换原文件'))
  .option('-r, --recursive', '递归目录匹配文件')
  .on('--help', function() {
    console.log('  Examples:\n');
    console.log('    $ spider tinypng .');
    console.log('    $ spider tinypng -r assets/img');
    console.log('    $ spider tinypng assets/img/test.png');
  })
  .action(function(files, options){
    var recursive = options.recursive || false;
    files = (files && [files]) || ['.'];

    Q.allSettled(tinypng(files, recursive));
  });
};