module.exports = (options, app) => {
    return async function user_auth(ctx, next) {
        let uid = ctx.session.uid;
        if (!uid) {
            throw new Error('not auth')
            return;
        }
        return next();
    };
};
