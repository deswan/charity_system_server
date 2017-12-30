'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async getActList() {
    let { page = 1, tag = null } = this.ctx.query;
    tag && (tag = tag.split(','));
    let result = await this.service.activity.getList({ page, tag });
    return this.ctx.body = result;
  }
  async getCurrentActTags(){
    let result = await this.service.tag.getCurrent();
    return this.ctx.body = result;
  }
  async getActReviewList() {
    let result = await this.service.activity.getReviewList();
    return this.ctx.body = result;
  }
  async getVolInformation() {
    let result = await this.service.volunteer.getInformation();
    return this.ctx.body = result;
  }
  async getOrgList() {
    let { page = 1, tag = null } = this.ctx.query;
    (typeof tag == 'string') && (tag = tag.split(','));
    let result = await this.service.org.getList({ page, tag });
    return this.ctx.body = result;
  }
  async getOrgTags(){
    let result = await this.service.tag.getOrg();
    return this.ctx.body = result;
  }
  async getActivityById() {
    let { id } = this.ctx.query;
    if(!id){
      throw new Error('id is required');
    }
    let result = await this.service.activity.getActivityById(id);
    return this.ctx.body = result;
  }
  async getOrgById() {
    let { id } = this.ctx.query;
    if(!id){
      throw new Error('id is required');
    }
    let result = await this.service.org.getOrgById(id);
    return this.ctx.body = result;
  }
}

module.exports = HomeController;
