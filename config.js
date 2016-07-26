
/**
 * 公共配置
 */

exports.common = {
  
};

/**
 * 压缩配置
 */

exports.tinypng = {
  host: 'https://api.tinify.com/',
  api: {
    upload: 'shrink'
  },
  imgReg: '*.+(png|jpg|jpeg)',
  key: 'Fk07pjLMjHDwlOaSJ1l6tDNwoH3FScrZ'
};

/**
 * 运维平台配置
 */

exports.platform = {
  host: 'http://acti.inkey.com/api/Resources/',
  pageIndex: 1,
  pageSize: 10,
  api: {
    upload: 'Upload',
    getList: 'GetList',
    getOne: 'Get'
  },
  fileReg: '*.+(png|jpg|jpeg|js|css|html|htm)', 
  linkFileName: 'link.txt'
};

/**
 * 项目编译模块配置
 */

exports.release = {
  // 远程计算机属性
  remote: {
    ip: '172.16.0.116',
    dir: 'test',
    user: 'sunweb',
    password: 'LKhjk9&*1541144'
  },
  // 挂载目标磁盘
  disk: {
    win: 'p:',
    linux: '/Volumes/version'
  },
  // 具体版本号目录
  versionDir: 'h5.inkey.com',
  mail: {
    server: {
      host: "mail.inkey.com", // 主机
      secureConnection: false, // 使用 SSL
      port: 25 // SMTP 端口
    },
    content: {
      host: 'h5.test.inkey.com',
      protocol: 'http',
      projects: [
        {
          name: '项目名',
          note: '备注',
          changelog: [
            '更新首页',
            '更新我的'
          ]
        }
      ]
    }
  }
};