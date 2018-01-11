module.exports = (options, app) => {
    return async function adminauth(ctx, next) {
        let orgId = ctx.query.orgId || ctx.request.body.orgId;
        let uid = ctx.session.uid;
        if (!orgId || !uid) {
            throw new Error('not auth')
            return;
        }
        let ret = await app.mysql.get('organization', {
            id: orgId, creater_volunteer_id: uid
        })
        if (!ret) {
            throw new Error('not auth')
            return;
        }
        return next();
    };
};
