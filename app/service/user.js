const Service = require('egg').Service;
const crypto = require('crypto');
class UserService extends Service {
  async registry({
    avatar, name, gender, birthday, id_card, email, phone, password
  }) {
    const hmac = crypto.createHmac('sha256', this.config.keys);
    hmac.update(password);
    return await this.app.mysql.insert('volunteer', {
      name, birthday, id_card, email, phone,
      gender: parseInt(gender),
      portrait: avatar || null,
      password: hmac.digest('hex')
    });
  }
  async login(account, password) {
    const hmac = crypto.createHmac('sha256', this.config.keys);
    hmac.update(password);
    let psw = hmac.digest('hex')
    let emailRet = await this.app.mysql.get('volunteer', {
      email: account,
      password: psw
    });
    if (emailRet) {
      return emailRet;
    }
    let phoneRet = await this.app.mysql.get('volunteer', {
      phone: account,
      password: psw
    });
    return phoneRet;
  }
}

module.exports = UserService;
