'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1513520319299_3369';

  // add your config here
  config.middleware = [];
  config.mysql = {
    client: {
      // host
      host: 'localhost',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: 'deswan',
      // 数据库名
      database: 'gdut_db_project',
    }
  }

  return config;
};
