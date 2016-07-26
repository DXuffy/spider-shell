
var program = require('commander');
var chalk = require('chalk');
var figlet = require('figlet');

var version = require('../package.json').version;
var helloSpider = figlet.textSync('Hello Spider');


exports.run = function(argv){
  program
    .version('\n  v' + version + '\n' + chalk.red(helloSpider))
    .parse(argv);
};

require('./platform-query')(program);
require('./platform-upload')(program);
require('./tinypng')(program);
require('./release')(program);
