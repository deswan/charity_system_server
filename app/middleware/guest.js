module.exports = (options, app) => {
    return async function guest(ctx, next) {
        let uid = ctx.session.uid;
        if (uid) {
            throw new Error('you had logined!')
            return;
        }
        return next();
    };
};