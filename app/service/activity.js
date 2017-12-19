const Service = require('egg').Service;

class ActivityService extends Service {
  async getList({ page, type, pageSize = 20 }) {
    let results = { page };
    let rows = await this.app.mysql.query(`select
    count(*) as total,
    activity.id,
    organization.id as orgId,
    activity.name,
    organization.name as orgName,
    organization.logo as orgImg,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName,
    activity.start_time,activity.location,activity.status,activity.img
      from activity,organization,tag,activity_tag
      where status in (0,1) and
      activity.organization_id = organization.id and
      activity.id = activity_tag.activity_id and
      tag.id = activity_tag.tag_id
      GROUP BY activity.id,organization.id,activity.name,organization.name,organization.logo,activity.start_time,activity.location,activity.status,activity.img
      ORDER BY activity.start_time DESC
      limit ? offset ?
     `, [pageSize, pageSize * (page - 1)]);
    results.total = rows[0].total;
    results.rows = rows.map(item => {
      delete item.total;
      let tags = []
      item.tagName = item.tagName.split(',');
      item.tagId.split(',').forEach((id, index) => {
        tags[index] = {
          id,
          name: item.tagName[index]
        }
      })
      item.tags = tags;
      delete item.tagId;
      delete item.tagName;
      return item;
    })
    return results;
  }
}

module.exports = ActivityService;
