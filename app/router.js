'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const adminauth = app.middlewares.adminauth({},app);
  const userauth = app.middlewares.userauth({},app);
  const guest = app.middlewares.guest({},app);
  router.get('/api/getActList', controller.home.getActList);  //获取未开始活动列表
  router.get('/api/getCurrentActTags', controller.home.getCurrentActTags);  //获取未开始活动的所有tag
  router.get('/api/getActReviewList', controller.home.getActReviewList);  //获取已结束活动8个（根据活动开始时间排序）
  router.get('/api/getOrgList', controller.home.getOrgList);  //获取组织列表
  router.post('/api/registry', controller.user.registry);
  router.post('/api/login', guest,controller.user.login);
  router.post('/api/uploadPhoto', controller.user.uploadPhoto);
  router.get('/api/getActivityById', controller.home.getActivityById);  //获取活动详情
  router.get('/api/getOrgById', controller.home.getOrgById);  //获取组织详情
  router.get('/api/getUser', controller.user.getUser);  //获取登录信息
  router.get('/api/getOrgTags', controller.home.getOrgTags);  //获取所有组织tag

  router.get('/api/getAllTags', controller.admin.getAllTags);  //获取所有tag
  router.post('/api/sponsor', controller.home.sponsor); //赞助活动

  //已登录用户权限
  router.get('/api/getMyActs', userauth,controller.user.getMyActs); //获取我的活动
  router.get('/api/getMyOrgById', userauth,controller.user.getMyOrgById); //获取我的义工组织
  router.get('/api/getNotice',userauth, controller.user.getNotice); //获取消息
  router.post('/api/applyAct',userauth, controller.user.applyAct);  //申请活动
  router.post('/api/applyOrg',userauth, controller.user.applyOrg);  //申请加入义工组织
  router.post('/api/quitAct',userauth, controller.user.quitAct);  //退出活动
  router.post('/api/score',userauth,controller.user.score); //评价活动
  router.get('/api/logout',userauth, controller.user.logout); 
  router.post('/api/createOrg',userauth, controller.user.createOrg);  //创建组织

  //组织管理者权限
  router.get('/api/getActListBelongToOrg',adminauth, controller.admin.getActListBelongToOrg); //获取活动列表
  router.post('/api/createAct', adminauth,controller.admin.createAct);  //创建活动
  router.get('/api/getTodos', adminauth,controller.admin.getTodos); //获取待办
  router.get('/api/getVolList', adminauth,controller.admin.getVolList); //获取义工列表
  router.get('/api/getOrgProfileById',adminauth, controller.admin.getOrgProfileById); //获取组织资料
  router.post('/api/updateOrgProfile',adminauth, controller.admin.updateOrg); //编辑组织资料
  router.post('/api/updateActProfile',adminauth, controller.admin.updateAct); //编辑活动信息
  router.post('/api/updateApplication',adminauth, controller.admin.updateApplication);  //同意、拒绝活动
  router.get('/api/getActByIdInAdmin',adminauth, controller.admin.getActById);  //获取活动详情
  router.post('/api/cancelAct',adminauth, adminauth,controller.admin.cancelAct);  //取消活动
};
