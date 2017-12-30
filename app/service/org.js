const Service = require('egg').Service;

class OrgService extends Service {
  async getList({ pageSize = 10, page, tag }) {
    let result = { page };
    let orgId = [];
    if (tag) {
      let orgs = await this.app.mysql.query(`select
        distinct organization_id as id
        from organization_tag
        ${tag.length ? `where tag_id in (?)` : ''}
       `, [tag]);
       if (!orgs.length) {
        Object.assign(results, {
          total: 0,
          rows: []
        })
        return results;
      }
      orgId = orgs.map(item => {
        return item.id
      })
    }
    let rows = await this.app.mysql.query(`select organization.id,
    organization.name,
    organization.slogan,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName
  from organization LEFT JOIN organization_tag ON organization.id = organization_tag.organization_id
    INNER JOIN tag ON organization_tag.tag_id = tag.id
    ${orgId.length ?  `where organization.id in (${orgId})` : ''}
    GROUP BY organization.id,organization.name,organization.slogan
    limit ? offset ?
     `, [pageSize, pageSize * (page - 1)]);

    let limitedOrgId = rows.map(item => {
      return item.id
    })

    let volCount = await this.app.mysql.query(`select organization.id,
     count(*) as vol_count
   from organization LEFT JOIN volunteer_organization ON organization.id = volunteer_organization.organization_id
   WHERE ${limitedOrgId.length ? limitedOrgId.length > 1 ? `organization.id in (${limitedOrgId}) and` : `organization.id = ${limitedOrgId} and` : ''}
   volunteer_organization.status = 2 
     GROUP BY organization.id`);

    let recipientCount = await this.app.mysql.query(`select organization.id,
     SUM(recipient_number) as recipient_count
   from organization LEFT JOIN activity ON organization.id = activity.organization_id
   WHERE ${limitedOrgId.length ? limitedOrgId.length > 1 ? `organization.id in (${limitedOrgId}) and` : `organization.id = ${limitedOrgId} and` : ''}
     activity.status = 3
     GROUP BY organization.id`);

    let total = await this.app.mysql.query(`select
      count(*) as total
      from organization
    ${orgId.length ? orgId.length > 1 ? `WHERE organization.id in (${orgId})` : `WHERE organization.id = ${orgId}` : ''}
     `);
    total = total[0].total;
    result.total = total;

    result.rows = rows.map((item, idx) => {
      item = this.ctx.helper.resultToObject(item, 'tags', ['tagId', 'tagName']);
      volCount.some(volItem => {
        if (volItem.id == item.id) {
          item.vol_count = volItem.vol_count;
          return true;
        }
      }) || (item.vol_count = 0);
      recipientCount.some(recipItem => {
        if (recipItem.id == item.id) {
          item.recipient_count = recipItem.recipient_count;
          return true;
        }
      }) || (item.recipient_count = 0);
      return item;
    })
    return result;
  }
  async getOrgById(id) {
    let org = await this.app.mysql.query(`select
    organization.id,
    organization.name,
    organization.logo,
    organization.slogan,
    GROUP_CONCAT(tag.id) as tagId,
    GROUP_CONCAT(tag.name) as tagName
    from organization LEFT JOIN organization_tag ON organization.id=organization_tag.organization_id
  LEFT JOIN tag ON organization_tag.tag_id=tag.id
  where organization.id = ?
    GROUP BY organization.id,
    organization.name,
    organization.logo,
    organization.slogan`, [id]);
    org = org[0];

    let volCount = await this.app.mysql.query(`select 
     count(*) as vol_count
   from organization LEFT JOIN volunteer_organization ON organization.id = volunteer_organization.organization_id
   where organization.id = ? and
   volunteer_organization.status = 2
   `, [id]);
    volCount = volCount && volCount[0].vol_count || 0;

    let recipientCount = await this.app.mysql.query(`select
   SUM(recipient_number) as recipient_count
 from organization LEFT JOIN activity ON organization.id = activity.organization_id
 where organization.id = ? and
   activity.status = 3`, [id]);
    recipientCount = recipientCount && recipientCount[0].recipient_count || 0;

    let userStatus;
    if (!this.ctx.session.uid) {
      userStatus = 'NO_LOGIN'
    } else {
      let ret = await this.app.mysql.get('volunteer_organization', {
        volunteer_id: this.ctx.session.uid,
        organization_id: id,
        status: 2
      })
      if (ret) {
        userStatus = 'JOINED'
      } else {
        userStatus = 'NO_JOIN'
      }
    }

    org.volCount = volCount;
    org.recipientCount = recipientCount;
    org.userStatus = userStatus;

    let currentActs = await this.app.mysql.query(`
    select id,name,location,img,
    DATE_FORMAT(start_time,'%Y-%m-%d') as start_time
    from activity
    where status in (0,1,2) and 
    organization_id = ?
    order by create_time desc
    `, [id])

    let previousActs = await this.app.mysql.query(`
    select
  activity.id,
  activity.name,
  group_concat(tag.id) as tagId,
  group_concat(tag.name) as tagName
  from activity LEFT JOIN activity_tag ON activity.id = activity_tag.activity_id
LEFT JOIN tag ON tag.id=activity_tag.tag_id
where activity.status = 3 and
activity.organization_id = ?
GROUP BY activity.id,activity.name,start_time
ORDER BY start_time DESC
limit 10
    `, [id])

    if (previousActs) {
      let actIds = previousActs.map(item => {
        return item.id;
      })

      let previousActsDetail = await this.app.mysql.query(`
      select
      activity.id,
      AVG(score) as rate,
      GROUP_CONCAT(photos) as photos
    from activity LEFT JOIN volunteer_activity ON activity.id = volunteer_activity.activity_id
  where ${actIds.length > 1 ? 'activity.id in (?)' : 'activity.id = ?'}
  GROUP BY activity.id
      `, [actIds])

      previousActs.map(act => {
        previousActsDetail.some(item => {
          if (act.id == item.id) {
            act.rate = item.rate || 0;
            act.photos = item.photos && item.photos.split(',').slice(0, 4).join(',');
            return true;
          }
        })
        console.log()
        return this.ctx.helper.resultToObject(act,'tags',['tagId','tagName'])
      })
    }
    org.currentActs = currentActs;
    org.previousActs = previousActs;
    org = this.ctx.helper.resultToObject(org,'tags',['tagId','tagName'])
    return org;
  }
}

module.exports = OrgService;
