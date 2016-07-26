var chalk = require('chalk');

var platform = require('../platform');

module.exports = function(program){
  program
  .command('platform-query')
  .description(chalk.blue('查询运维平台的资源文件'))
  .option('-s, --pageSize <n>', '单页查询数量, 可空')
  .option('-i, --pageIndex <n>', '起始下标, 可空')
  .option('-t, --title <n>', '模糊查询名字, 可空')
  .option('-d, --resourceId <n>', '文件id, 可空')
  .option('-o, --output <n>', '输出结果到指定目录, 可空')
  .on('--help', function() {
    console.log('  Examples:\n');
    console.log('    $ spider platform-query -o .');
    console.log('    $ spider platform-query -s 1 -o .');
  })
  .action(function(){
    var param = program.commands[0];
    platform.query(param.resourceId, param.title, param.pageIndex, param.pageSize, param.output);
  });
};