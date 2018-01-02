const Service = require('egg').Service;

class ActivityService extends Service {
  async getList({ page, tag, pageSize = 20 }) {
    let results = { page };
    let tagActivityId = [];
    if (tag) {
      let activities = await this.app.mysql.query(`select
        distinct activity_id as id
        from activity_tag
        where tag_id in (?)
       `, [tag]);
      if (!activities.length) {
        Object.assign(results, {
          total: 0,
          rows: []
        })
        return results;
      }
      tagActivityId = activities.map(item => {
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
      DATE_FORMAT(activity.start_time,'%Y-%m-%d') as start_time,
      activity.location,activity.status,activity.img
        from activity,organization,tag,activity_tag
        where status in (0,1) and
        ${tagActivityId.length ? `activity.id in (${tagActivityId}) and` : ''}
        activity.organization_id = organization.id and
        activity.id = activity_tag.activity_id and
        tag.id = activity_tag.tag_id
        GROUP BY activity.id,organization.id,activity.name,organization.name,organization.logo,activity.start_time,activity.location,activity.status,activity.img,activity.create_time
        ORDER BY activity.create_time DESC
        limit ? offset ?
       `, [pageSize, pageSize * (page - 1)]);

    results.rows = rows.map(item => {
      this.ctx.helper.resultToObject(item, 'tags', ['tagId', 'tagName'])
      return item;
    })

    let total = await this.app.mysql.query(`select 
       count(*) as total
       from activity
       where ${tagActivityId.length ? `activity.id in (${tagActivityId}) and` : ''}
      status in (0,1) 
       `);
    total = total[0].total;
    results.total = total;
    return results;
  }
  async getReviewList(limit = 8) {
    return await this.app.mysql.query(`select
     id, name, img
      from activity
      where status = 3
      ORDER BY start_time DESC
      limit ?
     `, [limit]);
  }
  async getActivityById(id) {
    let data = await this.app.mysql.query(`
    select
      activity.id,
      DATE_FORMAT(activity.start_time,'%Y-%m-%d') as start_time,
      DATE_FORMAT(activity.end_time,'%Y-%m-%d') as end_time,
      activity.status,
      activity.name,
      activity.img,
      DATE_FORMAT(activity.create_time,'%Y-%m-%d') as create_time,
      activity.location,
      activity.recipient_number,
      activity.recruit_number,
      organization.id as orgId,
      organization.logo as orgImg,
      organization.name as orgName,
      organization.slogan as  orgSlogan,
      GROUP_CONCAT(tag.id) as tagId,
      GROUP_CONCAT(tag.name) as tagName
      from activity LEFT JOIN organization ON activity.organization_id = organization.id
      LEFT JOIN activity_tag ON activity.id = activity_tag.activity_id
      LEFT JOIN tag on activity_tag.tag_id = tag.id
      where activity.id = ?
      group by activity.id,
      activity.start_time,
      activity.end_time,
      activity.status,
      activity.img,
      activity.name,
      activity.create_time,
      activity.location,
      activity.recipient_number,
      activity.recruit_number,
      organization.id,
      organization.name,
      organization.logo,
      organization.slogan`, [id]);
    data = data[0]

    let comments = await this.app.mysql.query(`select
      volunteer.id,
      volunteer.name,
      volunteer.portrait,
      volunteer_activity.comment,
      volunteer_activity.photos,
      volunteer_activity.score,
      volunteer_activity.score_time
    from volunteer_activity INNER JOIN volunteer ON volunteer_activity.volunteer_id=volunteer.id
    where volunteer_activity.activity_id = ? AND
      volunteer_activity.status = 2 and
      volunteer_activity.isScored = 1`, [id])
    data.comments = comments;

    let sponsors = await this.app.mysql.select('sponsor', {
      where: { status: 2 }, // WHERE 条件
      columns: ['name', 'amount', 'logo'], // 要查询的表字段
      orders: [['create_time', 'desc']],
    })
    data.sponsors = sponsors;

    data = this.ctx.helper.resultToObject(data, 'tags', ['tagId', 'tagName']);
    return this.ctx.body = data;
  }

  async getMyActsByStatus({
    uid, page, status,pageSize = 15
  }) {
    let results = {};
    let rows = await this.app.mysql.query(`select
    activity.id,
    activity.name,
    activity.location,
    activity.status,
    activity.img,
    organization.id as orgId,
    organization.name as orgName,
    organization.logo as orgImg,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName,
    DATE_FORMAT(activity.start_time,'%Y-%m-%d') as start_time,
    DATE_FORMAT(activity.end_time,'%Y-%m-%d') as end_time
    
      from activity,organization,tag,activity_tag,volunteer_activity

      where activity.status in ${status == 0 ? '(0,1,2)' : '(3,4)'} and
      volunteer_activity.activity_id = activity.id and
      activity.organization_id = organization.id and
      activity.id = activity_tag.activity_id and
      tag.id = activity_tag.tag_id and
      volunteer_activity.volunteer_id = ? and
      volunteer_activity.status = 2

      GROUP BY 
      activity.id,
      organization.id,
      activity.name,
      organization.name,
      organization.logo,
      activity.start_time,
      activity.end_time,
      activity.location,
      activity.status,
      activity.img
      
      ORDER BY activity.start_time DESC
      limit ? offset ?
     `, [uid, pageSize, pageSize * (page - 1)]);

    results.rows = rows.map(item => {
      this.ctx.helper.resultToObject(item, 'tags', ['tagId', 'tagName'])
      return item;
    })

    let total = await this.app.mysql.query(`select 
       count(*) as total
       from activity,volunteer_activity
       where activity.status in ${status == 0 ? '(0,1,2)' : '(3,4)'} and
       volunteer_activity.activity_id = activity.id and
       volunteer_activity.volunteer_id = ? and
       volunteer_activity.status = 2
       `, uid);

    total = total[0].total;
    results.total = total;
    return results;
  }
  async getMyActsByOrg(orgId,uid) {
    let rows = await this.app.mysql.query(`select
    activity.id,
    activity.name,
    activity.location,
    activity.status,
    activity.img,
    organization.id as orgId,
    organization.name as orgName,
    organization.logo as orgImg,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName,
    DATE_FORMAT(activity.start_time,'%Y-%m-%d') as start_time,
    DATE_FORMAT(activity.end_time,'%Y-%m-%d') as end_time
    
      from activity,organization,tag,activity_tag,volunteer_activity

      where 
      volunteer_activity.activity_id = activity.id and
      activity.organization_id = organization.id and
      activity.id = activity_tag.activity_id and
      tag.id = activity_tag.tag_id and
      organization.id = ? and
      volunteer_activity.volunteer_id = ? and
      volunteer_activity.status = 2

      GROUP BY 
      activity.id,
      organization.id,
      activity.name,
      organization.name,
      organization.logo,
      activity.start_time,
      activity.end_time,
      activity.location,
      activity.status,
      activity.img
      
      ORDER BY activity.start_time DESC
     `, [orgId,uid]);

    // let total = await this.app.mysql.query(`select 
    //    count(*) as total
    //    from activity,volunteer_activity
    //    where volunteer_activity.activity_id = activity.id and
    //    activity.organization_id = ? and
    //    volunteer_activity.volunteer_id = ? and
    //    volunteer_activity.status = 2
    //    `, [orgId,uid]);
    // total = total[0].total;
    // results.total = total;

    return rows && rows.map(item => {
      this.ctx.helper.resultToObject(item, 'tags', ['tagId', 'tagName'])
      return item;
    });
  }
  async getActListBelongToOrg({
    name,startTime,endTime,status
  }){
    let results = {};
    let rows = await this.app.mysql.query(`select
    activity.id,
    activity.name,
    activity.location,
    activity.status,
    activity.img,
    activity.recipient_number,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName,
    DATE_FORMAT(activity.start_time,'%Y-%m-%d') as start_time,
    DATE_FORMAT(activity.end_time,'%Y-%m-%d') as end_time
    DATE_FORMAT(activity.create_time,'%Y-%m-%d %H:%m:$s') as create_time
    
      from activity,tag,activity_tag,

      where activity.status in (${status}) and
      activity.organization_id = organization.id and
      activity.id = activity_tag.activity_id and
      tag.id = activity_tag.tag_id and
      activity.organization_id = ?

      GROUP BY 
      activity.id,
      activity.name,
      activity.start_time,
      activity.end_time,
      activity.create_time,
      activity.location,
      activity.status,
      activity.img
      activity.recipient_number
      
      ORDER BY activity.create_time DESC
      limit ? offset ?
     `, [uid, pageSize, pageSize * (page - 1)]);

    results.rows = rows.map(item => {
      this.ctx.helper.resultToObject(item, 'tags', ['tagId', 'tagName'])
      return item;
    })

    let total = await this.app.mysql.query(`select 
       count(*) as total
       from activity
       where activity.status in (${status}) and
       activity.organization_id = ?
       `, uid);

    total = total[0].total;
    results.total = total;
    return results;
  }
}

module.exports = ActivityService;
