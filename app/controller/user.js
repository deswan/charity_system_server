'use strict';

const Controller = require('egg').Controller;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
class UserController extends Controller {
  async login() {
    try {
      this.ctx.validate({
        emailOrPhone: {
          require: true,
          type: 'string'
        },
        password: {
          require: true,
          type: 'string'
        },
        field: {
          require: true,
          type: 'enum',
          values: ['email', 'phone']
        }
      })
    } catch (err) {
      this.ctx.logger.warn(err.errors);
      return this.ctx.body = err.errors[0];
    }
    let result = this.service.user.login(this.ctx.request.body);
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
  async getInformation() {

  }
}

module.exports = UserController;
