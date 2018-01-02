'use strict';
const Controller = require('egg').Controller;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
class AdminController extends Controller {
  async getActListBelongToOrg() {
    let {name,startTime,endTime,status} = this.ctx.query;
  }
}

module.exports = AdminController;
