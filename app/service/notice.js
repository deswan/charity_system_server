const Service = require('egg').Service;

class NoticeService extends Service {
  async getList(volId,limit = 10) {
      return await this.app.mysql.query(`
      SELECT
  id,target_name,target_type,statusText,type,date_format(create_time,'%Y-%m-%d %H:%i:%s') as create_time
  from notice
where volunteer_id = ?
ORDER BY create_time DESC 
limit ?
      `,[volId,limit])
  }
}

module.exports = NoticeService;
