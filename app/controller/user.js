'use strict';

const Controller = require('egg').Controller;
const path = require('path');
class UserController extends Controller {
  async login() {
    let { page = 1, tag = null } = this.ctx.query;
    (typeof tag == 'string') && (tag = tag.split(','));
    let result = await this.service.org.getList({ page, tag });
    return this.ctx.body = result;
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
          values:['0','1']
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
    return this.ctx.body = {code:0};
  }
  async uploadPhoto(){
    const ctx = this.ctx;
    const stream = await ctx.getFileStream();
    const name = 'egg-multipart-test/' + path.basename(stream.filename);
    // 文件处理，上传到云存储等等
    let result;
    console.log(stream)
    // try {
    //   result = await ctx.oss.put(name, stream);
    // } catch (err) {
    //   // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
    //   throw err;
    // }
    ctx.body = stream
  }
}

module.exports = UserController;
