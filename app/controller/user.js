'use strict';

const Controller = require('egg').Controller;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
class UserController extends Controller {
  async login() {
    try {
      this.ctx.validate({
        account: {
          require: true,
          type: 'string'
        },
        password: {
          require: true,
          type: 'string'
        }
      })
    } catch (err) {
      this.ctx.logger.warn(err.errors);
      return this.ctx.body = err.errors[0];
    }
    let {account,password} = this.ctx.request.body;
    let result = await this.service.user.login(account,password);
    if (result) {
      this.ctx.session.uid = result.id;
      return this.ctx.body = { code: 0 };
    } else {
      return this.ctx.body = { code: 1 };
    }
  }
  async registry() {
    try {
      this.ctx.validate({
        name: {
          require: true,
          type: 'string',
          max: 30
        },
        gender: {
          require: true,
          type: 'enum',
          values: ['0', '1']
        },
        native: {
          require: true,
          type: 'string',
        },
        id_card: {
          require: true,
          type: 'string',
          max: 30
        },
        birthday: {
          require: true,
          type: 'date',
        },
        email: {
          require: true,
          type: 'email',
        },
        password: {
          require: true,
          type: 'password',
          max: 50
          //min:6
        },
        phone: {
          require: true,
          type: 'string',
          max: 20
        },
      })
    } catch (err) {
      this.ctx.logger.warn(err.errors);
      return this.ctx.body = err.errors[0];
    }
    let result = await this.service.user.registry(this.ctx.request.body);
    if (result.affectedRows == 1) {
      this.ctx.session.uid = result.insertId;
      return this.ctx.body = { code: 0 };
    } else {
      return this.ctx.body = { code: 1, message: result.message };
    }
  }
  async uploadPhoto() {
    const ctx = this.ctx;
    const stream = await ctx.getFileStream();
    const hmac = crypto.createHmac('sha256', this.config.keys);
    hmac.update(path.basename(stream.filename));
    const name = hmac.digest('hex') + Date.now() + path.extname(stream.filename);
    let writeStream = fs.createWriteStream('./app/public/photo/' + name, err => {
      throw err;
    })
    stream.pipe(writeStream);
    return ctx.body = '/public/photo/' + name;
  }
  async getUser() {
    let id = this.ctx.session.uid;
    if (!id) {
      return this.ctx.body = { status: 1 } //未登陆
    } else {
      let ret = await this.app.mysql.get('volunteer', { id })
      delete ret.password;
      let orgs = await this.app.mysql.query(`
      select organization.id, organization.name,organization.logo
      from volunteer_organization INNER JOIN organization ON organization.id = volunteer_organization.organization_id
      where volunteer_organization.status = 2 and
      volunteer_organization.volunteer_id = ?
      `, [id])
      let adminOrgs = await this.app.mysql.select('organization',{
        columns:['id','name','logo'],
        where:{creater_volunteer_id:id},
        orders:[['create_time','desc']]
      })
      return this.ctx.body = { status: 0, data: ret, orgs,adminOrgs };
    }
  }
  async getMyActs() {
    let uid = this.ctx.session.uid;
    let { page, status, name, start_time, end_time } = this.ctx.query;
    !page && (page = 1);
    if (!uid) {
      throw new Error('not login');
      return;
    }
    let acts;
    if (name || start_time || end_time) {

    } else {
      if (!status) {
        throw new Error('status is required');
        return;
      }
      if (status !== '0' && status !== '1') {
        throw new Error('status must be 0 or 1');
        return;
      }
      acts = await this.service.activity.getMyActsByStatus({ uid, page, status })
    }
    return this.ctx.body = acts;
  }
  async getMyOrgById() {
    let uid = this.ctx.session.uid;
    let { id:orgId } = this.ctx.query;
    if (!orgId) {
      throw new Error('orgId is required')
    }
    if (!uid) {
      throw new Error('not login');
      return;
    }
    let org;
    org = await this.service.org.getOrgById(orgId)
    org.myActs = await this.service.activity.getMyActsByOrg(orgId,uid);
    return this.ctx.body = org;
  }
  async getNotice(){
    let uid = this.ctx.session.uid;
    if (!uid) {
      throw new Error('not login');
      return;
    }
    let ret = await this.service.notice.getList(uid);
    return this.ctx.body = ret;
  }
  async createOrg(){
    let uid = this.ctx.session.uid;
    if (!uid) {
      throw new Error('not login');
      return;
    }
    let ret = await this.service.org.create(uid,this.ctx.request.body);
    return this.ctx.body = ret;
  }
  async applyAct(){
    let { actId,text } = this.ctx.request.body;
    let uid = this.ctx.session.uid;
    if (!uid) {
      throw new Error('not login');
      return;
    }
    let result = await this.service.activity.apply(actId,this.ctx.session.uid,text);
    return this.ctx.body = result;
  }
  async quitAct(){
    let { actId } = this.ctx.request.body;
    let uid = this.ctx.session.uid;
    if (!uid) {
      throw new Error('not login');
      return;
    }
    let result = await this.service.volunteer.quitAct(actId,this.ctx.session.uid);
    return this.ctx.body = result;
  }
}

module.exports = UserController;
