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
}

module.exports = AdminController;
