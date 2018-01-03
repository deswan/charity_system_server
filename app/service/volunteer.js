const Service = require('egg').Service;

class VolunteerService extends Service {
  async getInformation() {
    let result = {};
    let rows = await this.app.mysql.query(`select
      volunteer.name,
      SUM(activity.recipient_number) as recipient_count
      from volunteer LEFT JOIN volunteer_activity ON volunteer.id=volunteer_activity.volunteer_id
      INNER JOIN activity ON activity.id=volunteer_activity.activity_id
      where volunteer_activity.status = 2 and
      activity.status = 3
      GROUP BY volunteer.id,volunteer.name
      ORDER BY SUM(activity.recipient_number) DESC
      limit 10
     `);

    let total = await this.app.mysql.query(`select
      count(*) as total
      from volunteer
     `);
    total = total[0].total;
    result.total = total;

    result.rows = rows
    return result;
  }
  async getListByOrg({ orgId,name,pageSize = 10,page = 1 }) {
    let result = {};
    if(name){
      let nameArr = name.split('');
      nameArr.push('%');
      nameArr.unshift('%');
      name = nameArr.join('')
    }
    let rows = await this.app.mysql.query(`select
    volunteer.id,
    volunteer.name,
    volunteer.gender+0 as gender,
    YEAR(NOW())-YEAR(volunteer.birthday) as age
        FROM volunteer_organization,volunteer
    where volunteer_organization.organization_id = ? AND
      volunteer_organization.status = 2 AND
      volunteer_organization.volunteer_id = volunteer.id
      ${name ? `and volunteer.name like ${this.app.mysql.escape(name)}` : ''}
      ORDER BY volunteer_organization.join_time DESC 
      limit ? offset ?
     `,[orgId,pageSize, pageSize * (page - 1)]);

    if (rows.length) {
      let volsId = rows.map(item=>{
        return item.id;
      })
      let actsData = await this.app.mysql.query(`select
      volunteer_id as id,
        count(*) as act_count
      from volunteer_activity,activity
    where volunteer_activity.volunteer_id in (?) and
      activity.organization_id = ? AND
      volunteer_activity.activity_id = activity.id
    GROUP BY volunteer_activity.volunteer_id
       `,[volsId,orgId]);

       rows.forEach(item => {
        actsData.forEach(act=>{
          if(item.id === act.id){
            item.act_count = act.act_count || 0;
          }
        })
      })
    }

    let total = await this.app.mysql.query(`select
      count(*) as total
      from volunteer_organization
      where organization_id = ? and status = 2
     `,[orgId]);
    total = total[0].total;
    result.total = total;

    result.rows = rows
    return result;
  }
}

module.exports = VolunteerService;
