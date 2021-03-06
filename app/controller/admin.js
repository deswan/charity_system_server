'use strict';
const Controller = require('egg').Controller;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
class AdminController extends Controller {
  async getActListBelongToOrg() {
    let {orgId,name,startTime,endTime,status,page} = this.ctx.query;
    let ret = await this.service.activity.getActListBelongToOrg({orgId,name,startTime,endTime,status,page});
    return this.ctx.body = ret;
  }
  async createAct() {
    let {orgId,avatar,startDate,endDate,location,name,recipient_number,tags} = this.ctx.request.body;
    let ret = await this.service.activity.create({orgId,avatar,startDate,endDate,location,name,recipient_number,tags});
    return this.ctx.body = {code:0};
  }
  async getVolList(){
    let {orgId,name} = this.ctx.query;
    let vols = await this.service.volunteer.getListByOrg({orgId,name});
    return this.ctx.body = vols;
  }
  async getTodos(){
    let {orgId} = this.ctx.query;
    let ret = []
    let volToActs = await this.service.activity.getApplingByOrg(orgId);
    let volToOrgs = await this.service.org.getApplingByOrg(orgId);
    let sponsorsToAct = await this.service.sponsor.getApplingByOrg(orgId);
    ret = ret.concat(volToActs,volToOrgs,sponsorsToAct);
    ret.sort((a,b)=>{
      return new Date(b.create_time) - new Date(a.create_time);
    })
    ret.forEach((item,idx)=>{
      if(item.type == 0){
        item.user = {
          id:item.id,
          name:item.name,
          img:item.portrait,
          apply_text:item.application_text
        }
        delete item.id;
        delete item.name;
        delete item.portrait;
        delete item.application_text;
      }else if(item.type == 1){
        item.user = {
          id:item.id,
          name:item.name,
          img:item.portrait,
          apply_text:item.application_text
        }
        delete item.id;
        delete item.name;
        delete item.portrait;
        delete item.application_text;
        item.act = {
          id:item.act_id,
          name:item.act_name,
        }
        delete item.act_id;
        delete item.act_name;
      }else{
        item.sponsor = {
          name:item.name,
          img:item.logo,
          amount:item.amount,
          address:item.phone
        }
        delete item.name;
        delete item.logo;
        delete item.amount;
        delete item.phone;
        item.act = {
          id:item.act_id,
          name:item.act_name,
        }
        delete item.act_id;
        delete item.act_name;
      }
      item.id = idx;
    })
    return this.ctx.body = ret;
  }
  async getAllTags(){
    return this.ctx.body = await this.service.tag.getAllTags();
  }
  async getOrgProfileById(){
    let {orgId} = this.ctx.query;
    return this.ctx.body = await this.service.org.getOrgProfileById(orgId);
  }
  async updateOrg(){
    let {orgId} = this.ctx.query;
    let fields = this.ctx.request.body;
    delete fields.orgId
    return this.ctx.body = await this.service.org.update(orgId,fields);
  }
  async updateAct(){
    let fields = this.ctx.request.body;
    let actId = fields.actId;
    delete fields.actId;
    delete fields.orgId;
    return this.ctx.body = await this.service.activity.update(actId,fields);
  }
  async updateApplication(){
    let {type,id,action} = this.ctx.request.body;
    let service;
    switch (type){
      case 0:service = this.service.org;break;
      case 1:service = this.service.activity;break;
      case 2:service = this.service.sponsor;break;
    }
    let ret = await service.updateStatus(id,action);
    return this.ctx.body = ret;
  }
  async getActById(){
    let {actId} = this.ctx.query;
    let ret = await this.service.activity.getActByIdInAdmin(actId);
    return this.ctx.body = ret;
  }
  async cancelAct(){
    let {actId} = this.ctx.request.body;
    //validate orgId-actId
    let ret = await this.service.activity.cancel(actId);
    return this.ctx.body = ret;
  }
}

module.exports = AdminController;
