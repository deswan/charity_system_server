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
        where status = 0 and
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
      status = 0
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
      DATE_FORMAT(activity.start_time,'%Y-%m-%d %H:%i:%s') as start_time,
      DATE_FORMAT(activity.end_time,'%Y-%m-%d %H:%i:%s') as end_time,
      activity.status,
      activity.name,
      activity.img,
      DATE_FORMAT(activity.create_time,'%Y-%m-%d %H:%i:%s') as create_time,
      activity.location,
      activity.recipient_number,
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
      organization.id,
      organization.name,
      organization.logo,
      organization.slogan`, [id]);
    data = data[0]

    if (!data) {
      throw new Error('id not exist');
      return;
    }

    let volCount = await this.app.mysql.query(`
    select count(*) as count
    from volunteer_activity
    where activity_id = ? and status = 2
    `, [id])
    data.vol_count = volCount[0] && volCount[0].count || 0;

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
      where: { status: 2, activity_id: id }, // WHERE 条件
      columns: ['name', 'amount', 'logo'], // 要查询的表字段
      orders: [['create_time', 'desc']],
    })
    data.sponsors = sponsors;

    data = this.ctx.helper.resultToObject(data, 'tags', ['tagId', 'tagName']);
    return this.ctx.body = data;
  }
  async getActByIdInAdmin(id) {
    let act = await this.getActivityById(id);
    act.volunteers = await this.app.mysql.query(`
    select volunteer.id,volunteer.name,volunteer.portrait
    from volunteer,volunteer_activity
    where activity_id = ? and volunteer_activity.status = 2 and
      volunteer.id = volunteer_activity.volunteer_id
    order by volunteer_activity.create_time DESC
    `, [id])
    let sponsor = await this.app.mysql.query(`select
   sum(amount) as amount
  from sponsor
  where activity_id = ? AND
    status = 2
    group by activity_id
     `, [id]);
    act.sponsor_count = sponsor[0] && sponsor[0].amount || 0;
    return act;
  }

  async getMyActsByStatus({
    uid, page, status, pageSize = 15
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
    volunteer_activity.isScored+0 as isScored,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName,
    DATE_FORMAT(activity.start_time,'%Y-%m-%d %H:%i:%s') as start_time,
    DATE_FORMAT(activity.end_time,'%Y-%m-%d %H:%i:%s') as end_time
    
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
      activity.img,
      volunteer_activity.isScored
      
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
  async getMyActsByOrg(orgId, uid) {
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
    DATE_FORMAT(activity.start_time,'%Y-%m-%d %H:%i:%s') as start_time,
    DATE_FORMAT(activity.end_time,'%Y-%m-%d %H:%i:%s') as end_time
    
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
     `, [orgId, uid]);

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
    orgId, name, startTime, endTime, status, pageSize = 10, page = 1
  }) {
    if (name) {
      let nameArr = name.split('');
      nameArr.push('%');
      nameArr.unshift('%');
      name = nameArr.join('')
    }
    status == -1 && (status = [0, 1, 2, 3, 4]);
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
    DATE_FORMAT(activity.start_time,'%Y-%m-%d %H:%i:%s') as start_time,
    DATE_FORMAT(activity.end_time,'%Y-%m-%d %H:%i:%s') as end_time,
    DATE_FORMAT(activity.create_time,'%Y-%m-%d %H:%i:%s') as create_time
    
      from activity,tag,activity_tag

      where activity.status in (?) and
      activity.id = activity_tag.activity_id and
      tag.id = activity_tag.tag_id and
      activity.organization_id = ?
      ${startTime ? `and activity.start_time >= ${this.app.mysql.escape(startTime)}` : ''}
      ${endTime ? `and activity.end_time <= ${this.app.mysql.escape(endTime)}` : ''}
      ${name ? `and activity.name like ${this.app.mysql.escape(name)}` : ''}

      GROUP BY 
      activity.id,
      activity.name,
      activity.start_time,
      activity.end_time,
      activity.create_time,
      activity.location,
      activity.status,
      activity.img,
      activity.recipient_number
      
      ORDER BY activity.create_time DESC
      limit ? offset ?
     `, [status, orgId, pageSize, pageSize * (page - 1)]);


    if (rows.length) {
      let actsId = rows.map(item => {
        return item.id;
      })
      let volData = await this.app.mysql.query(`SELECT
      activity_id as id,
      count(*) as vol_count,
      sum(isScored) as score_count
      from volunteer_activity
      where activity_id in (?) AND
        status = 2
      GROUP BY activity_id
       `, [actsId]);

      let sponsorData = await this.app.mysql.query(`select
      activity_id as id,
     sum(amount) as amount
    from sponsor
    where activity_id in (?) AND
      status = 2
      group by activity_id
       `, [actsId]);

      rows.forEach(item => {
        item.vol_count = 0;
        item.score_count = 0;
        item.sponsor_amount = 0;
        volData.forEach(vol => {
          if (item.id === vol.id) {
            item.vol_count = vol.vol_count;
            item.score_count = vol.score_count;
          }
        })
        sponsorData.forEach(vol => {
          if (item.id === vol.id) {
            item.sponsor_amount = vol.sponsor_amount;
          }
        })
      })

      rows = rows.map(item => {
        this.ctx.helper.resultToObject(item, 'tags', ['tagId', 'tagName'])
        return item;
      })
    }

    results.rows = rows;

    let total = await this.app.mysql.query(`select 
       count(*) as total
       from activity
       where activity.status in (${status}) and
       activity.organization_id = ?
       `, [orgId]);

    total = total[0].total;
    results.total = total;
    return results;
  }
  //创建活动
  async create({ orgId, avatar, startDate, endDate, location, name, recipient_number, tags }) {
    await this.app.mysql.beginTransactionScope(async conn => {
      let ret = await conn.insert('activity', {
        img: avatar,
        start_time: startDate,
        end_time: endDate,
        location,
        name,
        recipient_number,
        organization_id: orgId,
        status: 0,
        create_time: this.app.mysql.literals.now
      })
      let promises = []
      tags.split(',').forEach(tagId => {
        promises.push(this.app.mysql.insert('activity_tag', {
          activity_id: ret.insertId,
          tag_id: tagId
        }))
      })
      await Promise.all(promises)
      return { success: true };
    }, this.ctx);
  }
  //获取正在申请中的活动
  async getApplingByOrg(orgId) {
    return await this.app.mysql.query(`select
    volunteer_activity.id as item_id,
    activity.id as act_id,
    activity.name as act_name,
    DATE_FORMAT(volunteer_activity.create_time,'%Y-%m-%d %H:%i:%s') as create_time,
    volunteer.id,
    volunteer.name,
    volunteer.portrait,
    volunteer_activity.application_text,
    1 as type
    from activity,volunteer_activity,volunteer
  where activity.id = volunteer_activity.activity_id AND
    volunteer.id = volunteer_activity.volunteer_id AND
    activity.organization_id = ? AND
    volunteer_activity.status  = 0`, [orgId])
  }
  //更新申请状态
  async updateStatus(id, status) {
    let v_a = await this.app.mysql.get('volunteer_activity', { id })
    if (!v_a) {
      throw new Error('id not exist');
      return;
    }
    let actId = v_a.activity_id;
    let act = await this.app.mysql.get('activity', { id: actId })
    if (act.status !== 0) {
      throw new Error('活动状态已变为 ' + this.ctx.headers.getActStatusText(act.status) + ' ，无法操作申请');
      return;
    }

    //todo:validate apply status

    await this.app.mysql.update('volunteer_activity', {
      id, status
    })

    let insertRet =  await this.app.mysql.insert('notice', {
      target_name:act.name,
      target_type:1,
      type:1,
      statusText:status == 2 ? '接收' : '拒绝',
      volunteer_id:v_a.volunteer_id,
      create_time:this.app.mysql.literals.now
    })
    this.ctx.logger.info(insertRet)
    return { code: 0 };
  }
  //更新活动状态
  async updateActStauts(id, status) {
    let act = await this.app.mysql.get('activity', { id })
    if (!act) {
      throw new Error('id not exist');
      return;
    }
    await this.app.mysql.update('activity', {
      id, status
    })
    let vols = await this.app.mysql.select('volunteer_activity',{
      columns:['volunteer_id'],
      where:{activity_id:id}
    })
    let tasks = [];
    vols.forEach(vol=>{
      tasks.push(this.app.mysql.insert('notice', {
        target_name:act.name,
        type:0,
        statusText:this.ctx.helper.getActStatusText(status),
        volunteer_id:vol.volunteer_id,
        create_time:this.app.mysql.literals.now
      }))
    })
    await Promise.all(tasks);
    return { code: 0 };
  }
  //更新活动profile
  async update(actId, fields) {
    let result;
    fields.id = actId;

    if (!fields.tags) {
      result = await this.app.mysql.update('activity', fields);
    } else {
      let tags = fields.tags.split(',');
      delete fields.tags;
      await this.app.mysql.update('activity', fields);
      let promises = [];
      await this.app.mysql.delete('activity_tag', {
        activity_id: actId,
      });
      promises = tags.map(id => {
        return this.app.mysql.insert('activity_tag', {
          tag_id: id,
          activity_id: actId
        })
      })
      await Promise.all(promises)
    }
    return { code: 0 };
  }
  //获取活动与用户的关系
  async getUserRelation(actId, uid) {
    if (!uid) {
      return 'NOT_LOGIN'
    }
    let orgRet = await this.app.mysql.query(`
      select activity.id
    from volunteer_organization,activity
where activity.organization_id = volunteer_organization.organization_id AND
    activity.id = ? AND volunteer_id = ? AND volunteer_organization.status = 2
      `, [actId, uid])
    if (!orgRet.length) {
      return 'NOT_ORG'
    }
    let actRet = await this.app.mysql.query(`
      select id
    from volunteer_activity
where activity_id = ? AND volunteer_id = ? AND status = 2
      `, [actId, uid])
    if (!actRet.length) {
      return 'NOT_JOIN'
    }
    return 'JOINED';
  }
  async apply(actId, uid, text) {
    let ret = await this.app.mysql.get('volunteer_activity', {
      volunteer_id: uid,
      activity_id: actId
    })
    if (ret) {
      throw new Error('您已申请该活动');
      return;
    }
    let actRet = await this.app.mysql.get('activity', {
      id: actId
    })
    if (!actRet) {
      throw new Error('id not exist');
      return;
    }
    if (actRet.status !== 0) {
      throw new Error('活动状态有误');
      return;
    }
    let insertRet = await this.app.mysql.insert('volunteer_activity', {
      volunteer_id: uid,
      activity_id: actId,
      status: 0,
      application_text: text,
      create_time: this.app.mysql.literals.now
    })
    if (insertRet.affectedRows !== 1) {
      return { code: 1 }
    }
    return { code: 0 }
  }
  async cancel(id) {
    let ret = await this.app.mysql.get('activity', { id })
    if (!ret) {
      throw new Error('id not exist');
      return;
    }
    if (ret.status === 3 || ret.status === 4) {
      throw new Error('活动状态错误');
      return;
    }
    await this.app.mysql.update('activity', {
      id, status: 4
    })
    return { code: 0 };
  }
  async score(uid,params){
    let r = await this.app.mysql.get('volunteer_activity', {
      volunteer_id:uid,
      activity_id:params.actId
    })
    let ret = await this.app.mysql.update('volunteer_activity', {
      id:r.id,
      score:params.score,
      comment:params.comment,
      photos:params.photos,
      isScored:1,
      score_time: this.app.mysql.literals.now
    })
    return {code:0}
  }
}

module.exports = ActivityService;
