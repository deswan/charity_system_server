const Service = require('egg').Service;
const crypto = require('crypto');
class UserService extends Service {
  async getUserStatus({ page, tag, pageSize = 20 }) {
  }
  async registry({
    avatar, name, gender, birthday, native, id_card, email, phone, password
  }) {
    const hmac = crypto.createHmac('sha256', this.config.keys);
    hmac.update(password);
    const result = await this.app.mysql.insert('volunteer', {
      name, birthday, native, id_card, email, phone,
      gender:parseInt(gender),
      portrait: avatar || null, 
      password: hmac.digest('hex')
    });
  }
}

module.exports = UserService;