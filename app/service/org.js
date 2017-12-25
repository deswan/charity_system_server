const Service = require('egg').Service;

class OrgService extends Service {
  async getList({pageSize = 10,page,tag}) {
    let result = {page};
    let orgId = [];
    if(tag && tag.length){
      orgId = await this.app.mysql.query(`select
        distinct organization_id as id
        from organization_tag
        ${tag.length > 1 ? `where tag_id in (?)` : `where tag_id = ?`}
       `, [tag]);
       orgId = orgId.map(item=>{
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
    ${orgId.length ? orgId.length > 1 ? `where organization.id in (${orgId})` : `where organization.id = ${orgId}` : '' }
    GROUP BY organization.id,organization.name,organization.slogan
    ORDER BY organization.id
    limit ? offset ?
     `,[pageSize, pageSize * (page - 1)]);

     let volCount = await this.app.mysql.query(`select organization.id,
     count(*) as vol_count
   from organization LEFT JOIN volunteer_organization ON organization.id = volunteer_organization.organization_id
   WHERE ${orgId.length ? orgId.length > 1 ? `organization.id in (${orgId}) and` : `organization.id = ${orgId} and` : '' }
   volunteer_organization.status = 2 
     GROUP BY organization.id
    limit ? offset ?
     `,[pageSize, pageSize * (page - 1)]);

     let recipientCount = await this.app.mysql.query(`select organization.id,
     SUM(recipient_number) as recipient_count
   from organization LEFT JOIN activity ON organization.id = activity.organization_id
   WHERE ${orgId.length ? orgId.length > 1 ? `organization.id in (${orgId}) and` : `organization.id = ${orgId} and` : '' }
     activity.status = 3
     GROUP BY organization.id
    limit ? offset ?
     `,[pageSize, pageSize * (page - 1)]);

    let total = await this.app.mysql.query(`select
      count(*) as total
      from organization
    ${orgId.length ? orgId.length > 1 ? `WHERE organization.id in (${orgId})` : `WHERE organization.id = ${orgId}` : '' }
     `);
    total = total[0].total;
    result.total = total;

    result.rows = rows.map((item,idx)=>{
        item = this.ctx.helper.resultToObject(item,'tags',['tagId','tagName']);
        volCount.some(volItem=>{
            if(volItem.id == item.id){
                item.vol_count = volItem.vol_count;
                return true;
            }
        }) || (item.vol_count = 0);
        recipientCount.some(recipItem=>{
            if(recipItem.id == item.id){
                item.recipient_count = recipItem.recipient_count;
                return true;
            }
        }) || (item.recipient_count = 0);
        return item;
    })
    return result;
  }
}

module.exports = OrgService;
