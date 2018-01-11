module.exports = (options, app) => {
    return async function userauth(ctx, next) {
        let uid = ctx.session.uid;
        if (!uid) {
            throw new Error('not auth')
            return;
        }
        return next();
    };
};