var chalk = require('chalk');
var format = require('string-format');

var colors = ['red', 'blue', 'green', 'yellow', 'magenta', 'cyan', 'gray'];

colors.forEach(function(color){
  exports[color] = function(){
    try{
      console.log(chalk[color](format.apply(null, arguments)));
    }catch(e){
      console.log(arguments);
    }
  }
});