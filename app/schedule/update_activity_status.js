const Subscription = require('egg').Subscription;
const moment = require('moment');

class UpdateActivityStatus extends Subscription {
    // 通过 schedule 属性来设置定时任务的执行间隔等配置
    static get schedule() {
        return {
            interval: '5m', // 1 分钟间隔
            type: 'worker', // 指定所有的 worker 都需要执行
        };
    }

    // subscribe 是真正定时任务执行时被运行的函数
    async subscribe() {
        let res = await this.app.mysql.query(`
    select id,
    DATE_FORMAT(start_time,'%Y-%m-%d %H:%i:%s') as start_time,
    DATE_FORMAT(end_time,'%Y-%m-%d %H:%i:%s') as end_time,
    status
    from activity
    where status in (0,1,2)
    `)
        let tasks = []
        res.forEach(row => {
            if (moment().isSameOrAfter(row.end_time)) {
                this.app.logger.info(`update_activity:${row.id}-3`)
                tasks.push(this.service.activity.updateActStauts(row.id, 3))
            } else if (moment().isSameOrAfter(row.start_time)) {
                this.app.logger.info(`${moment().format('YYYY-MM-DD H:m:s')}:update_activity:${row.id}-2`)
                tasks.push(this.service.activity.updateActStauts(row.id, 2))
            } else if (moment().isSameOrAfter(moment(row.start_time).subtract(1, 'days'))) {
                this.app.logger.info(`update_activity:${row.id}-1`)
                tasks.push(this.service.activity.updateActStauts(row.id, 1))
            }
        })
        return await Promise.all(tasks);
    }
}

module.exports = UpdateActivityStatus;