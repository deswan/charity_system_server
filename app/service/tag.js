const Service = require('egg').Service;

class TagService extends Service {
    async getCurrent() {
        return await this.app.mysql.query(`select 
        distinct tag.id,tag.name
        from activity inner join activity_tag on activity_tag.activity_id = activity.id
        inner join tag on activity_tag.tag_id = tag.id
        where activity.status in (0,1)
       `);
    }
    async getOrg() {
        return await this.app.mysql.query(`select 
        distinct tag.id,tag.name
        from organization_tag inner join tag on organization_tag.tag_id = tag.id
       `);
    }
    async getAllTags(){
        return await this.app.mysql.select('tag')
    }
}

module.exports = TagService;
