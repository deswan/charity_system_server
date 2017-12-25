const Service = require('egg').Service;

class ActivityService extends Service {
  async getList({ page, tag, pageSize = 20 }) {
    let results = { page };
    let activityId = [];
    if(tag){
      activityId = await this.app.mysql.query(`select
        distinct activity_tag.activity_id as id
        from tag,activity_tag
        where tag.id in (?) and
        tag.id = activity_tag.tag_id
       `, [tag]);
       activityId = activityId.map(item=>{
         return item.id
       })
    }
    
    let rows = await this.app.mysql.query(`select
    activity.id,
    organization.id as orgId,
    activity.name,
    organization.name as orgName,
    organization.logo as orgImg,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName,
    DATE_FORMAT(activity.start_time,'%Y-%m-%d %h:%i') as start_time,
    activity.location,activity.status,activity.img
      from activity,organization,tag,activity_tag
      where status in (0,1) and
      ${activityId.length ? `activity.id in (${activityId}) and` : '' }
      activity.organization_id = organization.id and
      activity.id = activity_tag.activity_id and
      tag.id = activity_tag.tag_id
      GROUP BY activity.id,organization.id,activity.name,organization.name,organization.logo,activity.start_time,activity.location,activity.status,activity.img,activity.create_time
      ORDER BY activity.create_time DESC
      limit ? offset ?
     `, [pageSize, pageSize * (page - 1)]);

    results.rows = rows.map(item => {
      item.tags = this.ctx.helper.resultToObject([{
        name:'tagId',
        data:item.tagId
      },{
        name:'tagName',
        data:item.tagName
      }])
      delete item.tagId;
      delete item.tagName;
      return item;
    })

    let total = await this.app.mysql.query(`select 
      count(*) as total
      from activity
      where ${activityId.length ? `activity.id in (${activityId}) and` : '' }
      status in (0,1)
     `);
     total = total[0].total;

     results.total = total;

    return results;
  }
  async getReviewList(limit=8){
    return await this.app.mysql.query(`select
     id, name, img
      from activity
      where status = 3
      ORDER BY start_time DESC
      limit ?
     `, [limit]);
  }
}

module.exports = ActivityService;
