spider-shell
===

spider内部命令行工具, 通过它的快捷命令可以解决某些效率问题

快速开始
---
- [download](http://gitlab.it.inkey.com/spider/spider-shell)
- npm i -g ./spider-shell
- spider

模块
---
- platform-query
- platform-upload
- tinypng
- release

platform-query
---
查询运维平台的资源文件

#####  Example:
```
// 查看帮助
$ spider platform-query -h  

// 筛选标题为inkey.js 并且每页返回3条数据 将结果输出的当前目录
$ spider platform-query --pageSize 3 --title inkey.js --output .
```

platform-upload
---
将目录下的文件上传到运维平台, 并生成链接对照表

##### Example:
```
// 查看帮助
$ spider platform-upload --help

// 指定上传host
$ spider platform-upload . -h http://192.168.0.201:8303/api/Resources/

// 将当前目录下的所有文件上传到运维平台(-r 递归子目录)
$ spider platform-upload . -r
```

tinypng
---
将目录下的图片在线压缩, 并替换原文件

##### Example:
```
// 查看帮助
$ spider tinypng -h

// 将当前目录下的所有文件在线压缩
// 压缩只支持图片(-r 递归子目录)
$ spider tinypng . -r
```

release
---
项目编译, 目录不区分大小写

>  **注意:** 如果第一次用该命令编译项目, 请先根据帮助文档 配置好本地svn目录 和 自动发送邮件服务  

##### Example:
```
// 查看帮助
$ spider release -h

// 第一次需要配置本地的svn目录
$ spider release --configSVNPath E:\svn\Inkey.Spider

// 用于生成标准的邮件内容模版
$ spider release --initMailContent

// 配置自己的邮箱信息,  其中需要指定邮件内容模版的路径
$ spider release --configMail

// 获取服务器最新的版本号
$ spider release --query

// 打开邮件内容配置
$ spider release --openMailContent

// 打开邮件配置
$ spider release --openMailConfig

// 自动发送邮件, 需要配置
$ spider release --mail

// 编译项目 支持多个 并且选择自动发送邮件服务
$ spider release weixinpay minimonkey/trunk/app --mail
```

ChangeLog
===
- 0.0.10
  - [release]发送邮件前优化提示, 以防未拉包的情况下发送邮件导致版本号错乱

- 0.0.9
  - [release]根据约定, 将assets/js下所有的js文件生成SourceMap文件

- 0.0.8
  - [运维平台上传模块]针对图片将生成的链接去掉`http:`前缀
  - [运维平台上传模块]针对文件名完成排序(用了你就知道)

- 0.0.7
  - 去掉tinypng模块的上传到运维平台功能(上传运维平台请用platform-upload模块)

- 0.0.6
  - 支持指定接口host(终于可以上传到测试服了!)

- 0.0.5
  - 针对SVN目录重构优化

- 0.0.4
  - 项目编译时,自动将项目名加入配置文件
  - 邮件发送前确认提示
  - 独立发送邮件服务

- 0.0.3
  - 优化邮件格式
  - 新增邮件字段`protocol`加入协议

- 0.0.2
  - 修复log日志异常问题
  - 运维平台api地址更改为正式服地址
  - 新增打开邮件内容配置
  - 新增打开邮件配置