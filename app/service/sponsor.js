const Service = require('egg').Service;

class SponsorService extends Service {
  async getApplingByOrg(orgId) {
    return await this.app.mysql.query(`
    select
    sponsor.id as item_id,
  activity.id as act_id,
  activity.name as act_name,
    DATE_FORMAT(sponsor.create_time,'%Y-%m-%d %H:%i:%s') as create_time,
    sponsor.name,
    sponsor.logo,
    sponsor.amount,
  sponsor.phone,
    2 as type
    from sponsor,activity
  where sponsor.activity_id = activity.id AND
    activity.organization_id = ? AND
    sponsor.status  = 0
    `,[orgId])
  }
  async updateStatus(id,status){
    await this.app.mysql.update('sponsor',{
      id, status
    })
    return {code:0};
  }
  async create(actId,params){
    await this.app.mysql.insert('sponsor',{
      activity_id:actId,
      create_time:this.app.mysql.literals.now,
      name:params.name,
      amount:params.amount,
      phone:params.phone,
      logo:params.logo,
      status:0
    })
    return {code:0}
  }
}

module.exports = SponsorService;
