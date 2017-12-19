'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    let result = await this.service.activity.getList({page:1});
    return this.ctx.body = result;
  }
}

module.exports = HomeController;
