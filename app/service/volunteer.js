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
}

module.exports = VolunteerService;
